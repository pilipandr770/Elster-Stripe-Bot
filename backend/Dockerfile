FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	PIP_NO_CACHE_DIR=1 \
	PATH="/root/.local/bin:$PATH"

WORKDIR /app

COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . ./

EXPOSE 5000

# Создаем скрипт для запуска с переключением на минимальное приложение при сбое
RUN echo '#!/bin/sh\n\
echo "Attempting to initialize database..."\n\
python init_db.py || true\n\
echo "Attempting to start full application..."\n\
python run.py || {\n\
  echo "Failed to start full app, using minimal_app as fallback..."\n\
  python minimal_app.py\n\
}' > /app/start.sh && chmod +x /app/start.sh

# Запускаем с использованием скрипта
CMD ["/app/start.sh"]
