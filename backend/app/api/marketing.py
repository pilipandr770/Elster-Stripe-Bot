import time
import json
import uuid
from flask import Blueprint, request, Response, stream_with_context, jsonify, g, current_app
from .utils import jwt_required, get_thread_for_module, save_message
from ..models import ModuleEnum
from ..services.model_context_manager import generate_module_response
from ..services.module_data_access import get_data_access_for_module, MarketingDataAccess

marketing_bp = Blueprint("marketing", __name__)

# In-memory storage для совместимости с существующим кодом (замените на БД)
channels_db = {}  # user_id -> list of channels
topics_db = {}    # user_id -> list of topics
posts_db = {}     # user_id -> list of posts


@marketing_bp.post("/chat")
@jwt_required
def chat_stream():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    model_type = data.get("model_type")  # Опционально: gemini или openai
    
    if not message:
        return jsonify({"error": "message field required"}), 400

    # Store user message in database
    Session = getattr(current_app, "session_factory")
    with Session() as session:
        # Используем специфичный класс доступа к данным для маркетингового модуля
        data_access = get_data_access_for_module(session, g.user_id, ModuleEnum.marketing)
        
        # Сохраняем сообщение пользователя
        data_access.save_message("user", message)
        
        # Получаем поток для модуля
        thread = data_access.get_module_thread()
        
        # Generate response using the enhanced model context manager
        reply_text = generate_module_response(
            ModuleEnum.marketing,
            message,
            thread_id=thread.id,
            session=session,
            model_type=model_type
        )
        
        # Сохраняем ответ AI
        data_access.save_message("ai", reply_text)
        
        # Update thread's last activity time
        thread.updated_at = __import__("datetime").datetime.utcnow()
        session.commit()

    def generate():
        for token in reply_text.split():
            yield token + " "
            time.sleep(0.05)

    return Response(stream_with_context(generate()), mimetype="text/plain")


@marketing_bp.route("/channels", methods=["GET", "POST", "DELETE"])
@jwt_required
def manage_channels():
    user_id = g.user_id
    
    if request.method == "GET":
        # Get channels for the current user
        user_channels = channels_db.get(user_id, [])
        return jsonify({"channels": user_channels})
    
    elif request.method == "POST":
        # Add a new channel
        data = request.get_json(silent=True) or {}
        
        platform = data.get("platform")
        url = data.get("url")
        api_credentials = data.get("apiCredentials")
        
        if not platform or not url:
            return jsonify({"error": "Platform and URL are required"}), 400
        
        # Generate a unique ID
        channel_id = f"ch_{uuid.uuid4().hex[:8]}"
        
        new_channel = {
            "id": channel_id,
            "platform": platform,
            "url": url,
            "apiCredentials": api_credentials
        }
        
        if user_id not in channels_db:
            channels_db[user_id] = []
            
        channels_db[user_id].append(new_channel)
        
        return jsonify({
            "success": True,
            "channel": new_channel
        })
    
    elif request.method == "DELETE":
        # Delete a channel
        channel_id = request.args.get("id")
        
        if not channel_id:
            return jsonify({"error": "Channel ID is required"}), 400
        
        if user_id in channels_db:
            channels_db[user_id] = [ch for ch in channels_db[user_id] if ch["id"] != channel_id]
            
        return jsonify({"success": True})


@marketing_bp.route("/topics", methods=["GET", "POST", "DELETE"])
@jwt_required
def manage_topics():
    user_id = g.user_id
    
    if request.method == "GET":
        # Get topics for the current user
        user_topics = topics_db.get(user_id, [])
        return jsonify({"topics": user_topics})
    
    elif request.method == "POST":
        # Add a new topic
        data = request.get_json(silent=True) or {}
        topic = data.get("topic")
        
        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        
        # Generate a unique ID
        topic_id = f"t_{uuid.uuid4().hex[:8]}"
        
        new_topic = {
            "id": topic_id,
            "topic": topic
        }
        
        if user_id not in topics_db:
            topics_db[user_id] = []
            
        topics_db[user_id].append(new_topic)
        
        return jsonify({
            "success": True,
            "topic": new_topic
        })
    
    elif request.method == "DELETE":
        # Delete a topic
        topic_id = request.args.get("id")
        
        if not topic_id:
            return jsonify({"error": "Topic ID is required"}), 400
        
        if user_id in topics_db:
            topics_db[user_id] = [t for t in topics_db[user_id] if t["id"] != topic_id]
            
        return jsonify({"success": True})


