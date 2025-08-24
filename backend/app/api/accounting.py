import time
from flask import Blueprint, request, Response, stream_with_context, jsonify, g, current_app
from .utils import jwt_required, get_thread_for_module, save_message
from ..models import ModuleEnum
from ..services.accounting_service import get_accounting_response

accounting_bp = Blueprint("accounting", __name__)


@accounting_bp.post("/chat")
@jwt_required
def chat_stream():
    """Streaming endpoint for Accounting module.
    Accepts JSON { "message": "..." } and streams back response from accounting model.
    Frontend expects a raw text stream (chunked). Later will migrate to SSE.
    """
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message field required"}), 400

    # Store user message in database
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Get or create conversation thread for this user and module
        thread = get_thread_for_module(session, g.user_id, ModuleEnum.accounting)
        
        # Save user message
        save_message(session, thread.id, "user", message)
        
        try:
            # Получаем ответ от бухгалтерского сервиса
            response = get_accounting_response(
                message=message,
                user_id=g.user_id,
                conversation_id=str(thread.id)
            )
            
            reply_text = response["text"]
            
            # Извлекаем метаданные для сохранения
            metadata = {
                "model": response.get("model", "unknown")
            }
            
            # Сохраняем ответ AI в базу
            save_message(session, thread.id, "ai", reply_text, metadata=metadata)
            
            # Update thread's last activity time
            thread.updated_at = __import__("datetime").datetime.utcnow()
            session.commit()
        
        except Exception as e:
            current_app.logger.error(f"Error getting accounting response: {e}")
            reply_text = "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже."
            save_message(session, thread.id, "ai", reply_text, metadata={"error": str(e)})
            thread.updated_at = __import__("datetime").datetime.utcnow()
            session.commit()

    def generate():
        # Stream word by word to simulate token streaming
        for word in reply_text.split():
            yield word + " "
            time.sleep(0.02)  # Чуть быстрее

    return Response(stream_with_context(generate()), mimetype="text/plain")
