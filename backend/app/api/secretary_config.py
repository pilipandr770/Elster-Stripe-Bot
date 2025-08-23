from flask import Blueprint, jsonify, request, g, current_app
from .utils import jwt_required
import os
import json
import time

# Blueprint for secretary configuration and related endpoints
secretary_config_bp = Blueprint("secretary_config", __name__)

@secretary_config_bp.route("/config", methods=["GET"])
@jwt_required
def get_config():
    """Get secretary configuration for the current user"""
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Get configuration for the current user
        # In a real implementation, this would be fetched from a database
        # For now, return a dummy configuration
        return jsonify({
            "isActive": False,
            "channels": [
                {"type": "email", "value": "", "connected": False, "config": {"mcp_server": ""}},
                {"type": "telegram", "value": "", "connected": False},
                {"type": "whatsapp", "value": "", "connected": False, "config": {"whatsapp_business_id": ""}},
                {"type": "signal", "value": "", "connected": False, "config": {"signal_cli_path": "/opt/signal-cli/bin/signal-cli"}},
                {"type": "phone", "value": "", "connected": False, "config": {"livekit_api_key": "", "livekit_api_secret": ""}}
            ],
            "knowledgeBaseFiles": [],
            "instructions": {
                "systemInstruction": "Sie sind ein KI-Assistent der Firma. Ihre Aufgabe ist es, Kundenanfragen professionell und höflich zu beantworten.",
                "companyInfo": "Unser Firmenname ist Beispiel GmbH.",
                "responseGuidelines": "Unser Kommunikationsstil ist professionell, aber freundlich und hilfsbereit.",
                "faqResponses": []
            },
            "memorySettings": {
                "enableConversationMemory": True,
                "maxHistoryMessages": 10,
                "enableVectorKnowledge": True
            }
        })

@secretary_config_bp.route("/config", methods=["POST"])
@jwt_required
def save_config():
    """Save secretary configuration for the current user"""
    data = request.get_json(silent=True) or {}
    
    # Validate configuration
    if "isActive" not in data:
        return jsonify({"error": "Missing required field: isActive"}), 400
    
    # In a real implementation, this would save to a database
    # For now, just return success
    return jsonify(data)

@secretary_config_bp.route("/channels/test", methods=["POST"])
@jwt_required
def test_channel():
    """Test connection to a communication channel"""
    data = request.get_json(silent=True) or {}
    
    channel_type = data.get("type")
    channel_value = data.get("value")
    channel_config = data.get("config", {})
    
    if not channel_type or not channel_value:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Simulate connection test
    time.sleep(1)  # Simulate network delay
    
    # In a real implementation, this would test actual connection
    # For now, just return success for demo purposes
    return jsonify({
        "connected": True,
        "message": f"Verbindung zu {channel_type} erfolgreich getestet"
    })

@secretary_config_bp.route("/knowledge/upload", methods=["POST"])
@jwt_required
def upload_knowledge_file():
    """Upload a file to the knowledge base"""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    # In a real implementation, this would save the file and process it
    # For now, just return success with mock data
    return jsonify({
        "id": f"file_{int(time.time())}",
        "name": file.filename,
        "size": 1024 * 1024,  # Mock 1MB
        "uploaded": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "processing"
    })

@secretary_config_bp.route("/knowledge/<file_id>", methods=["DELETE"])
@jwt_required
def delete_knowledge_file(file_id):
    """Delete a file from the knowledge base"""
    # In a real implementation, this would delete the file
    # For now, just return success
    return jsonify({"success": True})
