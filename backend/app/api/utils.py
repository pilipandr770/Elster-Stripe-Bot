"""API authentication helpers."""
from functools import wraps
from flask import request, jsonify, g, current_app
from ..security import decode_token
from sqlalchemy import select
from ..models import User


def jwt_required(f):
    """Decorator to protect API routes with JWT token."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": {"code": 401, "message": "Authentication required"}}), 401

        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": {"code": 401, "message": "Invalid or expired token"}}), 401

        # Get user from database to ensure they exist
        Session = getattr(current_app, "session_factory")
        with Session() as session:
            user = session.scalar(select(User).where(User.id == payload["sub"]))
            if not user:
                return jsonify({"error": {"code": 401, "message": "User not found"}}), 401
            
            # Store user in flask.g for access in the view function
            g.user = user
            g.user_id = user.id
            g.user_role = user.role

        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorator to ensure user has admin role."""
    @wraps(f)
    @jwt_required
    def decorated_function(*args, **kwargs):
        if g.user_role != "admin":
            return jsonify({"error": {"code": 403, "message": "Admin access required"}}), 403
        return f(*args, **kwargs)
    return decorated_function


def get_thread_for_module(session, user_id, module):
    """Get or create conversation thread for a user and module."""
    from ..models import ConversationThread
    
    # Find existing thread or create a new one
    thread = session.scalar(
        select(ConversationThread)
        .where(
            ConversationThread.user_id == user_id,
            ConversationThread.module == module
        )
        .order_by(ConversationThread.updated_at.desc())
    )
    
    if not thread:
        thread = ConversationThread(user_id=user_id, module=module)
        session.add(thread)
        session.flush()  # Get ID without committing
    
    return thread


def save_message(session, thread_id, role, content):
    """Save a message to the database."""
    from ..models import Message
    
    message = Message(thread_id=thread_id, role=role, content=content)
    session.add(message)
    session.flush()  # Get ID without committing
    
    return message
