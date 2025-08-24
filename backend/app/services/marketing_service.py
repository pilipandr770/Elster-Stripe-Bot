import os
import logging
from .model_service import ModelService

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_marketing_response(message, user_id=None, conversation_id=None):
    """
    Получение ответа от маркетингового модуля
    
    Для маркетинга используем модель в контейнере
    """
    try:
        # Используем модель в контейнере
        return ModelService.call_container_model(
            module="marketing",
            message=message,
            conversation_id=conversation_id,
            metadata={"user_id": user_id}
        )
    
    except Exception as e:
        logger.error(f"Error getting marketing response: {e}")
        return {
            "text": "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.",
            "model": "error",
            "error": str(e)
        }

def generate_marketing_content(topic, platform, tone="professional", length="medium", keywords=None):
    """
    Генерация маркетингового контента с использованием специализированного эндпоинта
    """
    try:
        data = {
            "topic": topic,
            "platform": platform,
            "tone": tone,
            "length": length,
            "keywords": keywords or []
        }
        
        response = requests.post(
            f"{ModelService.get_model_by_module('marketing')}/generate_content",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Error from marketing content generation: {response.status_code} - {response.text}")
            raise Exception(f"Marketing service error: {response.status_code}")
    
    except Exception as e:
        logger.error(f"Error generating marketing content: {e}")
        raise
