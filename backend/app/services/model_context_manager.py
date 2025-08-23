import os
import json
import google.generativeai as genai
from openai import OpenAI
from flask import current_app
from ..models import ModuleEnum

# Настройка API-ключей
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Инициализация клиентов
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None

# Базовые промпты для каждого модуля
MODULE_PROMPTS = {
    ModuleEnum.accounting: """
    You are a specialized AI assistant for accounting and tax matters related to the Elster-Stripe integration.
    You help users with:
    - Stripe transaction monitoring and categorization
    - German tax requirements and filings
    - VAT (Umsatzsteuer) calculations and reporting
    - Income tax (Einkommensteuer) preparation
    - Financial data analysis
    
    Focus only on accounting and tax related questions. For other topics, politely explain that you are
    specialized in accounting and taxes and suggest they use the appropriate module for their query.
    
    Answer in the same language the user is using (German or English).
    """,
    
    ModuleEnum.partner_check: """
    You are a specialized AI assistant for partner verification and compliance checks.
    You help users with:
    - Verification of business partners 
    - Checking partners against sanctions lists
    - Regulatory compliance checks
    - Risk assessment for business relationships
    - KYC (Know Your Customer) and AML (Anti-Money Laundering) procedures
    
    Focus only on partner verification and compliance related questions. For other topics, politely explain that you are
    specialized in compliance and suggest they use the appropriate module for their query.
    
    Answer in the same language the user is using (German or English).
    """,
    
    ModuleEnum.secretary: """
    You are a specialized AI assistant acting as an intelligent secretary.
    You help users with:
    - Email and message drafting and response suggestions
    - Calendar management and scheduling
    - Communication with customers and partners
    - Document organization and management
    - Task prioritization and reminders
    
    Focus only on secretarial and communication related questions. For other topics, politely explain that you are
    specialized in secretarial tasks and suggest they use the appropriate module for their query.
    
    Answer in the same language the user is using (German or English).
    """,
    
    ModuleEnum.marketing: """
    You are a specialized AI assistant for marketing and content creation.
    You help users with:
    - Content planning and creation for multiple channels
    - Social media post scheduling
    - Marketing analytics interpretation
    - Campaign strategy development
    - Audience targeting suggestions
    
    Focus only on marketing related questions. For other topics, politely explain that you are
    specialized in marketing and suggest they use the appropriate module for their query.
    
    Answer in the same language the user is using (German or English).
    """
}

class ModelContextManager:
    """Manages AI model contexts for different modules"""
    
    def __init__(self):
        # Конфигурация моделей (можно сохранить в БД)
        self.model_configs = {
            "gemini": {
                ModuleEnum.accounting: {"model": "gemini-pro", "temperature": 0.2},
                ModuleEnum.partner_check: {"model": "gemini-pro", "temperature": 0.1},
                ModuleEnum.secretary: {"model": "gemini-pro", "temperature": 0.4},
                ModuleEnum.marketing: {"model": "gemini-pro", "temperature": 0.7},
            },
            "openai": {
                ModuleEnum.accounting: {"model": "gpt-4o", "temperature": 0.2},
                ModuleEnum.partner_check: {"model": "gpt-4o", "temperature": 0.1},
                ModuleEnum.secretary: {"model": "gpt-4o", "temperature": 0.4},
                ModuleEnum.marketing: {"model": "gpt-4o", "temperature": 0.7},
            }
        }
        
        # Активная модель по умолчанию
        self.default_model = "gemini" if GEMINI_API_KEY else "openai"
    
    def get_module_prompt(self, module_enum):
        """Получить базовый промпт для модуля"""
        return MODULE_PROMPTS.get(module_enum, "You are a helpful AI assistant.")
    
    def get_model_config(self, module_enum, model_type=None):
        """Получить конфигурацию модели для модуля"""
        model_type = model_type or self.default_model
        if model_type not in self.model_configs:
            raise ValueError(f"Unsupported model type: {model_type}")
            
        return self.model_configs[model_type].get(
            module_enum, 
            self.model_configs[model_type].get(ModuleEnum.accounting)  # fallback
        )
    
    def get_module_context(self, session, thread_id, limit=10):
        """Получить контекст переписки для модуля"""
        from ..models import Message
        
        # Получаем последние сообщения для этого потока
        messages = (
            session.query(Message)
            .filter(Message.thread_id == thread_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        
        # Разворачиваем список сообщений в хронологическом порядке
        context = [{"role": msg.role, "content": msg.content} for msg in reversed(messages)]
        return context
    
    def generate_response(self, module_enum, message, context=None, model_type=None):
        """Генерирует ответ на основе модуля и контекста"""
        model_type = model_type or self.default_model
        module_prompt = self.get_module_prompt(module_enum)
        model_config = self.get_model_config(module_enum, model_type)
        
        try:
            if model_type == "gemini" and GEMINI_API_KEY:
                return self._generate_gemini_response(module_prompt, message, context, model_config)
            elif model_type == "openai" and OPENAI_API_KEY:
                return self._generate_openai_response(module_prompt, message, context, model_config)
            else:
                raise ValueError(f"Model type {model_type} not available with current API keys")
        except Exception as e:
            current_app.logger.error(f"Error generating response: {e}")
            # Fallback to the other model if available
            fallback_model = "openai" if model_type == "gemini" and OPENAI_API_KEY else "gemini" if GEMINI_API_KEY else None
            if fallback_model:
                try:
                    current_app.logger.info(f"Falling back to {fallback_model}")
                    return self.generate_response(module_enum, message, context, fallback_model)
                except:
                    pass
            return "Es tut mir leid, ich konnte keine Antwort generieren. Bitte versuchen Sie es später erneut."
    
    def _generate_gemini_response(self, system_prompt, message, context, config):
        """Генерирует ответ с помощью Gemini"""
        model = genai.GenerativeModel(
            model_name=config.get("model", "gemini-pro"), 
            generation_config={"temperature": config.get("temperature", 0.4)}
        )
        
        prompt_parts = [system_prompt]
        
        # Добавляем контекст, если он есть
        if context:
            for msg in context:
                if msg["role"] == "user":
                    prompt_parts.append(f"User: {msg['content']}")
                elif msg["role"] == "ai":
                    prompt_parts.append(f"AI: {msg['content']}")
        
        # Добавляем текущее сообщение
        prompt_parts.append(f"User: {message}\nAI: ")
        
        response = model.generate_content(prompt_parts)
        return response.text
    
    def _generate_openai_response(self, system_prompt, message, context, config):
        """Генерирует ответ с помощью OpenAI"""
        if not openai_client:
            raise ValueError("OpenAI client not configured")
            
        messages = [{"role": "system", "content": system_prompt}]
        
        # Добавляем контекст, если он есть
        if context:
            for msg in context:
                if msg["role"] == "user":
                    messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "ai":
                    messages.append({"role": "assistant", "content": msg["content"]})
        
        # Добавляем текущее сообщение
        messages.append({"role": "user", "content": message})
        
        response = openai_client.chat.completions.create(
            model=config.get("model", "gpt-4o"),
            messages=messages,
            temperature=config.get("temperature", 0.4)
        )
        
        return response.choices[0].message.content

# Создаем экземпляр менеджера контекстов
model_manager = ModelContextManager()

def generate_module_response(module_enum, message, thread_id=None, session=None, model_type=None):
    """
    Публичная функция для генерации ответа с учетом модуля и контекста
    """
    context = None
    if thread_id and session:
        context = model_manager.get_module_context(session, thread_id)
    
    return model_manager.generate_response(module_enum, message, context, model_type)
