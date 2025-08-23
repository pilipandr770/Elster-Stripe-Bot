import time
from flask import Blueprint, request, Response, stream_with_context, jsonify, g, current_app
from .utils import jwt_required, get_thread_for_module, save_message
from ..models import ModuleEnum

secretary_bp = Blueprint("secretary", __name__)


@secretary_bp.post("/chat")
@jwt_required
def chat_stream():
	data = request.get_json(silent=True) or {}
	message = (data.get("message") or "").strip()
	if not message:
		return jsonify({"error": "message field required"}), 400

	# Store user message in database
	Session = getattr(current_app, "session_factory")
	with Session() as session:
		# Get or create conversation thread for this user and module
		thread = get_thread_for_module(session, g.user_id, ModuleEnum.secretary)
		
		# Save user message
		save_message(session, thread.id, "user", message)
		
		# TODO: integrate real model provider & guarded prompt
		reply_text = f"Echo (Secretary): {message}"  # placeholder
		
		# Save AI response (pre-generated for now)
		save_message(session, thread.id, "ai", reply_text)
		
		# Update thread's last activity time
		thread.updated_at = __import__("datetime").datetime.utcnow()
		session.commit()

	def generate():
		for token in reply_text.split():
			yield token + " "
			time.sleep(0.05)

	return Response(stream_with_context(generate()), mimetype="text/plain")
