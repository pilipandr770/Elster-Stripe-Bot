"""Chat history API endpoints."""
from flask import Blueprint, jsonify, g, current_app
from sqlalchemy import select
from .utils import jwt_required
from ..models import ConversationThread, Message, ModuleEnum

chat_history_bp = Blueprint("chat_history", __name__)


@chat_history_bp.get("/threads")
@jwt_required
def get_user_threads():
    """Get all conversation threads for the current user."""
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        threads = session.scalars(
            select(ConversationThread)
            .where(ConversationThread.user_id == g.user_id)
            .order_by(ConversationThread.updated_at.desc())
        ).all()
        
        result = []
        for thread in threads:
            result.append({
                "id": thread.id,
                "module": thread.module,
                "created_at": thread.created_at.isoformat(),
                "updated_at": thread.updated_at.isoformat(),
            })
        
        return jsonify(result)


@chat_history_bp.get("/threads/<module>")
@jwt_required
def get_thread_by_module(module):
    """Get conversation thread for a specific module."""
    if module not in [m.value for m in ModuleEnum]:
        return jsonify({"error": {"code": 400, "message": f"Invalid module: {module}"}}), 400

    Session = getattr(current_app, "session_factory")
    with Session() as session:
        thread = session.scalar(
            select(ConversationThread)
            .where(
                ConversationThread.user_id == g.user_id,
                ConversationThread.module == module
            )
            .order_by(ConversationThread.updated_at.desc())
        )
        
        if not thread:
            return jsonify({"error": {"code": 404, "message": "No conversation found for this module"}}), 404
        
        messages = session.scalars(
            select(Message)
            .where(Message.thread_id == thread.id)
            .order_by(Message.created_at)
        ).all()
        
        message_list = []
        for msg in messages:
            message_list.append({
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            })
        
        result = {
            "thread": {
                "id": thread.id,
                "module": thread.module,
                "created_at": thread.created_at.isoformat(),
                "updated_at": thread.updated_at.isoformat(),
            },
            "messages": message_list
        }
        
        return jsonify(result)
