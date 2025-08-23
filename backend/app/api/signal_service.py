import subprocess
import json
import os
from flask import Blueprint, request, jsonify, g, current_app
from .utils import jwt_required

signal_bp = Blueprint("signal", __name__)

@signal_bp.post("/verify")
@jwt_required
def verify_number():
    data = request.get_json(silent=True) or {}
    phone_number = data.get("phone_number")
    signal_cli_path = data.get("signal_cli_path", "/opt/signal-cli/bin/signal-cli")
    
    if not phone_number:
        return jsonify({"error": "Phone number required"}), 400
    
    # Check if signal-cli exists
    if not os.path.isfile(signal_cli_path):
        return jsonify({
            "verified": False,
            "message": f"signal-cli not found at path: {signal_cli_path}"
        }), 400
    
    try:
        # Request verification code
        cmd = [
            signal_cli_path,
            "-a", phone_number,
            "register"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return jsonify({
                "verified": False,
                "message": f"Failed to request verification: {result.stderr}"
            }), 400
        
        return jsonify({
            "verified": False,  # Not verified yet, waiting for verification code
            "message": "Verification code requested. Please provide the code."
        })
        
    except Exception as e:
        return jsonify({
            "verified": False,
            "message": f"Error: {str(e)}"
        }), 500

@signal_bp.post("/verify/confirm")
@jwt_required
def confirm_verification():
    data = request.get_json(silent=True) or {}
    phone_number = data.get("phone_number")
    verification_code = data.get("verification_code")
    signal_cli_path = data.get("signal_cli_path", "/opt/signal-cli/bin/signal-cli")
    
    if not phone_number or not verification_code:
        return jsonify({"error": "Phone number and verification code required"}), 400
    
    try:
        # Verify with code
        cmd = [
            signal_cli_path,
            "-a", phone_number,
            "verify", verification_code
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return jsonify({
                "verified": False,
                "message": f"Verification failed: {result.stderr}"
            }), 400
        
        return jsonify({
            "verified": True,
            "message": "Phone number verified successfully"
        })
        
    except Exception as e:
        return jsonify({
            "verified": False,
            "message": f"Error: {str(e)}"
        }), 500

@signal_bp.post("/send")
@jwt_required
def send_message():
    data = request.get_json(silent=True) or {}
    phone_number = data.get("phone_number")  # Sender
    recipient = data.get("recipient")
    message = data.get("message")
    signal_cli_path = data.get("signal_cli_path", "/opt/signal-cli/bin/signal-cli")
    
    if not phone_number or not recipient or not message:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        # Send message
        cmd = [
            signal_cli_path,
            "-a", phone_number,
            "send", "-m", message,
            recipient
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return jsonify({
                "sent": False,
                "message": f"Failed to send message: {result.stderr}"
            }), 400
        
        return jsonify({
            "sent": True,
            "message": "Message sent successfully"
        })
        
    except Exception as e:
        return jsonify({
            "sent": False,
            "message": f"Error: {str(e)}"
        }), 500

@signal_bp.post("/receive")
@jwt_required
def receive_messages():
    data = request.get_json(silent=True) or {}
    phone_number = data.get("phone_number")
    signal_cli_path = data.get("signal_cli_path", "/opt/signal-cli/bin/signal-cli")
    
    if not phone_number:
        return jsonify({"error": "Phone number required"}), 400
    
    try:
        # Receive messages
        cmd = [
            signal_cli_path,
            "-a", phone_number,
            "receive", "--json"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return jsonify({
                "success": False,
                "message": f"Failed to receive messages: {result.stderr}"
            }), 400
        
        # Parse JSON output from signal-cli
        messages = []
        if result.stdout:
            try:
                for line in result.stdout.strip().split('\n'):
                    if line:
                        messages.append(json.loads(line))
            except json.JSONDecodeError:
                return jsonify({
                    "success": False,
                    "message": "Failed to parse messages"
                }), 500
        
        return jsonify({
            "success": True,
            "messages": messages
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500
