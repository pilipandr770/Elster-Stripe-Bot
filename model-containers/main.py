"""
Точка входа для модельного контейнера
"""
import os
import sys
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Определяем директорию модели и добавляем в sys.path
MODEL_TYPE = os.environ.get('MODEL_TYPE', '')
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

# Убедимся, что пути к модулям доступны
sys.path.append(os.path.dirname(__file__))

# Импортируем app из модуля
try:
    from model.main import app
    logging.info(f"Успешно импортировано приложение из модуля model.main")
except ImportError as e:
    logging.error(f"Ошибка импорта модуля: {e}")
    from fastapi import FastAPI
    app = FastAPI(title="Fallback API")

    @app.get("/")
    def read_root():
        return {"status": "error", "message": f"Не удалось загрузить модуль приложения: {str(e)}"}
except Exception as e:
    logging.error(f"Ошибка при импорте модуля: {str(e)}")
    # Создаем минимальное приложение FastAPI для аварийного режима
    from fastapi import FastAPI
    app = FastAPI(title="Fallback API")

    @app.get("/")
    def read_root():
        return {"status": "error", "message": f"Ошибка при запуске: {str(e)}"}
