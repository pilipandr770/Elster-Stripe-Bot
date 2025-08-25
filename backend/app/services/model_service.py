import os
import logging
import requests
import json
import google.generativeai as genai

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация клиента OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None

# Безопасно импортируем OpenAI и инициализируем клиент
try:
    from openai import OpenAI
    try:
        if OPENAI_API_KEY:
            try:
                # Безопасно создаем клиент только с api_key
                openai_client = OpenAI(api_key=OPENAI_API_KEY)
                logger.info("OpenAI client successfully initialized")
            except Exception as e:
                # Может быть проблема с версией OpenAI или другими параметрами
                logger.error(f"Error creating OpenAI client: {e}")
                logger.error("Continuing without OpenAI client")
        else:
            logger.warning("OpenAI API key is missing, OpenAI functionality will not be available")
    except TypeError as e:
        logger.error(f"TypeError initializing OpenAI client: {e}")
        logger.error("Make sure you're using openai v1.20.0 or later")
    except Exception as e:
        logger.error(f"Error initializing OpenAI client: {e}")
        logger.error("Continuing without OpenAI client")
except ImportError:
    logger.error("Failed to import OpenAI library. Continuing without OpenAI support.")
    OpenAI = None

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
        elif module == "partner_check":
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
                logger.warning("OpenAI client not configured, falling back to Gemini")
                # Если OpenAI недоступен, используем Gemini как запасной вариант
                return call_gemini_api(prompt)
                
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
            # Если произошла ошибка, используем Gemini как запасной вариант
            logger.info("Falling back to Gemini API")
            try:
                return call_gemini_api(prompt)
            except Exception as gemini_error:
                logger.error(f"Gemini fallback also failed: {gemini_error}")
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
