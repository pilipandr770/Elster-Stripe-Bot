"""API endpoints for managing user profile."""
from flask import Blueprint, request, jsonify, g, current_app
from ..models import UserProfile
from .utils import jwt_required

profile_bp = Blueprint("profile", __name__)

@profile_bp.get("")
@jwt_required
def get_user_profile():
    """Get the current user's profile"""
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Find existing profile
        profile = session.query(UserProfile).filter_by(user_id=g.user_id).first()
        
        if profile:
            return jsonify({
                "id": profile.id,
                "companyName": profile.company_name,
                "vatId": profile.vat_id,
                "address": profile.address,
                "country": profile.country
            })
        else:
            return jsonify({
                "message": "No profile found"
            }), 404

@profile_bp.post("")
@jwt_required
def create_update_user_profile():
    """Create or update the current user's profile"""
    data = request.get_json(silent=True) or {}
    
    # Validate required fields
    required_fields = ["companyName", "vatId", "address", "country"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Field '{field}' is required"}), 400
    
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Find existing profile or create new one
        profile = session.query(UserProfile).filter_by(user_id=g.user_id).first()
        
        if not profile:
            profile = UserProfile(user_id=g.user_id)
            session.add(profile)
        
        # Update profile data
        profile.company_name = data["companyName"]
        profile.vat_id = data["vatId"]
        profile.address = data["address"]
        profile.country = data["country"]
        profile.updated_at = __import__("datetime").datetime.utcnow()
        
        session.commit()
        
        return jsonify({
            "id": profile.id,
            "companyName": profile.company_name,
            "vatId": profile.vat_id,
            "address": profile.address,
            "country": profile.country
        }), 200
