#!/bin/sh

# Ждем доступности базы данных
python /app/wait_for_db.py

# Запуск сервиса с правильным путем к файлу приложения
exec python -m uvicorn model.main:app --host 0.0.0.0 --port 8000
