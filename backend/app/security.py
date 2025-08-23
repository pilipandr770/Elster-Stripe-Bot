"""Security helpers: password hashing & JWT."""
from __future__ import annotations
import os, datetime
import jwt
from passlib.hash import bcrypt

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_change")
JWT_ALG = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.verify(password, password_hash)
    except Exception:
        return False

def create_access_token(user_id: str, role: str, expires_minutes: int = 60) -> str:
    now = datetime.datetime.utcnow()
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + datetime.timedelta(minutes=expires_minutes),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        return None
