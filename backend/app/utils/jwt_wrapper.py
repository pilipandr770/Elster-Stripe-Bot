"""
Wrapper для Flask-JWT-Extended, который позволяет работать, даже если пакет не установлен
"""
import logging

logger = logging.getLogger(__name__)

try:
    # Пробуем импортировать модуль Flask-JWT-Extended
    from flask_jwt_extended import jwt_required, get_jwt_identity

    logger.info("Successfully imported flask_jwt_extended")
    
    # Оставляем как есть, модуль успешно импортирован
except ImportError:
    # Создаем заглушки, если модуль не установлен
    logger.warning("flask_jwt_extended not installed, using dummy functions")
    
    # Заглушка для декоратора jwt_required
    def jwt_required(optional=False):
        def wrapper(fn):
            def decorator(*args, **kwargs):
                logger.warning("Using dummy jwt_required, no authentication check performed")
                return fn(*args, **kwargs)
            return decorator
        if callable(optional):
            # Вызов без параметров: @jwt_required
            fn = optional
            optional = False
            return wrapper(fn)
        # Вызов с параметрами: @jwt_required()
        return wrapper
    
    # Заглушка для функции get_jwt_identity
    def get_jwt_identity():
        logger.warning("Using dummy get_jwt_identity, returning test user")
        return "test-user-id"
