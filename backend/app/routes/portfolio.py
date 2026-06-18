# Production Portfolio Data Routers linked with MongoDB Core
from flask import Blueprint, jsonify, request
from app.services.storage_service import update_family_meta
from app.services.storage_service import (
    get_complete_portfolio, 
    insert_dynamic_item, 
    remove_dynamic_item, 
    update_profile_core,
    update_social_channels
)

portfolio_bp = Blueprint('portfolio', __name__)

@portfolio_bp.route('/data', methods=['GET'])
def fetch_portfolio_state():
    """Serves the complete master state network from MongoDB to the frontend components."""
    return jsonify(get_complete_portfolio()), 200

@portfolio_bp.route('/update-core', methods=['POST'])
def edit_profile_core_headers():
    """Updates the core identity block (Full Name, Title, Location, Summary, Status, Phone, WhatsApp)."""
    try:
        data = request.get_json() or {}
        updated_core = update_profile_core(data)
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
    Valid targets: experiences, projects, education, certifications_and_achievements
    """
    try:
        valid_grids = ["experiences", "projects", "education", "certifications_and_achievements"]
        if category not in valid_grids:
            return jsonify({"success": False, "error": "Requested category module does not exist."}), 400
            
        data = request.get_json() or {}
        
        # Checking minimum dynamic requirements
        check_title = data.get("title") or data.get("degree")
        if not check_title:
            return jsonify({"success": False, "error": "Structural entry requires a Title or Degree field."}), 400
            
        inserted_node = insert_dynamic_item(category, data)
        return jsonify({
            "success": True,
            "message": f"New asset node successfully committed to {category}.",
            "inserted": inserted_node
        }), 201
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
        return jsonify({
            "success": True,
            "message": "Family background matrix updated successfully.",
            "data": updated_meta
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500    