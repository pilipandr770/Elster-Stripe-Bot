"""Auth endpoints: register & login (MVP)."""
from __future__ import annotations
from flask import Blueprint, request, current_app, jsonify
from sqlalchemy import select
from ..models import User
import os
from ..security import hash_password, verify_password, create_access_token

auth_bp = Blueprint("auth", __name__)


def get_session():  # helper to acquire session from app context
    Session = getattr(current_app, "session_factory")  # type: ignore
    return Session()


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": {"code": 400, "message": "email and password required"}}), 400
    with get_session() as session:
        exists = session.scalar(select(User).where(User.email == email))
        if exists:
            return jsonify({"error": {"code": 400, "message": "email already registered"}}), 400
        role = "admin" if email == os.getenv("ADMIN_EMAIL") else "user"
        user = User(email=email, password_hash=hash_password(password), role=role)
        session.add(user)
        session.commit()
        token = create_access_token(user.id, user.role)
        return {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role}}


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": {"code": 400, "message": "email and password required"}}), 400
    with get_session() as session:
        user = session.scalar(select(User).where(User.email == email))
        if not user or not verify_password(password, user.password_hash):
            return jsonify({"error": {"code": 401, "message": "invalid credentials"}}), 401
        # update last_login_at
        user.last_login_at = __import__("datetime").datetime.utcnow()
        session.commit()
        token = create_access_token(user.id, user.role)
        return {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role, "lastLogin": user.last_login_at.isoformat()}}
