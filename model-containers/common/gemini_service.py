import os
import google.generativeai as genai
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_gemini():
    """Инициализация API Gemini"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    
    genai.configure(api_key=api_key)
    logger.info("Gemini API initialized")
    return genai

def get_model(model_name="gemini-1.5-pro"):
    """Получение модели Gemini"""
    genai_instance = init_gemini()
    model = genai_instance.GenerativeModel(model_name)
    return model

async def generate_response(prompt, context=None, model_name="gemini-1.5-pro"):
    """Генерация ответа от модели Gemini"""
    try:
        model = get_model(model_name)
        
        # Настройки для запроса
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        # Формирование контекста запроса
        if context:
            prompt = f"{context}\n\n{prompt}"
        
        # Получение ответа от модели
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        return {
            "text": response.text,
            "model": model_name
        }
    
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        return {
            "text": "Sorry, I encountered an error while processing your request.",
            "error": str(e),
            "model": model_name
        }
