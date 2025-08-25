"""
Точка входа для модельного контейнера
"""
import os
import sys
import importlib.util
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Добавляем путь к модулю в систему импорта
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
sys.path.append(MODEL_DIR)

# Импортируем app из main.py в директории model
try:
    spec = importlib.util.spec_from_file_location("model_main", os.path.join(MODEL_DIR, "main.py"))
    if spec and spec.loader:
        model_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(model_module)
        app = getattr(model_module, 'app')
        logging.info(f"Успешно импортирован модуль приложения из {MODEL_DIR}/main.py")
    else:
        logging.error(f"Не удалось загрузить main.py из директории {MODEL_DIR}")
        # Создаем минимальное приложение FastAPI для аварийного режима
        from fastapi import FastAPI
        app = FastAPI(title="Fallback API")

        @app.get("/")
        def read_root():
            return {"status": "error", "message": f"Не удалось загрузить основной модуль из {MODEL_DIR}/main.py"}
except Exception as e:
    logging.error(f"Ошибка при импорте модуля: {str(e)}")
    # Создаем минимальное приложение FastAPI для аварийного режима
    from fastapi import FastAPI
    app = FastAPI(title="Fallback API")

    @app.get("/")
    def read_root():
        return {"status": "error", "message": f"Ошибка при запуске: {str(e)}"}
