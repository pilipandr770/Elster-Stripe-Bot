import os
import logging
from .model_service import ModelService

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_partner_check_response(message, user_id=None, conversation_id=None):
    """
    Получение ответа от модуля проверки контрагентов
    
    Для проверки контрагентов всегда используем модель в контейнере для конфиденциальности
    """
    try:
        # Используем модель в контейнере для конфиденциальности
        return ModelService.call_container_model(
            module="partnerCheck",
            message=message,
            conversation_id=conversation_id,
            metadata={"user_id": user_id}
        )
    
    except Exception as e:
        logger.error(f"Error getting partner check response: {e}")
        return {
            "text": "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.",
            "model": "error",
            "error": str(e)
        }
