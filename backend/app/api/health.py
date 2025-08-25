from flask import Blueprint, jsonify
import requests
import logging
from ..models import ModuleEnum
from ..services.model_service import openai_client

# Настройка логирования
logger = logging.getLogger(__name__)

health_bp = Blueprint("health", __name__)

@health_bp.get("")
def health_check():
    """Endpoint для проверки работоспособности API."""
    # Не проверяем модули при проверке здоровья бэкенда, чтобы избежать зависаний
    # Если нужна детальная проверка, можно использовать отдельный эндпоинт
    response = {
        "status": "ok",
        "api": "Elster-Stripe-Bot API",
        "version": "1.0.0",
        "ai_services": {
            "openai": "available" if openai_client else "unavailable"
        }
    }
    return jsonify(response)

def check_module_health(url):
    """Проверяет доступность модуля по URL."""
    try:
        response = requests.get(url, timeout=1)
        if response.status_code == 200:
            return "healthy"
        else:
            return "unhealthy"
    except Exception as e:
        logger.warning(f"Error checking module health: {e}")
        return "unavailable"
