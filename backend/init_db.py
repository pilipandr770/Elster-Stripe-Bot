"""
Скрипт для инициализации базы данных и создания тестового пользователя
"""
import os
import sys
from datetime import datetime

# Добавляем родительский каталог в путь для импорта
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import init_engine, create_session_factory
from app.models import Base, User
from app.security import hash_password

def init_db():
    print("Initializing database...")
    engine = init_engine()
    
    # Создаем все таблицы
    print("Creating tables...")
    Base.metadata.create_all(engine)
    
    # Создаем сессию
    Session = create_session_factory(engine)
    
    with Session() as session:
        # Проверяем, существует ли уже тестовый пользователь
        test_email = "test@example.com"
        user = session.query(User).filter_by(email=test_email).first()
        
        if not user:
            print(f"Creating test user with email: {test_email}")
            # Создаем тестового пользователя
            user = User(
                email=test_email,
                password_hash=hash_password("password"),
                role="user",
                subscription_status="active",
                last_login_at=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
            session.add(user)
            
            # Создаем тестового администратора
            admin_email = "admin@example.com"
            admin = User(
                email=admin_email,
                password_hash=hash_password("admin"),
                role="admin",
                subscription_status="active",
                last_login_at=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
            session.add(admin)
            
            session.commit()
            print(f"Created test user: {test_email}")
            print(f"Created admin user: {admin_email}")
        else:
            print(f"Test user already exists: {test_email}")

if __name__ == "__main__":
    init_db()
    print("Database initialization complete.")
