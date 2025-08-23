import time
import json
import re
from flask import Blueprint, request, Response, stream_with_context, jsonify, g, current_app
from .utils import jwt_required, get_thread_for_module, save_message
from ..models import ModuleEnum
from ..services.counterparty_check import CounterpartyCheckService
from ..prompts import PARTNER_CHECK_SYSTEM_PROMPT

partner_check_bp = Blueprint("partner_check", __name__)


@partner_check_bp.post("/chat")
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
		thread = get_thread_for_module(session, g.user_id, ModuleEnum.partnerCheck)
		
		# Save user message
		save_message(session, thread.id, "user", message)
		
		# Process the message to determine if it's a check request
		check_result = None
		company_name, vat_id = extract_company_info(message)
		
		if company_name or vat_id:
			# Perform actual counterparty check
			check_result = CounterpartyCheckService.check_counterparty(
				name=company_name or "Unknown",
				vat_id=vat_id
			)
		
		# Format a response based on check results or use a general response
		if check_result:
			reply_text = format_check_result(check_result, message)
		else:
			reply_text = f"Ich habe keine Firmennamen oder USt-IdNr. in Ihrer Anfrage erkannt. Bitte geben Sie den Namen oder die USt-IdNr. des Unternehmens an, das Sie überprüfen möchten."
		
		# Save AI response
		save_message(session, thread.id, "ai", reply_text)
		
		# Update thread's last activity time
		thread.updated_at = __import__("datetime").datetime.utcnow()
		session.commit()

	def generate():
		for token in reply_text.split():
			yield token + " "
			time.sleep(0.03)  # Slightly faster than before

	return Response(stream_with_context(generate()), mimetype="text/plain")


@partner_check_bp.post("/check")
@jwt_required
def check_counterparty():
	"""Direct endpoint for counterparty checks"""
	data = request.get_json(silent=True) or {}
	name = data.get("name", "").strip()
	vat_id = data.get("vat_id", "").strip()
	
	if not name and not vat_id:
		return jsonify({"error": "Either name or vat_id must be provided"}), 400
	
	# Get the user's profile information to include in the check
	checker_profile = None
	Session = getattr(current_app, "session_factory")
	with Session() as session:
		from ..models import UserProfile
		profile = session.query(UserProfile).filter_by(user_id=g.user_id).first()
		if profile:
			checker_profile = {
				"company_name": profile.company_name,
				"vat_id": profile.vat_id,
				"country": profile.country,
				"address": profile.address
			}
	
	# Perform comprehensive counterparty check
	result = CounterpartyCheckService.check_counterparty(
		name=name or "Unknown",
		vat_id=vat_id if vat_id else None,
		checker_profile=checker_profile
	)
	
	return jsonify(result)


def extract_company_info(message: str):
	"""Extract company name and VAT ID from message"""
	# Look for VAT ID pattern (e.g., DE123456789, GB123456789)
	vat_pattern = r'\b([A-Z]{2}[0-9A-Z]{7,12})\b'
	vat_match = re.search(vat_pattern, message, re.IGNORECASE)
	vat_id = vat_match.group(1).upper() if vat_match else None
	
	# Try to extract company name - this is much more challenging and would need NLP
	# Simple heuristic: look for capitalized phrases that could be company names
	company_patterns = [
		r'(?:Firma|Unternehmen|company)[\s:]+([A-Z][A-Za-z0-9\s&\.]{2,50}(?:GmbH|AG|Ltd|Inc|KG|OHG|UG)?)',
		r'\b([A-Z][A-Za-z0-9\s&\.]{2,20}\s(?:GmbH|AG|Ltd|Inc|KG|OHG|UG))\b'
	]
	
	company_name = None
	for pattern in company_patterns:
		company_match = re.search(pattern, message)
		if company_match:
			company_name = company_match.group(1).strip()
			break
	
	# If no structured pattern found, use simple heuristics on the whole message
	if not company_name and not vat_id:
		# Check if the message is short and could be just a company name
		if len(message.split()) <= 5 and any(x.isupper() for x in message[:1]):
			company_name = message.strip()
	
	return company_name, vat_id


