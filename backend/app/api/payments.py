"""Stripe payment processing and webhooks."""
import os
import json
import stripe
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import select, update
from .utils import jwt_required, admin_required
from ..models import User

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

payments_bp = Blueprint("payments", __name__)


@payments_bp.post("/create-checkout-session")
@jwt_required
def create_checkout_session():
    """Create a Stripe Checkout Session."""
    try:
        # Create a new Checkout Session for the order
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": "Elster AI Assistant Pro Subscription",
                            "description": "Full access to all AI Assistant modules",
                        },
                        "unit_amount": 2990,  # €29.90
                        "recurring": {
                            "interval": "month",
                        },
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=f"{request.host_url}dashboard?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{request.host_url}dashboard?canceled=true",
            client_reference_id=request.json.get("user_id", ""),  # Store user ID to identify customer
        )
        return jsonify({"id": session.id, "url": session.url})
    except Exception as e:
        return jsonify(error=str(e)), 400


@payments_bp.post("/webhook")
def webhook():
    """Handle Stripe webhook events."""
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        # Invalid payload
        return jsonify({"status": "error", "message": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return jsonify({"status": "error", "message": "Invalid signature"}), 400

    # Handle the checkout.session.completed event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        
        # Get customer from session
        user_id = session.get("client_reference_id")
        if user_id:
            # Update user subscription status
            Session = getattr(current_app, "session_factory")
            with Session() as db_session:
                db_session.execute(
                    update(User)
                    .where(User.id == user_id)
                    .values(
                        subscription_status="active",
                    )
                )
                db_session.commit()
    
    # Handle subscription cancellation or expiration
    elif event["type"] in ["customer.subscription.deleted", "customer.subscription.updated"]:
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        
        # Get user with this customer ID and update subscription status
        if subscription.get("status") == "canceled" or subscription.get("status") == "unpaid":
            # Update user subscription status
            Session = getattr(current_app, "session_factory")
            with Session() as db_session:
                # We would need to store the Stripe customer ID with the user 
                # to handle this properly in a real implementation
                pass

    return jsonify({"status": "success"})


@payments_bp.get("/customers")
@admin_required
def list_customers():
    """List all Stripe customers (admin only)."""
    try:
        customers = stripe.Customer.list(limit=100)
        return jsonify({"customers": customers.data})
    except Exception as e:
        return jsonify(error=str(e)), 400
