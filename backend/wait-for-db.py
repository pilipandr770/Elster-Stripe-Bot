"""
Скрипт для ожидания готовности базы данных перед запуском приложения
"""
import os
import time
import logging
from sqlalchemy import create_engine, text
import socket

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def wait_for_port(host, port, timeout=30):
    """Ожидание доступности порта"""
    start_time = time.time()
    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            sock.connect((host, port))
            sock.close()
            return True
        except (socket.timeout, ConnectionRefusedError):
            if time.time() - start_time >= timeout:
                return False
            time.sleep(1)
            continue

def wait_for_db(url, max_retries=30, retry_interval=2):
    """Ожидание готовности базы данных"""
    logger.info(f"Waiting for database to be ready at {url}")
    
    # Извлекаем хост и порт из URL подключения
    if "postgresql" in url or "postgres" in url:
        host = url.split('@')[1].split(':')[0] if '@' in url else url.split('/')[2].split(':')[0]
        port = int(url.split(':')[-1].split('/')[0]) if ':' in url.split('@')[-1] else 5432
        
        # Сначала проверяем, что порт открыт
        logger.info(f"Checking if port {port} is open on {host}")
        if not wait_for_port(host, port):
            logger.error(f"Port {port} on {host} is not accessible after timeout")
            return False
    
    # Затем пытаемся установить соединение с БД
    retry_count = 0
    last_error = None
    
    while retry_count < max_retries:
        try:
            engine = create_engine(url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database is ready!")
                return True
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Attempt {retry_count + 1}/{max_retries}: Database not ready yet: {last_error}")
            retry_count += 1
            time.sleep(retry_interval)
    
    logger.error(f"Database connection failed after {max_retries} attempts. Last error: {last_error}")
    return False

if __name__ == "__main__":
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL environment variable not set")
        exit(1)
    
    if wait_for_db(db_url):
        exit(0)
    else:
        exit(1)
