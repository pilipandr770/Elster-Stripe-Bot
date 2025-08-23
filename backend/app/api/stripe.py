"""API endpoints for Stripe integration."""
import os
import stripe
from flask import Blueprint, request, jsonify, g, current_app
from ..models import UserStripeAccount, Transaction
from .utils import jwt_required

stripe_bp = Blueprint("stripe", __name__)

# Set Stripe API key from environment
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

@stripe_bp.post("/connect")
@jwt_required
def connect_stripe():
    """Connect a user's Stripe account using their API key."""
    data = request.get_json(silent=True) or {}
    api_key = data.get("api_key", "").strip()
    
    if not api_key:
        return jsonify({"error": "Stripe API key is required"}), 400
    
    # Validate the API key by attempting to make a simple request
    try:
        # Use the provided API key to make a test request
        stripe.api_key = api_key
        # Just check the account to verify the API key works
        stripe.Account.retrieve()
        
        # Save the user's API key (encrypted in a real application)
        Session = getattr(current_app, "session_factory")
        with Session() as session:
            # Check if user already has a connected account
            account = session.query(UserStripeAccount).filter_by(user_id=g.user_id).first()
            
            if account:
                account.api_key = api_key  # In production, encrypt this
            else:
                account = UserStripeAccount(
                    user_id=g.user_id,
                    api_key=api_key,  # In production, encrypt this
                    is_connected=True
                )
                session.add(account)
            
            session.commit()
        
        # Reset back to the application's API key
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
        
        return jsonify({"message": "Stripe account connected successfully"})
    
    except stripe.error.AuthenticationError:
        return jsonify({"error": "Invalid Stripe API key"}), 400
    
    except Exception as e:
        current_app.logger.error(f"Error connecting Stripe account: {str(e)}")
        return jsonify({"error": f"Failed to connect Stripe account: {str(e)}"}), 500


@stripe_bp.get("/status")
@jwt_required
def check_stripe_status():
    """Check if the user has a connected Stripe account."""
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        account = session.query(UserStripeAccount).filter_by(user_id=g.user_id).first()
        
        return jsonify({
            "connected": bool(account and account.is_connected)
        })


@stripe_bp.get("/transactions")
@jwt_required
def get_transactions():
    """Get the user's Stripe transactions, optionally filtered by date range."""
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Check if user has a connected Stripe account
        account = session.query(UserStripeAccount).filter_by(user_id=g.user_id).first()
        
        if not account or not account.is_connected:
            return jsonify({"error": "Stripe account not connected"}), 400
        
        # In a real application, we would use the stored API key to fetch transactions
        # Here we'll simulate by returning transactions from the database
        query = session.query(Transaction).filter_by(user_id=g.user_id)
        
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        
        transactions = query.order_by(Transaction.date.desc()).all()
        
        # Convert to JSON serializable format
        result = []
        for tx in transactions:
            result.append({
                "id": tx.id,
                "date": tx.date.isoformat(),
                "description": tx.description,
                "amount": float(tx.amount),
                "currency": tx.currency,
                "status": tx.status,
                "taxAmount": float(tx.tax_amount) if tx.tax_amount is not None else None,
                "isExpenseClaimed": tx.is_expense_claimed
            })
        
        return jsonify(result)


@stripe_bp.post("/transactions/<transaction_id>/claim-expense")
@jwt_required
def mark_as_expense(transaction_id):
    """Mark a transaction as a claimed expense."""
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Find the transaction
        transaction = session.query(Transaction).filter_by(
            id=transaction_id, user_id=g.user_id
        ).first()
        
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404
        
        # Mark as expense claimed
        transaction.is_expense_claimed = True
        session.commit()
        
        # Return updated transaction
        return jsonify({
            "id": transaction.id,
            "date": transaction.date.isoformat(),
            "description": transaction.description,
            "amount": float(transaction.amount),
            "currency": transaction.currency,
            "status": transaction.status,
            "taxAmount": float(transaction.tax_amount) if transaction.tax_amount is not None else None,
            "isExpenseClaimed": transaction.is_expense_claimed
        })


@stripe_bp.post("/webhook")
def stripe_webhook():
    """Handle Stripe webhook events."""
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        
        # Handle specific events
        if event.type == "charge.succeeded":
            # Process a successful charge
            handle_charge_succeeded(event.data.object)
        elif event.type == "charge.refunded":
            # Process a refund
            handle_charge_refunded(event.data.object)
        
        return jsonify({"received": True})
    
    except stripe.error.SignatureVerificationError:
        return jsonify({"error": "Invalid signature"}), 400
    
    except Exception as e:
        current_app.logger.error(f"Error processing webhook: {str(e)}")
        return jsonify({"error": str(e)}), 500


def handle_charge_succeeded(charge):
    """Process a successful charge event."""
    # In a real application, we would:
    # 1. Find the user associated with the charge
    # 2. Create a transaction record in the database
    # 3. Calculate and record the tax amount
    current_app.logger.info(f"Processing charge succeeded: {charge.id}")


def handle_charge_refunded(charge):
    """Process a refund event."""
    # In a real application, we would:
    # 1. Find the associated transaction
    # 2. Update or create a refund transaction
    current_app.logger.info(f"Processing refund: {charge.id}")
