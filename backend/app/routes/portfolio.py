# Production Portfolio Data Routers linked with MongoDB Core
import threading
from flask import Blueprint, jsonify, request

from app.services.storage_service import (
    get_complete_portfolio, 
    insert_dynamic_item, 
    remove_dynamic_item, 
    update_dynamic_item, 
    update_profile_core,
    update_social_channels,
    update_family_meta
)

from app.services.rag_service import build_knowledge_base

portfolio_bp = Blueprint('portfolio', __name__)

def trigger_vector_sync():
    """Background process to silently update the AI Vector Store without slowing down the Admin Hub."""
    threading.Thread(target=build_knowledge_base).start()

@portfolio_bp.route('/data', methods=['GET'])
def fetch_portfolio_state():
    """Serves the complete master state network from MongoDB to the frontend components."""
    return jsonify(get_complete_portfolio()), 200

@portfolio_bp.route('/update-core', methods=['POST'])
def edit_profile_core_headers():
    """Updates the core identity block (Full Name, Title, DP URL, and Master CV URL for RAG)."""
    try:
        data = request.get_json() or {}
        # Note: If CV text extraction is needed here, we can add a PyMuPDF text extractor helper later.
        # For now, it accepts master_cv_url and master_cv_text directly from frontend payload.
        updated_core = update_profile_core(data)
        trigger_vector_sync() # AI Update
        return jsonify({
            "success": True,
            "message": "Core profile metrics updated successfully in database.",
            "data": updated_core
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@portfolio_bp.route('/update-socials', methods=['POST'])
def edit_social_channels():
    """Updates clean redirect links for Email, LinkedIn, GitHub, and Instagram."""
    try:
        data = request.get_json() or {}
        updated_socials = update_social_channels(data)
        trigger_vector_sync() # AI Update
        return jsonify({
            "success": True,
            "message": "External anchor links verified and updated.",
            "data": updated_socials
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@portfolio_bp.route('/item/<category>', methods=['POST'])
def create_portfolio_node(category):
    """
    Appends full length nodes dynamically to MongoDB arrays.
    Now accepts 'hidden_readme' from the frontend for Deep RAG Context.
    Valid targets: experiences, projects, education, certifications_and_achievements
    """
    try:
        valid_grids = ["experiences", "projects", "education", "certifications_and_achievements"]
        if category not in valid_grids:
            return jsonify({"success": False, "error": "Requested category module does not exist."}), 400
            
        data = request.get_json() or {}
        
        check_title = data.get("title") or data.get("degree")
        if not check_title:
            return jsonify({"success": False, "error": "Structural entry requires a Title or Degree field."}), 400
            
        inserted_node = insert_dynamic_item(category, data)
        trigger_vector_sync() # AI Update
        return jsonify({
            "success": True,
            "message": f"New asset node successfully committed to {category}.",
            "inserted": inserted_node
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==========================================
# THE EDIT/UPDATE ROUTE FOR ADMIN HUB
# ==========================================
@portfolio_bp.route('/item/<category>/<int:item_id>', methods=['PUT'])
def edit_portfolio_node(category, item_id):
    """Updates an existing asset node safely (Includes Multi-Image, Smart Links & Hidden Readme Support)."""
    try:
        valid_grids = ["experiences", "projects", "education", "certifications_and_achievements"]
        if category not in valid_grids:
            return jsonify({"success": False, "error": "Invalid engine grid category target."}), 400
            
        data = request.get_json() or {}
        updated_node = update_dynamic_item(category, item_id, data)
        
        if not updated_node:
            return jsonify({"success": False, "error": "Target node not found or update failed."}), 404
            
        trigger_vector_sync() # AI Update
        return jsonify({
            "success": True,
            "message": f"Item {item_id} successfully updated in the {category} cluster.",
            "updated_data": updated_node
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@portfolio_bp.route('/item/<category>/<int:item_id>', methods=['DELETE'])
def remove_portfolio_node(category, item_id):
    """Removes any asset node safely by searching its unique generation identifier in MongoDB."""
    try:
        valid_grids = ["experiences", "projects", "education", "certifications_and_achievements"]
        if category not in valid_grids:
            return jsonify({"success": False, "error": "Invalid engine grid category target."}), 400
            
        is_cleared = remove_dynamic_item(category, item_id)
        if not is_cleared:
            return jsonify({"success": False, "error": "Target node not found or mismatch."}), 404
            
        trigger_vector_sync() # AI Update
        return jsonify({
            "success": True,
            "message": f"Item {item_id} successfully purged from the {category} cluster."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@portfolio_bp.route('/update-family', methods=['POST'])
def edit_family_matrix():
    """Updates the family background section."""
    try:
        data = request.get_json() or {}
        updated_meta = update_family_meta(data)
        trigger_vector_sync() # AI Update
        return jsonify({
            "success": True,
            "message": "Family background matrix updated successfully.",
            "data": updated_meta
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500