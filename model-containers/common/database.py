import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_database_connection():
    """Создание подключения к базе данных для определенной схемы"""
    db_url = os.getenv("DATABASE_URL")
    schema = os.getenv("DB_SCHEMA", "public")
    
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    engine = create_engine(db_url)
    
    # Устанавливаем схему по умолчанию для запросов
    with engine.connect() as conn:
        conn.execute(text(f"SET search_path TO {schema}"))
    
    Session = sessionmaker(bind=engine)
    return engine, Session

def setup_database():
    """Настройка базы данных, если необходимо"""
    engine, _ = get_database_connection()
    schema = os.getenv("DB_SCHEMA", "public")
    
    with engine.connect() as conn:
        # Создаем схему, если она еще не существует
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
        conn.commit()

def init_db():
    """Инициализация базы данных при запуске"""
    try:
        setup_database()
        logger.info(f"Database initialized with schema: {os.getenv('DB_SCHEMA', 'public')}")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
