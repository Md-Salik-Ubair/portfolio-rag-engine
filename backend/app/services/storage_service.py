import time

# ==========================================
# MASTER BLANK BLUEPRINT MATRIX (ZERO FAKE DATA)
# ==========================================
# This structure is strictly clinical, containing absolutely no preset fake details.
# Every entry space adapts flawlessly when fed directly via the Admin Dashboard.

portfolio_store = {
    "profile_core": {
        "full_name": "",
        "professional_title": "",
        "location": "",         # Direct empty space for your real city/state
        "profile_summary": "",  # Blank canvas for your self-written summary
        "current_status": ""    # Academic/professional status tracker
    },
    "social_channels": {
        "email": "",
        "linkedin": "",
        "github": "",
        "instagram": ""         # Added space as requested for clean redirection
    },
    "education": [],            # To be populated via Admin Dashboard with score/institution
    "experiences": [],          # To be populated with internships (CTTC, etc.)
    "projects": [],             # Target zone for your Hand Gesture Engine, etc.
    "certifications_and_achievements": [], # Combined top-tier verification block
    "family_meta": {
        "summary": "",          # Blank entry for the personal family timeline anchor
        "timeline_updates": []
    }
}

def get_complete_portfolio():
    """Returns the absolute master state network to the frontend router."""
    return portfolio_store

def update_profile_core(payload):
    """Refines top-level core details. Skips parameters that are missing or empty."""
    core = portfolio_store["profile_core"]
    if "full_name" in payload: core["full_name"] = payload["full_name"]
    if "professional_title" in payload: core["professional_title"] = payload["professional_title"]
    if "location" in payload: core["location"] = payload["location"]
    if "profile_summary" in payload: core["profile_summary"] = payload["profile_summary"]
    if "current_status" in payload: core["current_status"] = payload["current_status"]
    return core

def update_social_channels(payload):
    """Directly maps and secures external anchor links."""
    socials = portfolio_store["social_channels"]
    if "email" in payload: socials["email"] = payload["email"]
    if "linkedin" in payload: socials["linkedin"] = payload["linkedin"]
    if "github" in payload: socials["github"] = payload["github"]
    if "instagram" in payload: socials["instagram"] = payload["instagram"]
    return socials

def insert_dynamic_item(category, payload):
    """
    Appends full-length dictionary nodes to structural arrays.
    Universal controller layout supporting optional images and redirection links.
    """
    valid_categories = ["experiences", "projects", "education", "certifications_and_achievements"]
    if category not in valid_categories:
        return None
        
    # Standard engineering payload blueprint
    item_structure = {
        "id": int(time.time()),
        "title": payload.get("title") or payload.get("degree"),
        "organization_or_issuer": payload.get("organization_or_issuer") or payload.get("institution"),
        "duration_or_date": payload.get("duration_or_date"),
        "description": payload.get("description", ""),
        "score_or_credential_id": payload.get("score_or_credential_id", ""), 
        "tag_or_skills_mapped": payload.get("tag_or_skills_mapped", ""),       
        "image_url": payload.get("image_url", None),        # Direct base64/cloud url storage node
        "external_redirection_link": payload.get("external_redirection_link", None) # Safe external asset links
    }
    
    portfolio_store[category].append(item_structure)
    return item_structure

def remove_dynamic_item(category, item_id):
    """Targets and purges a clean data node via its unique execution stamp."""
    valid_categories = ["experiences", "projects", "education", "certifications_and_achievements"]
    if category not in valid_categories:
        return False
    initial_count = len(portfolio_store[category])
    portfolio_store[category] = [item for item in portfolio_store[category] if item["id"] != int(item_id)]
    return len(portfolio_store[category]) < initial_count