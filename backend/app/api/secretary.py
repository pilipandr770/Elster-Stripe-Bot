import time
from flask import Blueprint, request, Response, stream_with_context, jsonify, g, current_app
from .utils import jwt_required, get_thread_for_module, save_message
from ..models import ModuleEnum
from ..services.secretary_service import get_secretary_response
from .calendar import calendar_blueprint

secretary_bp = Blueprint("secretary", __name__)

# Register the calendar blueprint under the secretary blueprint
secretary_bp.register_blueprint(calendar_blueprint, url_prefix='/calendar')


@secretary_bp.post("/chat")
@jwt_required
def chat_stream():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    mode = data.get("mode", "hybrid")  # hybrid, openai, gemini, container
    
    if not message:
        return jsonify({"error": "message field required"}), 400

    # Store user message in database
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Get or create conversation thread for this user and module
        thread = get_thread_for_module(session, g.user_id, ModuleEnum.secretary)
        
        # Save user message
        save_message(session, thread.id, "user", message)
        
        try:
            # Получаем ответ от сервиса
            response = get_secretary_response(
                message=message,
                user_id=g.user_id,
                conversation_id=str(thread.id),
                mode=mode
            )
            
            reply_text = response["text"]
            
            # Извлекаем метаданные для сохранения
            metadata = {
                "model": response.get("model", "unknown"),
                "calendar_data": response.get("metadata", {}).get("calendar_data")
            }
            
            # Сохраняем ответ AI в базу
            save_message(session, thread.id, "ai", reply_text, metadata=metadata)
            
            # Update thread's last activity time
            thread.updated_at = __import__("datetime").datetime.utcnow()
            session.commit()
        
        except Exception as e:
            current_app.logger.error(f"Error getting secretary response: {e}")
            reply_text = "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже."
            save_message(session, thread.id, "ai", reply_text, metadata={"error": str(e)})
            thread.updated_at = __import__("datetime").datetime.utcnow()
            session.commit()

    def generate():
        for token in reply_text.split():
            yield token + " "
            time.sleep(0.02)  # Немного ускоряем поток токенов

    return Response(stream_with_context(generate()), mimetype="text/plain")
