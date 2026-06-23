# Dynamic Blueprint Gateway Layer for RAG Chat Operations
import os
import time
import glob
import logging
from flask import Blueprint, jsonify, request, current_app
from app.services.rag_service import query_rag_brain, generate_audio_sync

# Professional server logging setup for tracking AI latency and queries
logging.basicConfig(level=logging.INFO, format='%(asctime)s - RAG_ENGINE - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

rag_bp = Blueprint('rag', __name__)

@rag_bp.route('/chat', methods=['POST'])
def process_ai_interaction():
    """Receives asynchronous payloads from the React client, hooks into the semantic agent, and generates real-time neural audio."""
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
        
        # 1. Triggering the upgraded LangChain & ChromaDB processor logic
        ai_reply = query_rag_brain(str(user_question).strip())
        logger.info("Context mapped and LLM text response generated successfully.")
        
        # 2. AUDIO GENERATION & AUTO-CLEANUP PROTOCOL
        audio_url = None
        try:
            static_audio_dir = os.path.join(current_app.root_path, 'static', 'audio')
            os.makedirs(static_audio_dir, exist_ok=True)
            
            # --- AUTO-CLEANUP BLOCK ---
            # Delete all existing .mp3 files in the folder before creating a new one
            old_files = glob.glob(os.path.join(static_audio_dir, '*.mp3'))
            for f in old_files:
                try:
                    os.remove(f)
                    logger.info(f"Cleaned up old audio file: {f}")
                except Exception as cleanup_error:
                    logger.warning(f"Could not delete old file {f}: {cleanup_error}")
            # --------------------------

            # Create a unique filename using timestamp
            unique_filename = f"response_{int(time.time())}.mp3"
            audio_filepath = os.path.join(static_audio_dir, unique_filename)
            
            # Call the synchronous edge-tts generator
            logger.info("Initializing Edge-TTS Audio Generation...")
            generate_audio_sync(ai_reply, audio_filepath)
            
            audio_url = f"/static/audio/{unique_filename}"
            logger.info(f"Audio payload ready at: {audio_url}")
            
        except Exception as audio_error:
            logger.error(f"Audio Generation Failed (Continuing with Text-only): {str(audio_error)}")
        
        # 3. Return the Combined Payload
        return jsonify({
            "success": True,
            "user_question": user_question,
            "ai_response": ai_reply,
            "audio_url": audio_url
        }), 200

    except Exception as e:
        logger.error(f"Fatal runtime failure: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Fatal runtime failure inside the core AI orchestration layer.",
            "details": str(e)
        }), 500