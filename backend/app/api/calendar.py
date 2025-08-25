from flask import Blueprint, jsonify, request, current_app
import google.oauth2.credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import Flow
from datetime import datetime
from app.services.gemini_service import get_gemini_response
# Используем наш wrapper вместо прямого импорта
from app.utils.jwt_wrapper import jwt_required, get_jwt_identity
import os
import json

calendar_blueprint = Blueprint('calendar', __name__)

# Constants
CLIENT_SECRET_FILE = os.environ.get('GOOGLE_CLIENT_SECRET_FILE', 'client_secret.json')
SCOPES = ['https://www.googleapis.com/auth/calendar']
REDIRECT_URI = os.environ.get('GOOGLE_CALENDAR_REDIRECT_URI', 'http://localhost:5173/secretary')

# Helper to load user's calendar credentials
def get_user_calendar_creds(user_id):
    # In a real application, you would fetch this from a database
    creds_path = f"user_data/{user_id}/calendar_credentials.json"
    if os.path.exists(creds_path):
        with open(creds_path, 'r') as f:
            creds_data = json.load(f)
            return google.oauth2.credentials.Credentials(
                token=creds_data.get('token'),
                refresh_token=creds_data.get('refresh_token'),
                token_uri=creds_data.get('token_uri'),
                client_id=creds_data.get('client_id'),
                client_secret=creds_data.get('client_secret'),
                scopes=creds_data.get('scopes')
            )
    return None

# Helper to save user's calendar credentials
def save_user_calendar_creds(user_id, credentials):
    os.makedirs(f"user_data/{user_id}", exist_ok=True)
    creds_data = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    with open(f"user_data/{user_id}/calendar_credentials.json", 'w') as f:
        json.dump(creds_data, f)

# Helper to get user's calendar config
def get_user_calendar_config(user_id):
    config_path = f"user_data/{user_id}/calendar_config.json"
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return json.load(f)
    return {
        "enabled": False,
        "calendarId": "primary",
        "allowEventCreation": False,
        "allowEventModification": False
    }

# Helper to save user's calendar config
def save_user_calendar_config(user_id, config):
    os.makedirs(f"user_data/{user_id}", exist_ok=True)
    with open(f"user_data/{user_id}/calendar_config.json", 'w') as f:
        json.dump(config, f)


