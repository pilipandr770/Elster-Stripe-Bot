import os
import logging
from flask import current_app
from .model_service import ModelService

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_secretary_response(message, user_id=None, conversation_id=None, mode="hybrid"):
    """
    Получение ответа от секретарского модуля
    
    Режимы:
    - "hybrid": использует OpenAI для коммуникации с клиентом, Gemini для обработки данных
    - "openai": использует только OpenAI
    - "gemini": использует только Gemini
    - "container": использует только модель в контейнере
    """
    try:
        if mode == "hybrid":
            # Для коммуникации с клиентом используем OpenAI
            client_response = ModelService.call_openai_api(
                prompt=f"""
                Ты - профессиональный секретарь. Ответь на следующий запрос пользователя 
                вежливо, кратко и по существу. Ты должен быть максимально полезным.
                
                Запрос пользователя: {message}
                """,
                model_name="gpt-4o"  # Используем более продвинутую модель для коммуникаций
            )
            
            # Для обработки данных и извлечения календарных событий используем Gemini
            calendar_data = None
            if "календарь" in message.lower() or "встреч" in message.lower() or "событи" in message.lower():
                # Вызываем специализированный эндпоинт для извлечения данных календаря
                calendar_extraction = ModelService.call_secretary_specialized_endpoints(
                    endpoint="calendar_data_extraction",
                    data={"message": message}
                )
                
                calendar_data = calendar_extraction.get("extracted_data")
            
            # Объединяем результаты
            result = {
                "text": client_response["text"],
                "model": client_response["model"],
                "metadata": {
                    "calendar_data": calendar_data
                }
            }
            
            return result
            
        elif mode == "openai":
            # Используем только OpenAI
            return ModelService.call_openai_api(
                prompt=f"""
                Ты - профессиональный секретарь. Ответь на следующий запрос пользователя 
                вежливо, кратко и по существу. Ты должен быть максимально полезным.
                
                Запрос пользователя: {message}
                """,
                model_name="gpt-4o"
            )
            
        elif mode == "gemini":
            # Используем только Gemini API напрямую
            return ModelService.call_gemini_api(
                prompt=f"""
                Ты - профессиональный секретарь. Ответь на следующий запрос пользователя 
                вежливо, кратко и по существу. Ты должен быть максимально полезным.
                
                Запрос пользователя: {message}
                """
            )
            
        elif mode == "container":
            # Используем модель в контейнере
            return ModelService.call_container_model(
                module="secretary",
                message=message,
                conversation_id=conversation_id,
                metadata={"user_id": user_id}
            )
            
        else:
            raise ValueError(f"Unknown mode: {mode}")
    
    except Exception as e:
        logger.error(f"Error getting secretary response: {e}")
        return {
            "text": "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.",
            "model": "error",
            "error": str(e)
        }
