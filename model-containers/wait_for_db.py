#!/usr/bin/env python3
import os
import time
import psycopg2

def wait_for_database():
    host = os.environ.get('POSTGRES_HOST', 'postgres')
    port = os.environ.get('POSTGRES_PORT', '5432')
    dbname = os.environ.get('POSTGRES_DB', 'app')
    user = os.environ.get('POSTGRES_USER', 'postgres')
    password = os.environ.get('POSTGRES_PASSWORD', 'postgres')
    
    print(f'Ожидание запуска базы данных {host}:{port}...')
    max_attempts = 30
    
    for i in range(max_attempts):
        try:
            conn = psycopg2.connect(
                host=host,
                port=port,
                dbname=dbname,
                user=user,
                password=password
            )
            conn.close()
            print('База данных доступна!')
            return True
        except Exception as e:
            print(f'Попытка {i+1}/{max_attempts}: {e}')
            if i < max_attempts-1:
                time.sleep(2)
            else:
                print('Превышено время ожидания базы данных.')
                return False

if __name__ == '__main__':
    wait_for_database()