def format_check_result(check_result, original_query):
	"""Format the check result into a human-readable response"""
	status = check_result.get("overall_status", "unknown")
	company_name = check_result.get("official_name", check_result.get("counterparty_name"))
	
	# Start with a status-based intro
	if status == "verified":
		response = f"✅ **{company_name}** wurde überprüft und scheint ein legitimes Unternehmen zu sein.\n\n"
	elif status == "warning":
		response = f"⚠️ **{company_name}** wurde überprüft. Es wurden potenzielle Risikofaktoren identifiziert.\n\n"
	elif status == "sanctioned":
		response = f"❌ **{company_name}** wurde überprüft und es wurden Sanktionen gefunden. Geschäftsbeziehungen sind möglicherweise illegal oder riskant.\n\n"
	else:
		response = f"ℹ️ Informationen zu **{company_name}** konnten nur teilweise verifiziert werden.\n\n"
	
	# Add VAT validation info
	vat_validation = check_result.get("checks", {}).get("vat_validation", {})
	if vat_validation.get("valid", False):
		response += f"**USt-IdNr.:** {vat_validation.get('country_code', '')}{vat_validation.get('vat_number', '')} (Gültig)\n"
		if vat_validation.get("company_name"):
			response += f"**Registrierter Name:** {vat_validation.get('company_name')}\n"
		if vat_validation.get("company_address"):
			response += f"**Registrierte Adresse:** {vat_validation.get('company_address')}\n"
	elif "error" not in vat_validation:
		response += f"**USt-IdNr.:** Konnte nicht validiert werden.\n"
	
	# Add sanctions info
	sanctions_check = check_result.get("checks", {}).get("sanctions_check", {})
	if sanctions_check.get("is_sanctioned", False):
		response += f"\n**⚠️ SANKTIONEN GEFUNDEN:**\n"
		for match in sanctions_check.get("matches", []):
			response += f"- Auf Liste: {match.get('list_name')}\n"
			response += f"  Datum: {match.get('date_listed')}\n"
			response += f"  Grund: {', '.join(match.get('reasons', ['Nicht angegeben']))}\n"
	
	# Add judicial cases info
	judicial_check = check_result.get("checks", {}).get("judicial_check", {})
	case_count = judicial_check.get("case_count", 0)
	if case_count > 0:
		response += f"\n**Rechtliche Verfahren:** {case_count} gefunden\n"
		for case in judicial_check.get("cases", [])[:3]:  # Show max 3 cases
			status_text = f"{case.get('status', 'Unbekannt')}"
			if case.get("outcome"):
				status_text += f" ({case.get('outcome')})"
			
			response += f"- {case.get('date_filed', 'N/A')}: {case.get('description', 'Keine Beschreibung')}\n"
			response += f"  Status: {status_text}\n"
		
		if case_count > 3:
			response += f"\n_...und {case_count - 3} weitere rechtliche Verfahren._\n"
	
	# Add summary based on status
	response += "\n**Zusammenfassung:** "
	if status == "verified":
		response += "Die Überprüfung ergab keine Risikofaktoren. Das Unternehmen scheint vertrauenswürdig zu sein."
	elif status == "warning":
		response += "Bei der Überprüfung wurden potenzielle Risikofaktoren festgestellt. Bitte prüfen Sie die Details und bewerten Sie das Risiko sorgfältig."
	elif status == "sanctioned":
		response += "Das Unternehmen unterliegt Sanktionen. Geschäftsbeziehungen könnten rechtliche Konsequenzen haben und sollten vermieden werden."
	else:
		response += "Es konnten nur begrenzte Informationen gefunden werden. Eine weitere manuelle Prüfung wird empfohlen."
	
	return response
