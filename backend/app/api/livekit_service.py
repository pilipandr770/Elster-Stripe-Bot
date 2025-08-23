import os
import json
from flask import Blueprint, request, jsonify, g, current_app
from .utils import jwt_required
from ..services.gemini_service import generate_response

# LiveKit integration for phone calls
livekit_bp = Blueprint("livekit", __name__)

@livekit_bp.post("/create_room")
@jwt_required
def create_room():
    data = request.get_json(silent=True) or {}
    room_name = data.get("room_name")
    api_key = data.get("livekit_api_key")
    api_secret = data.get("livekit_api_secret")
    
    if not room_name or not api_key or not api_secret:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        # Import LiveKit libraries dynamically to avoid dependency issues
        try:
            from livekit import RoomServiceClient
            from livekit.api import api_pb2
        except ImportError:
            return jsonify({
                "success": False,
                "message": "LiveKit Python SDK not installed"
            }), 500
        
        # Create LiveKit client
        room_client = RoomServiceClient(
            api_key=api_key,
            api_secret=api_secret,
            host="https://your-livekit-server.com"  # Replace with your LiveKit server
        )
        
        # Create or get room
        room = room_client.create_room(
            name=room_name,
            empty_timeout=300,  # 5 minutes
            max_participants=2   # Agent and caller
        )
        
        # Create token for AI assistant
        assistant_token = room_client.generate_token(
            room=room_name,
            identity="ai-assistant",
            name="AI Assistant",
            ttl=3600,  # 1 hour
            can_publish=True,
            can_subscribe=True
        )
        
        return jsonify({
            "success": True,
            "room": {
                "name": room.name,
                "sid": room.sid,
                "created_at": room.created_at.isoformat() if hasattr(room, 'created_at') else None,
            },
            "assistant_token": assistant_token
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500

@livekit_bp.post("/create_user_token")
@jwt_required
def create_user_token():
    data = request.get_json(silent=True) or {}
    room_name = data.get("room_name")
    api_key = data.get("livekit_api_key")
    api_secret = data.get("livekit_api_secret")
    
    if not room_name or not api_key or not api_secret:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        # Import LiveKit libraries dynamically
        try:
            from livekit import RoomServiceClient
        except ImportError:
            return jsonify({
                "success": False,
                "message": "LiveKit Python SDK not installed"
            }), 500
        
        # Create LiveKit client
        room_client = RoomServiceClient(
            api_key=api_key,
            api_secret=api_secret,
            host="https://your-livekit-server.com"  # Replace with your LiveKit server
        )
        
        # Create token for human user
        user_token = room_client.generate_token(
            room=room_name,
            identity=f"user-{g.user_id}",
            name="User",
            ttl=3600,  # 1 hour
            can_publish=True,
            can_subscribe=True
        )
        
        return jsonify({
            "success": True,
            "room_name": room_name,
            "user_token": user_token
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500

@livekit_bp.post("/end_call")
@jwt_required
def end_call():
    data = request.get_json(silent=True) or {}
    room_name = data.get("room_name")
    api_key = data.get("livekit_api_key")
    api_secret = data.get("livekit_api_secret")
    
    if not room_name or not api_key or not api_secret:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        # Import LiveKit libraries dynamically
        try:
            from livekit import RoomServiceClient
        except ImportError:
            return jsonify({
                "success": False,
                "message": "LiveKit Python SDK not installed"
            }), 500
        
        # Create LiveKit client
        room_client = RoomServiceClient(
            api_key=api_key,
            api_secret=api_secret,
            host="https://your-livekit-server.com"  # Replace with your LiveKit server
        )
        
        # Delete room
        room_client.delete_room(room=room_name)
        
        return jsonify({
            "success": True,
            "message": "Call ended successfully"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500
