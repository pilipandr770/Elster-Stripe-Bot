import os
import json
import smtplib
import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify, g, current_app
from .utils import jwt_required
from ..services.gemini_service import generate_response
from ..services.mcp_service import create_mcp_server_request

mcp_email_bp = Blueprint("mcp_email", __name__)

@mcp_email_bp.post("/connect")
@jwt_required
def connect_email():
    data = request.get_json(silent=True) or {}
    email_address = data.get("email_address")
    password = data.get("password")
    mcp_server_url = data.get("mcp_server_url")
    
    if not email_address or not password or not mcp_server_url:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Test the connection
    try:
        # Test IMAP
        imap = imaplib.IMAP4_SSL("imap.gmail.com")  # Example for Gmail
        imap.login(email_address, password)
        imap.select("INBOX")
        imap.close()
        
        # Test SMTP
        smtp = smtplib.SMTP_SSL("smtp.gmail.com", 465)  # Example for Gmail
        smtp.login(email_address, password)
        smtp.quit()
        
        # Test MCP server connection
        test_request = {
            "messages": [
                {"role": "user", "content": "Test connection"}
            ]
        }
        response = create_mcp_server_request(mcp_server_url, test_request)
        
        # Save the configuration
        # Here you would typically save to a database
        
        return jsonify({
            "connected": True,
            "message": "Email connection successful"
        })
    
    except Exception as e:
        return jsonify({
            "connected": False,
            "message": f"Connection failed: {str(e)}"
        }), 400

@mcp_email_bp.post("/process")
@jwt_required
def process_email():
    """Process incoming emails using the MCP server"""
    data = request.get_json(silent=True) or {}
    email_address = data.get("email_address")
    password = data.get("password")
    mcp_server_url = data.get("mcp_server_url")
    
    if not email_address or not password or not mcp_server_url:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        # Connect to IMAP
        imap = imaplib.IMAP4_SSL("imap.gmail.com")
        imap.login(email_address, password)
        imap.select("INBOX")
        
        # Search for unread emails
        status, messages = imap.search(None, "UNSEEN")
        email_ids = messages[0].split()
        
        processed_emails = []
        
        for email_id in email_ids:
            status, message_data = imap.fetch(email_id, "(RFC822)")
            raw_email = message_data[0][1]
            email_message = email.message_from_bytes(raw_email)
            
            # Extract email content
            sender = email.utils.parseaddr(email_message["From"])[1]
            subject = email_message["Subject"]
            body = ""
            
            if email_message.is_multipart():
                for part in email_message.walk():
                    content_type = part.get_content_type()
                    if content_type == "text/plain" or content_type == "text/html":
                        try:
                            body = part.get_payload(decode=True).decode()
                            break
                        except:
                            pass
            else:
                body = email_message.get_payload(decode=True).decode()
            
            # Create MCP request with email content
            mcp_request = {
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an email assistant. Process the following email and craft a professional response."
                    },
                    {
                        "role": "user", 
                        "content": f"Email from: {sender}\nSubject: {subject}\nBody: {body}\n\nPlease respond to this email appropriately."
                    }
                ]
            }
            
            # Send to MCP server
            response_content = create_mcp_server_request(mcp_server_url, mcp_request)
            
            # Create and send email response
            msg = MIMEMultipart()
            msg["From"] = email_address
            msg["To"] = sender
            msg["Subject"] = f"Re: {subject}"
            
            msg.attach(MIMEText(response_content, "plain"))
            
            smtp = smtplib.SMTP_SSL("smtp.gmail.com", 465)
            smtp.login(email_address, password)
            smtp.send_message(msg)
            smtp.quit()
            
            # Mark email as read
            imap.store(email_id, "+FLAGS", "\\Seen")
            
            processed_emails.append({
                "sender": sender,
                "subject": subject,
                "response": response_content
            })
        
        imap.close()
        imap.logout()
        
        return jsonify({
            "success": True,
            "processed_count": len(processed_emails),
            "processed_emails": processed_emails
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
