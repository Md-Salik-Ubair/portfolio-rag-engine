# Dynamic Blueprint Gateway Layer for RAG Chat Operations
import logging
from flask import Blueprint, jsonify, request
from app.services.rag_service import query_rag_brain

# Professional server logging setup for tracking AI latency and queries
logging.basicConfig(level=logging.INFO, format='%(asctime)s - RAG_ENGINE - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

rag_bp = Blueprint('rag', __name__)

@rag_bp.route('/chat', methods=['POST'])
def process_ai_interaction():
    """Receives asynchronous payloads from the React client and hooks into the semantic agent."""
    try:
        data = request.get_json() or {}
        user_question = data.get('question')
        
        if not user_question or not str(user_question).strip():
            logger.warning("Blocked empty interaction request.")
            return jsonify({
                "success": False,
                "error": "Execution Blocked: Input question parameters cannot be empty."
            }), 400
            
        logger.info(f"Incoming Vector Query: {user_question}")
        
        # Triggering the upgraded LangChain & ChromaDB processor logic
        ai_reply = query_rag_brain(str(user_question).strip())
        
        logger.info("Context mapped and LLM response generated successfully.")
        
        return jsonify({
            "success": True,
            "user_question": user_question,
            "ai_response": ai_reply
        }), 200

    except Exception as e:
        logger.error(f"Fatal runtime failure: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Fatal runtime failure inside the core AI orchestration layer.",
            "details": str(e)
        }), 500