"""
Скрипт для отображения статуса базы данных
"""
import os
import sys
from datetime import datetime

# Добавляем родительский каталог в путь для импорта
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import init_engine, create_session_factory
from app.models import User, Base
from sqlalchemy import inspect, select

def check_tables():
    print("Checking database schema...")
    engine = init_engine()
    inspector = inspect(engine)
    
    # Получаем список таблиц из метаданных
    metadata_tables = set(Base.metadata.tables.keys())
    db_tables = set(inspector.get_table_names())
    
    print(f"Tables defined in models: {', '.join(sorted(metadata_tables))}")
    print(f"Tables found in database: {', '.join(sorted(db_tables))}")
    
    missing_tables = metadata_tables - db_tables
    if missing_tables:
        print(f"Warning: Missing tables in database: {', '.join(sorted(missing_tables))}")
    else:
        print("All tables from models exist in the database.")

def check_users():
    print("\nChecking users...")
    engine = init_engine()
    Session = create_session_factory(engine)
    
    with Session() as session:
        try:
            # Проверяем количество пользователей
            user_count = session.scalar(select(User.id).count())
            print(f"Total users in database: {user_count}")
            
            # Выводим информацию о пользователях
            users = session.scalars(select(User)).all()
            print("\nUser list:")
            for user in users:
                print(f"ID: {user.id}, Email: {user.email}, Role: {user.role}, " +
                      f"Status: {user.subscription_status}, Last Login: {user.last_login_at}")
        except Exception as e:
            print(f"Error checking users: {str(e)}")

if __name__ == "__main__":
    check_tables()
    check_users()
