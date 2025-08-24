import os
import logging
import requests
import json
import google.generativeai as genai
from openai import OpenAI

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация клиента OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Инициализация Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# URL-адреса специализированных моделей
ACCOUNTING_MODEL_URL = os.getenv("ACCOUNTING_MODEL_URL", "http://accounting-model:8000")
PARTNER_CHECK_MODEL_URL = os.getenv("PARTNER_CHECK_MODEL_URL", "http://partner-check-model:8000")
SECRETARY_MODEL_URL = os.getenv("SECRETARY_MODEL_URL", "http://secretary-model:8000")
MARKETING_MODEL_URL = os.getenv("MARKETING_MODEL_URL", "http://marketing-model:8000")

class ModelService:
    """Сервис для работы с разными моделями и распределения запросов"""
    
    @staticmethod
    def get_model_by_module(module):
        """Получение URL сервиса модели по названию модуля"""
        if module == "accounting":
            return ACCOUNTING_MODEL_URL
        elif module == "partnerCheck":
            return PARTNER_CHECK_MODEL_URL
        elif module == "secretary":
            return SECRETARY_MODEL_URL
        elif module == "marketing":
            return MARKETING_MODEL_URL
        else:
            raise ValueError(f"Unknown module: {module}")
    
    @staticmethod
    def call_container_model(module, message, conversation_id=None, metadata=None):
        """Вызов модели в контейнере для обработки запроса"""
        try:
            model_url = ModelService.get_model_by_module(module)
            
            # Подготовка данных запроса
            request_data = {
                "message": message,
                "conversation_id": conversation_id,
                "metadata": metadata or {}
            }
            
            # Выполнение запроса к соответствующему сервису модели
            response = requests.post(
                f"{model_url}/chat",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Error from model service: {response.status_code} - {response.text}")
                raise Exception(f"Model service error: {response.status_code}")
        
        except Exception as e:
            logger.error(f"Error calling container model: {e}")
            raise
    
    @staticmethod
    def call_gemini_api(prompt, model_name="gemini-1.5-pro"):
        """Прямой вызов API Gemini"""
        try:
            if not GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY not configured")
                
            # Создание модели
            model = genai.GenerativeModel(model_name)
            
            # Генерация ответа
            response = model.generate_content(prompt)
            
            return {
                "text": response.text,
                "model": model_name
            }
        
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            raise
    
    @staticmethod
    def call_openai_api(prompt, model_name="gpt-3.5-turbo"):
        """Прямой вызов API OpenAI"""
        try:
            if not openai_client:
                raise ValueError("OpenAI client not configured")
                
            # Генерация ответа
            response = openai_client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return {
                "text": response.choices[0].message.content,
                "model": model_name
            }
        
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            raise
    
    @staticmethod
    def call_secretary_specialized_endpoints(endpoint, data):
        """Вызов специализированных эндпоинтов модуля секретаря"""
        try:
            response = requests.post(
                f"{SECRETARY_MODEL_URL}/{endpoint}",
                json=data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Error from secretary specialized endpoint: {response.status_code} - {response.text}")
                raise Exception(f"Secretary service error: {response.status_code}")
        
        except Exception as e:
            logger.error(f"Error calling secretary specialized endpoint: {e}")
            raise
