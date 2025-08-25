"""API endpoints for ELSTER integration."""
import os
from datetime import datetime
from flask import Blueprint, request, jsonify, g, current_app
from ..models import UserElsterAccount, Submission, SubmissionFrequency, Transaction
from ..services.elster_service import ElsterService
from .utils import jwt_required

# Initialize the ELSTER service on module load
ElsterService.initialize()

elster_bp = Blueprint("elster", __name__)

@elster_bp.post("/connect")
@jwt_required
def connect_elster():
    """Connect a user's ELSTER account using their tax ID and additional data."""
    data = request.get_json(silent=True) or {}
    tax_id = data.get("tax_id", "").strip()
    form_data = data.get("form_data")
    
    if not tax_id:
        return jsonify({"error": "Tax ID is required"}), 400
    
    # Validate tax ID format (very basic validation, adjust as needed)
    if not (len(tax_id.replace(" ", "")) == 11 and tax_id.replace(" ", "").isdigit()):
        return jsonify({"error": "Invalid Tax ID format"}), 400
    
    # Save the user's tax ID and form data
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Check if user already has an account
        account = session.query(UserElsterAccount).filter_by(user_id=g.user_id).first()
        
        if account:
            account.tax_id = tax_id
            if form_data:
                account.full_name = form_data.get("fullName", account.full_name)
                account.street_address = form_data.get("streetAddress", account.street_address)
                account.city = form_data.get("city", account.city)
                account.postal_code = form_data.get("postalCode", account.postal_code)
                account.bank_name = form_data.get("bankName", account.bank_name)
                account.iban = form_data.get("iban", account.iban)
        else:
            account = UserElsterAccount(
                user_id=g.user_id,
                tax_id=tax_id,
                is_connected=True,
                frequency=SubmissionFrequency.quarterly
            )
            
            if form_data:
                account.full_name = form_data.get("fullName")
                account.street_address = form_data.get("streetAddress")
                account.city = form_data.get("city")
                account.postal_code = form_data.get("postalCode")
                account.bank_name = form_data.get("bankName")
                account.iban = form_data.get("iban")
            
            session.add(account)
        
        session.commit()
    
    return jsonify({"message": "ELSTER account connected successfully"})


@elster_bp.get("/status")
@jwt_required
def check_elster_status():
    """Check if the user has a connected ELSTER account."""
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        account = session.query(UserElsterAccount).filter_by(user_id=g.user_id).first()
        
        return jsonify({
            "connected": bool(account and account.is_connected)
        })


@elster_bp.get("/submissions")
@jwt_required
def get_submissions():
    """Get the user's tax submissions."""
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        submissions = session.query(Submission).filter_by(user_id=g.user_id).order_by(
            Submission.timestamp.desc()
        ).all()
        
        result = []
        for sub in submissions:
            # Get transaction IDs included in this submission
            transaction_ids = [tx.id for tx in sub.transactions]
            
            result.append({
                "id": sub.id,
                "timestamp": sub.timestamp.isoformat(),
                "period": sub.period,
                "status": sub.status.value,
                "transactionIds": transaction_ids
            })
        
        return jsonify(result)


@elster_bp.get("/submissions/<submission_id>")
@jwt_required
def get_submission(submission_id):
    """Get a specific tax submission."""
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        sub = session.query(Submission).filter_by(
            id=submission_id, user_id=g.user_id
        ).first()
        
        if not sub:
            return jsonify({"error": "Submission not found"}), 404
        
        # Get transaction IDs included in this submission
        transaction_ids = [tx.id for tx in sub.transactions]
        
        return jsonify({
            "id": sub.id,
            "timestamp": sub.timestamp.isoformat(),
            "period": sub.period,
            "status": sub.status.value,
            "transactionIds": transaction_ids
        })


@elster_bp.post("/submit")
@jwt_required
def submit_declaration():
    """Submit a tax declaration for a period."""
    data = request.get_json(silent=True) or {}
    period = data.get("period", "").strip()
    transaction_ids = data.get("transaction_ids", [])
    
    if not period:
        return jsonify({"error": "Period is required"}), 400
    
    if not transaction_ids:
        return jsonify({"error": "No transactions selected for submission"}), 400
    
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Check if user has a connected ELSTER account
        account = session.query(UserElsterAccount).filter_by(user_id=g.user_id).first()
        
        if not account or not account.is_connected:
            return jsonify({"error": "ELSTER account not connected"}), 400
        
        # Verify transactions belong to the user
        transactions = session.query(Transaction).filter(
            Transaction.id.in_(transaction_ids),
            Transaction.user_id == g.user_id
        ).all()
        
        if len(transactions) != len(transaction_ids):
            return jsonify({"error": "Some transactions were not found"}), 400
        
        # Check if a submission for this period already exists
        existing = session.query(Submission).filter_by(
            user_id=g.user_id, period=period
        ).first()
        
        if existing:
            return jsonify({
                "error": f"A submission for period {period} already exists"
            }), 400
        
        # Get user's tax ID
        account = session.query(UserElsterAccount).filter_by(user_id=g.user_id).first()
        if not account:
            return jsonify({"error": "ELSTER account not found"}), 404
        
        # Prepare transaction data for ELSTER service
        tx_data = []
        for tx in transactions:
            tx_data.append({
                "id": tx.id,
                "date": tx.date.isoformat(),
                "amount": float(tx.amount),
                "tax_amount": float(tx.tax_amount) if tx.tax_amount else None,
                "is_expense_claimed": tx.is_expense_claimed
            })
        
        try:
            # Use ELSTER service to prepare and submit the declaration
            declaration = ElsterService.prepare_vat_declaration(
                transactions=tx_data, 
                tax_id=account.tax_id,
                period=period
            )
            
            result = ElsterService.submit_declaration(declaration)
            
            # Create a new submission record
            submission = Submission(
                user_id=g.user_id,
                timestamp=datetime.utcnow(),
                period=period,
                transactions=transactions,
                status=SubmissionStatus.processing  # Start with processing status
            )
            
            session.add(submission)
            session.commit()
            
            return jsonify({
            "id": submission.id,
            "timestamp": submission.timestamp.isoformat(),
            "period": submission.period,
            "status": submission.status.value,
            "transactionIds": transaction_ids
        })
        except Exception as e:
            session.rollback()
            return jsonify({
                "error": f"Failed to submit tax declaration: {str(e)}",
                "status": "error"
            }), 500


@elster_bp.get("/frequency")
@jwt_required
def get_frequency():
    """Get the user's submission frequency setting."""
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        account = session.query(UserElsterAccount).filter_by(user_id=g.user_id).first()
        
        if not account:
            return jsonify({"error": "ELSTER account not found"}), 404
        
        return jsonify({
            "frequency": account.frequency.value
        })


@elster_bp.put("/frequency")
@jwt_required
def update_frequency():
    """Update the user's submission frequency setting."""
    data = request.get_json(silent=True) or {}
    frequency = data.get("frequency")
    
    if not frequency or frequency not in ("quarterly", "annually"):
        return jsonify({"error": "Valid frequency (quarterly or annually) is required"}), 400
    
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        account = session.query(UserElsterAccount).filter_by(user_id=g.user_id).first()
        
        if not account:
            return jsonify({"error": "ELSTER account not found"}), 404
        
        account.frequency = SubmissionFrequency.quarterly if frequency == "quarterly" else SubmissionFrequency.annually
        session.commit()
        
        return jsonify({
            "message": f"Submission frequency updated to {frequency}"
        })
