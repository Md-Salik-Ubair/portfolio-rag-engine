# Dynamic Blueprint Gateway Layer for RAG Chat Operations
from flask import Blueprint, jsonify, request
from app.services.rag_service import query_rag_brain

rag_bp = Blueprint('rag', __name__)

@rag_bp.route('/chat', methods=['POST'])
def process_ai_interaction():
    """Receives asynchronous payloads from the React client and hooks into the semantic agent."""
    try:
        data = request.get_json() or {}
        user_question = data.get('question')
        
        if not user_question or not str(user_question).strip():
            return jsonify({
                "success": False,
                "error": "Execution Blocked: Input question parameters cannot be empty."
            }), 400
            
        # Triggering the zero-hallucination processor logic safely
        ai_reply = query_rag_brain(str(user_question).strip())
        
        return jsonify({
            "success": True,
            "user_question": user_question,
            "ai_response": ai_reply
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Fatal runtime failure inside the core AI orchestration layer.",
            "details": str(e)
        }), 500