@marketing_bp.route("/posts", methods=["GET", "POST", "DELETE"])
@jwt_required
def manage_posts():
    user_id = g.user_id
    
    if request.method == "GET":
        # Get posts for the current user
        user_posts = posts_db.get(user_id, [])
        return jsonify({"posts": user_posts})
    
    elif request.method == "POST":
        # Add a new post
        data = request.get_json(silent=True) or {}
        
        channel_id = data.get("channelId")
        topic_id = data.get("topicId")
        scheduled_date = data.get("scheduledDate")
        generated_content = data.get("generatedContent")
        frequency = data.get("frequency")
        
        if not channel_id or not topic_id or not scheduled_date or not generated_content:
            return jsonify({"error": "Missing required fields"}), 400
        
        # Generate a unique ID
        post_id = f"post_{uuid.uuid4().hex[:8]}"
        
        new_post = {
            "id": post_id,
            "channelId": channel_id,
            "topicId": topic_id,
            "scheduledDate": scheduled_date,
            "status": "scheduled",
            "generatedContent": generated_content,
            "frequency": frequency
        }
        
        if user_id not in posts_db:
            posts_db[user_id] = []
            
        posts_db[user_id].append(new_post)
        
        return jsonify({
            "success": True,
            "post": new_post
        })
    
    elif request.method == "DELETE":
        # Delete a post
        post_id = request.args.get("id")
        
        if not post_id:
            return jsonify({"error": "Post ID is required"}), 400
        
        if user_id in posts_db:
            posts_db[user_id] = [p for p in posts_db[user_id] if p["id"] != post_id]
            
        return jsonify({"success": True})


@marketing_bp.route("/generate", methods=["POST"])
@jwt_required
def generate_content():
    data = request.get_json(silent=True) or {}
    
    channel_id = data.get("channelId")
    topic_id = data.get("topicId")
    
    if not channel_id or not topic_id:
        return jsonify({"error": "Channel ID and Topic ID are required"}), 400
    
    # Find channel and topic info
    user_id = g.user_id
    
    channel = next((c for c in channels_db.get(user_id, []) if c["id"] == channel_id), None)
    topic = next((t for t in topics_db.get(user_id, []) if t["id"] == topic_id), None)
    
    if not channel or not topic:
        return jsonify({"error": "Channel or topic not found"}), 404
    
    # Generate content using AI
    prompt = f"""
    You are a professional content creator specializing in {channel["platform"]} content.
    Create content for the following topic: "{topic["topic"]}"
    
    Generate a title, main text content, and an image prompt that would work well for {channel["platform"]}.
    Format your response as JSON with these fields:
    - title: A catchy title
    - text: The main content
    - mediaPrompt: A description for generating an image
    
    Keep in mind the specific format and tone that works best for {channel["platform"]}.
    """
    
    ai_response = generate_response(prompt)
    
    try:
        # Try to parse the AI response as JSON
        content = json.loads(ai_response)
        
        # If the response doesn't have the expected fields, format it
        if not all(k in content for k in ["title", "text", "mediaPrompt"]):
            content = {
                "title": f"Content about {topic['topic']}",
                "text": ai_response,
                "mediaPrompt": f"Professional image related to {topic['topic']}"
            }
    except:
        # If AI didn't return JSON, format the response manually
        content = {
            "title": f"Content about {topic['topic']}",
            "text": ai_response,
            "mediaPrompt": f"Professional image related to {topic['topic']}"
        }
    
    return jsonify({
        "success": True,
        "content": content
    })


@marketing_bp.route("/publish", methods=["POST"])
@jwt_required
def publish_post():
    data = request.get_json(silent=True) or {}
    post_id = data.get("postId")
    
    if not post_id:
        return jsonify({"error": "Post ID is required"}), 400
    
    user_id = g.user_id
    
    if user_id in posts_db:
        for i, post in enumerate(posts_db[user_id]):
            if post["id"] == post_id:
                # Update post status
                posts_db[user_id][i]["status"] = "published"
                posts_db[user_id][i]["scheduledDate"] = __import__("datetime").datetime.utcnow().isoformat()
                
                # In a real app, would integrate with social media APIs here
                
                return jsonify({
                    "success": True,
                    "post": posts_db[user_id][i]
                })
    
    return jsonify({"error": "Post not found"}), 404


@marketing_bp.route("/analytics", methods=["GET"])
@jwt_required
def get_analytics():
    # In a real application, would fetch real analytics from social media APIs
    # For now, return mock data
    
    return jsonify({
        "summary": {
            "reach": 3724,
            "engagement": 487,
            "engagementRate": 13.1,
            "reachChange": 12,
            "engagementChange": 8,
            "rateChange": -2
        },
        "channels": [
            {
                "platform": "LinkedIn",
                "posts": 12,
                "reach": 2480,
                "engagement": 324,
                "rate": 13.1
            },
            {
                "platform": "Blog",
                "posts": 4,
                "reach": 1244,
                "engagement": 163,
                "rate": 13.1
            }
        ],
        "topPosts": [
            {
                "id": "mock_post_1",
                "platform": "LinkedIn",
                "title": "Top 10 Tips for Small Businesses",
                "date": "2025-08-15T10:30:00Z",
                "reach": 1243,
                "engagement": 261,
                "rate": 21.0
            },
            {
                "id": "mock_post_2",
                "platform": "Blog",
                "title": "Case Study: Success with Our Product",
                "date": "2025-08-10T14:15:00Z",
                "reach": 987,
                "engagement": 142,
                "rate": 14.4
            }
        ]
    })
