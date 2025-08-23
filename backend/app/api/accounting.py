import time
from flask import Blueprint, request, Response, stream_with_context, jsonify, g, current_app
from .utils import jwt_required, get_thread_for_module, save_message
from ..models import ModuleEnum

accounting_bp = Blueprint("accounting", __name__)


@accounting_bp.post("/chat")
@jwt_required
def chat_stream():
	"""Prototype streaming endpoint for Accounting module.
	Accepts JSON { "message": "..." } and streams back a simple echo.
	Frontend expects a raw text stream (chunked). Later will migrate to SSE.
	"""
	data = request.get_json(silent=True) or {}
	message = (data.get("message") or "").strip()
	if not message:
		return jsonify({"error": "message field required"}), 400

	# Store user message in database
	Session = getattr(current_app, "session_factory")
	with Session() as session:
		# Get or create conversation thread for this user and module
		thread = get_thread_for_module(session, g.user_id, ModuleEnum.accounting)
		
		# Save user message
		save_message(session, thread.id, "user", message)
		
		# TODO: integrate real model provider & guarded prompt
		reply_text = f"Echo (Accounting): {message}"  # placeholder
		
		# Save AI response (pre-generated for now)
		save_message(session, thread.id, "ai", reply_text)
		
		# Update thread's last activity time
		thread.updated_at = __import__("datetime").datetime.utcnow()
		session.commit()

	def generate():
		# Stream word by word to simulate token streaming
		for word in reply_text.split():
			yield word + " "
			time.sleep(0.05)

	return Response(stream_with_context(generate()), mimetype="text/plain")
