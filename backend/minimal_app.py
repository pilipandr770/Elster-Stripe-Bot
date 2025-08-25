"""
Минимальное приложение Flask для запуска в случае проблем с полным приложением
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_minimal_app():
    app = Flask(__name__)
    CORS(app)
    
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({"status": "ok", "mode": "minimal"})
    
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        try:
            data = request.get_json(silent=True) or {}
            email = data.get('email', '')
            password = data.get('password', '')
            
            logger.info(f"Register attempt for: {email}")
            
            if not email or not password:
                return jsonify({"error": {"code": 400, "message": "email and password required"}}), 400
            
            # В минимальном режиме всегда возвращаем успешный ответ
            return jsonify({
                "token": "test_token_for_minimal_mode",
                "user": {
                    "id": "test-user-id",
                    "email": email,
                    "role": "user",
                    "lastLogin": "2025-08-24T00:00:00Z"
                }
            })
        except Exception as e:
            logger.error(f"Error in register: {str(e)}")
            return jsonify({"error": {"code": 500, "message": str(e)}}), 500
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        try:
            data = request.get_json(silent=True) or {}
            email = data.get('email', '')
            password = data.get('password', '')
            
            logger.info(f"Login attempt for: {email}")
            
            if not email or not password:
                return jsonify({"error": {"code": 400, "message": "email and password required"}}), 400
            
            # В минимальном режиме всегда возвращаем успешный ответ
            return jsonify({
                "token": "test_token_for_minimal_mode",
                "user": {
                    "id": "test-user-id",
                    "email": email,
                    "role": "user",
                    "lastLogin": "2025-08-24T00:00:00Z"
                }
            })
        except Exception as e:
            logger.error(f"Error in login: {str(e)}")
            return jsonify({"error": {"code": 500, "message": str(e)}}), 500
            
    return app

if __name__ == "__main__":
    app = create_minimal_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
