"""Auth endpoints: register & login (MVP)."""
from __future__ import annotations
from flask import Blueprint, request, current_app, jsonify
from sqlalchemy import select
from ..models import User
import os
import logging
from ..security import hash_password, verify_password, create_access_token

# Настраиваем логирование
logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)


def get_session():  # helper to acquire session from app context
    Session = getattr(current_app, "session_factory")  # type: ignore
    return Session()


@auth_bp.post("/register")
def register():
    logger.info("Register endpoint called")
    try:
        data = request.get_json(silent=True) or {}
        logger.debug(f"Register request data: {data}")
        
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        
        if not email or not password:
            logger.warning("Registration attempt with missing email or password")
            return jsonify({"error": {"code": 400, "message": "email and password required"}}), 400
        
        logger.info(f"Attempting to register user with email: {email}")
        
        with get_session() as session:
            exists = session.scalar(select(User).where(User.email == email))
            if exists:
                logger.warning(f"Registration attempt for existing email: {email}")
                return jsonify({"error": {"code": 400, "message": "email already registered"}}), 400
            
            role = "admin" if email == os.getenv("ADMIN_EMAIL") else "user"
            user = User(email=email, password_hash=hash_password(password), role=role)
            session.add(user)
            session.commit()
            
            logger.info(f"User registered successfully: {email}, role: {role}, id: {user.id}")
            
            token = create_access_token(user.id, user.role)
            return {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role}}
    except Exception as e:
        logger.error(f"Error in register endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": {"code": 500, "message": "Internal server error: " + str(e)}}), 500


@auth_bp.post("/login")
def login():
    logger.info("Login endpoint called")
    try:
        data = request.get_json(silent=True) or {}
        logger.debug(f"Login request data: {data}")
        
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        
        if not email or not password:
            logger.warning("Login attempt with missing email or password")
            return jsonify({"error": {"code": 400, "message": "email and password required"}}), 400
        
        logger.info(f"Attempting login for user: {email}")
        
        with get_session() as session:
            user = session.scalar(select(User).where(User.email == email))
            
            if not user:
                logger.warning(f"Login attempt for non-existent user: {email}")
                return jsonify({"error": {"code": 401, "message": "invalid credentials"}}), 401
                
            if not verify_password(password, user.password_hash):
                logger.warning(f"Failed login attempt (incorrect password) for user: {email}")
                return jsonify({"error": {"code": 401, "message": "invalid credentials"}}), 401
            
            # update last_login_at
            user.last_login_at = __import__("datetime").datetime.utcnow()
            session.commit()
            
            logger.info(f"User logged in successfully: {email}, id: {user.id}")
            
            token = create_access_token(user.id, user.role)
            return {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role, "lastLogin": user.last_login_at.isoformat()}}
    except Exception as e:
        logger.error(f"Error in login endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": {"code": 500, "message": "Internal server error: " + str(e)}}), 500
