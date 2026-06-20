import time
from pymongo import MongoClient

# ==========================================
# MONGODB CLOUD DATABASE CONNECTION
# ==========================================
MONGO_URI = "mongodb+srv://mdsalikubair_db_user:qpuEyEGtyP47GuQW@cluster0.dqkp05g.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["salik_portfolio"]
collection = db["master_data"]

# Initial Professional Schema with Smart Links & Dynamic DP Support
DEFAULT_STATE = {
    "_id": "global_state",
    "profile_core": {
        "full_name": "", 
        "professional_title": "", 
        "location": "",
        "profile_summary": "", 
        "current_status": "",
        "phone_number": "",      
        "whatsapp_link": "",
        "skills_list": "",
        "languages_known": "",
        "display_picture_url": ""   # NEW: Dynamic Display Picture (DP) for Frontend
    },
    "social_channels": {
        "email": "", 
        "linkedin": "", 
        "github": "", 
        "instagram": ""
    },
    "education": [],
    "experiences": [],
    "projects": [],
    "certifications_and_achievements": [],
    "family_meta": {"summary": ""}
}

def _get_document():
    """Fetches the master document from MongoDB, creates it if missing."""
    doc = collection.find_one({"_id": "global_state"})
    if not doc:
        collection.insert_one(DEFAULT_STATE)
        return DEFAULT_STATE
    return doc

def get_complete_portfolio():
    """Returns the absolute master state network to the frontend router."""
    doc = _get_document()
    doc.pop('_id', None) # Remove MongoDB specific ID for clean JSON
    return doc

def update_profile_core(payload):
    """Refines top-level core details including Phone, WhatsApp, and DP URL."""
    doc = _get_document()
    core = doc.get("profile_core", {})
    
    # Added display_picture_url to the updatable fields
    fields_to_update = [
        "full_name", "professional_title", "location", "profile_summary", 
        "current_status", "phone_number", "whatsapp_link", "skills_list", 
        "languages_known", "display_picture_url"
    ]
    
    for key in fields_to_update:
        if key in payload:
            core[key] = payload[key]
            
    collection.update_one({"_id": "global_state"}, {"$set": {"profile_core": core}})
    return core

def update_social_channels(payload):
    """Directly maps and secures external anchor links."""
    doc = _get_document()
    socials = doc.get("social_channels", {})
    
    for key in ["email", "linkedin", "github", "instagram"]:
        if key in payload:
            socials[key] = payload[key]
            
    collection.update_one({"_id": "global_state"}, {"$set": {"social_channels": socials}})
    return socials

def update_family_meta(payload):
    """Secures and updates the family background matrix."""
    doc = _get_document()
    meta = doc.get("family_meta", {})
    
    if "summary" in payload:
        meta["summary"] = payload["summary"]
        
    collection.update_one({"_id": "global_state"}, {"$set": {"family_meta": meta}})
    return meta

def insert_dynamic_item(category, payload):
    """Appends full-length dictionary nodes to structural arrays in MongoDB."""
    valid_categories = ["experiences", "projects", "education", "certifications_and_achievements"]
    if category not in valid_categories:
        return None
        
    item_structure = {
        "id": int(time.time()),
        "title": payload.get("title") or payload.get("degree"),
        "organization_or_issuer": payload.get("organization_or_issuer") or payload.get("institution"),
        "duration_or_date": payload.get("duration_or_date"),
        "description": payload.get("description", ""),
        "score_or_credential_id": payload.get("score_or_credential_id", ""), 
        "tag_or_skills_mapped": payload.get("tag_or_skills_mapped", ""),       
        "image_urls": payload.get("image_urls", []) if isinstance(payload.get("image_urls"), list) else ([payload.get("image_url")] if payload.get("image_url") else []),        
        
        # UPGRADED: Smart Links Matrix (Array of {label, url})
        "smart_links": payload.get("smart_links", []),
        
        # Legacy support
        "external_redirection_link": payload.get("external_redirection_link", ""),
        "github_link": payload.get("github_link", "") 
    }
    
    collection.update_one(
        {"_id": "global_state"},
        {"$push": {category: item_structure}}
    )
    return item_structure

def update_dynamic_item(category, item_id, payload):
    """
    NEW FUNCTION: Edits an existing node inside a category array without changing its ID.
    Supports injecting multiple image URLs, Smart Links, and updating text parameters dynamically.
    """
    valid_categories = ["experiences", "projects", "education", "certifications_and_achievements"]
    if category not in valid_categories:
        return None

    doc = _get_document()
    items_array = doc.get(category, [])
    
    updated_item = None
    for item in items_array:
        if item.get("id") == int(item_id):
            # Update incoming keys dynamically (excluding the protected ID)
            for key, value in payload.items():
                if key != "id":
                    item[key] = value
            
            # Format image structures securely
            if "image_urls" in payload and isinstance(payload["image_urls"], list):
                item["image_urls"] = payload["image_urls"]
            elif "image_url" in payload and payload["image_url"]:
                item["image_urls"] = [payload["image_url"]]
            
            # Format smart links securely
            if "smart_links" in payload and isinstance(payload["smart_links"], list):
                item["smart_links"] = payload["smart_links"]
                
            updated_item = item
            break
            
    if updated_item:
        collection.update_one(
            {"_id": "global_state"},
            {"$set": {category: items_array}}
        )
        
    return updated_item

def remove_dynamic_item(category, item_id):
    """Targets and purges a clean data node via its unique execution stamp."""
    valid_categories = ["experiences", "projects", "education", "certifications_and_achievements"]
    if category not in valid_categories:
        return False
        
    result = collection.update_one(
        {"_id": "global_state"},
        {"$pull": {category: {"id": int(item_id)}}}
    )
    return result.modified_count > 0