@calendar_blueprint.route('/connect', methods=['POST'])
@jwt_required()
def connect_calendar():
    user_id = get_jwt_identity()
    auth_code = request.json.get('auth_code')
    
    if not auth_code:
        return jsonify({"success": False, "error": "Authorization code is required"}), 400
    
    try:
        # Create flow instance to exchange authorization code for credentials
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRET_FILE,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        # Exchange auth code for credentials
        flow.fetch_token(code=auth_code)
        credentials = flow.credentials
        
        # Save credentials
        save_user_calendar_creds(user_id, credentials)
        
        # Get the calendar ID
        service = build('calendar', 'v3', credentials=credentials)
        calendar_list = service.calendarList().list().execute()
        primary_calendar = next((cal for cal in calendar_list.get('items', []) if cal.get('primary')), None)
        
        if primary_calendar:
            calendar_id = primary_calendar['id']
            
            # Update the config
            config = get_user_calendar_config(user_id)
            config['enabled'] = True
            config['calendarId'] = calendar_id
            save_user_calendar_config(user_id, config)
            
            return jsonify({"success": True, "calendarId": calendar_id})
        else:
            return jsonify({"success": False, "error": "Could not find primary calendar"}), 400
    
    except Exception as e:
        current_app.logger.error(f"Error connecting to Google Calendar: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@calendar_blueprint.route('/config', methods=['POST'])
@jwt_required()
def update_calendar_config():
    user_id = get_jwt_identity()
    config = request.json
    
    try:
        # Get the existing config
        existing_config = get_user_calendar_config(user_id)
        
        # Update the config with new values
        for key, value in config.items():
            if key in existing_config:
                existing_config[key] = value
        
        # Save the updated config
        save_user_calendar_config(user_id, existing_config)
        
        return jsonify({"success": True})
    
    except Exception as e:
        current_app.logger.error(f"Error updating calendar config: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@calendar_blueprint.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    user_id = get_jwt_identity()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({"error": "Start date and end date are required"}), 400
    
    credentials = get_user_calendar_creds(user_id)
    config = get_user_calendar_config(user_id)
    
    if not credentials or not config['enabled']:
        return jsonify({"error": "Google Calendar not connected or not enabled"}), 400
    
    try:
        service = build('calendar', 'v3', credentials=credentials)
        events_result = service.events().list(
            calendarId=config['calendarId'],
            timeMin=start_date,
            timeMax=end_date,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        return jsonify(events)
    
    except Exception as e:
        current_app.logger.error(f"Error fetching calendar events: {str(e)}")
        return jsonify({"error": str(e)}), 500


@calendar_blueprint.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    user_id = get_jwt_identity()
    event_data = request.json
    
    credentials = get_user_calendar_creds(user_id)
    config = get_user_calendar_config(user_id)
    
    if not credentials or not config['enabled']:
        return jsonify({"error": "Google Calendar not connected or not enabled"}), 400
    
    if not config['allowEventCreation']:
        return jsonify({"error": "Event creation is not allowed in your calendar configuration"}), 403
    
    # Validate the required fields
    if not all(key in event_data for key in ['summary', 'start', 'end']):
        return jsonify({"error": "Missing required event fields"}), 400
    
    try:
        service = build('calendar', 'v3', credentials=credentials)
        
        # Format the event data for Google Calendar API
        event = {
            'summary': event_data['summary'],
            'start': {'dateTime': event_data['start']},
            'end': {'dateTime': event_data['end']},
        }
        
        if 'description' in event_data:
            event['description'] = event_data['description']
        
        if 'attendees' in event_data and event_data['attendees']:
            event['attendees'] = [{'email': email} for email in event_data['attendees']]
        
        # Create the event
        created_event = service.events().insert(
            calendarId=config['calendarId'],
            body=event
        ).execute()
        
        return jsonify(created_event)
    
    except Exception as e:
        current_app.logger.error(f"Error creating calendar event: {str(e)}")
        return jsonify({"error": str(e)}), 500


@calendar_blueprint.route('/events/<event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    user_id = get_jwt_identity()
    event_data = request.json
    
    credentials = get_user_calendar_creds(user_id)
    config = get_user_calendar_config(user_id)
    
    if not credentials or not config['enabled']:
        return jsonify({"error": "Google Calendar not connected or not enabled"}), 400
    
    if not config['allowEventModification']:
        return jsonify({"error": "Event modification is not allowed in your calendar configuration"}), 403
    
    try:
        service = build('calendar', 'v3', credentials=credentials)
        
        # Get the current event
        current_event = service.events().get(
            calendarId=config['calendarId'],
            eventId=event_id
        ).execute()
        
        # Update the fields provided in the request
        if 'summary' in event_data:
            current_event['summary'] = event_data['summary']
        
        if 'description' in event_data:
            current_event['description'] = event_data['description']
        
        if 'start' in event_data:
            current_event['start'] = {'dateTime': event_data['start']}
        
        if 'end' in event_data:
            current_event['end'] = {'dateTime': event_data['end']}
        
        if 'attendees' in event_data:
            current_event['attendees'] = [{'email': email} for email in event_data['attendees']]
        
        # Update the event
        updated_event = service.events().update(
            calendarId=config['calendarId'],
            eventId=event_id,
            body=current_event
        ).execute()
        
        return jsonify(updated_event)
    
    except Exception as e:
        current_app.logger.error(f"Error updating calendar event: {str(e)}")
        return jsonify({"error": str(e)}), 500


@calendar_blueprint.route('/events/<event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    user_id = get_jwt_identity()
    
    credentials = get_user_calendar_creds(user_id)
    config = get_user_calendar_config(user_id)
    
    if not credentials or not config['enabled']:
        return jsonify({"error": "Google Calendar not connected or not enabled"}), 400
    
    if not config['allowEventModification']:
        return jsonify({"error": "Event deletion is not allowed in your calendar configuration"}), 403
    
    try:
        service = build('calendar', 'v3', credentials=credentials)
        
        # Delete the event
        service.events().delete(
            calendarId=config['calendarId'],
            eventId=event_id
        ).execute()
        
        return jsonify({"success": True})
    
    except Exception as e:
        current_app.logger.error(f"Error deleting calendar event: {str(e)}")
        return jsonify({"error": str(e)}), 500
