from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv(override=False)


def create_app() -> Flask:
	app = Flask(__name__)
	app.config["ENV"] = os.getenv("ENV", "development")
	app.config["LOG_LEVEL"] = os.getenv("LOG_LEVEL", "info")

	# Basic CORS (tighten in production)
	CORS(app, resources={r"/api/*": {"origins": "*"}})

	# Register blueprints
	# Initialize DB
	from .db import init_engine, create_session_factory
	engine = init_engine()
	app.session_factory = create_session_factory(engine)  # type: ignore[attr-defined]

	# Create tables if not exist (placeholder until Alembic migrations added)
	from .models import Base
	with engine.begin() as conn:
		Base.metadata.create_all(conn)

from .api.accounting import accounting_bp
from .api.partner_check import partner_check_bp
from .api.secretary import secretary_bp
from .api.marketing import marketing_bp
from .api.auth import auth_bp
from .api.chat_history import chat_history_bp
from .api.payments import payments_bp
from .api.profile import profile_bp
from .api.stripe import stripe_bp
from .api.elster import elster_bp
from .api.secretary_config import secretary_config_bp
from .api.email_service import mcp_email_bp
from .api.signal_service import signal_bp
from .api.livekit_service import livekit_bp

app.register_blueprint(accounting_bp, url_prefix="/api/accounting")
app.register_blueprint(partner_check_bp, url_prefix="/api/partner_check")
app.register_blueprint(secretary_bp, url_prefix="/api/secretary")
app.register_blueprint(secretary_config_bp, url_prefix="/api/secretary")
app.register_blueprint(mcp_email_bp, url_prefix="/api/secretary/email")
app.register_blueprint(signal_bp, url_prefix="/api/secretary/signal")
app.register_blueprint(livekit_bp, url_prefix="/api/secretary/phone")
app.register_blueprint(marketing_bp, url_prefix="/api/marketing")
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(chat_history_bp, url_prefix="/api/history")
app.register_blueprint(payments_bp, url_prefix="/api/payments")
app.register_blueprint(profile_bp, url_prefix="/api/profile")
app.register_blueprint(stripe_bp, url_prefix="/api/stripe")
app.register_blueprint(elster_bp, url_prefix="/api/elster")	@app.get("/health")
	def health():  # simple health endpoint
		return {"status": "ok"}

	@app.errorhandler(400)
	def bad_request(e):  # lightweight JSON error format
		return jsonify({"error": {"code": 400, "message": str(e)}}), 400

	@app.errorhandler(404)
	def not_found(e):
		return jsonify({"error": {"code": 404, "message": "Not found"}}), 404

	@app.errorhandler(500)
	def server_error(e):
		return jsonify({"error": {"code": 500, "message": "Internal server error"}}), 500

	return app
