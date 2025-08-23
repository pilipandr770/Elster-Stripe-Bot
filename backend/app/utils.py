"""Utility functions and decorators."""
from functools import wraps
from flask import request, jsonify, g
from .security import decode_token
from typing import Callable, TypeVar

F = TypeVar('F', bound=Callable)

def auth_required(f: F) -> F:
    """Decorator to check valid JWT in Authorization header.
    Sets g.user_id and g.user_role if token is valid.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        
        # Extract token (Bearer token format)
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "missing or invalid auth token"}), 401
        
        token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else ""
        if not token:
            return jsonify({"error": "missing token"}), 401
            
        # Verify token
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "invalid token"}), 401
            
        # Add user info to Flask's g object for access in route
        g.user_id = payload.get("sub")
        g.user_role = payload.get("role", "user")
        
        # Continue to the original function
        return f(*args, **kwargs)
        
    return decorated  # type: ignore
