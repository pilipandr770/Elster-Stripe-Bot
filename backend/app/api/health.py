from flask import Blueprint, jsonify
from ..models import ModuleEnum

health_bp = Blueprint("health", __name__)

@health_bp.get("")
def health_check():
    """Endpoint для проверки работоспособности API."""
    response = {
        "status": "ok",
        "api": "Elster-Stripe-Bot API",
        "modules": [
            "accounting",
            "partner_check",
            "secretary",
            "marketing"
        ]
    }
    return jsonify(response)
