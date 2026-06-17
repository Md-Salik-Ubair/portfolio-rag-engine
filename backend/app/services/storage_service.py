import json
import os
import time

# Define the persistent storage path
STORAGE_FILE = "portfolio_data.json"

# Initialize file if it doesn't exist
def initialize_storage():
    if not os.path.exists(STORAGE_FILE):
        default_data = {
            "profile_core": {"full_name": "", "professional_title": "", "location": "", "profile_summary": "", "current_status": ""},
            "social_channels": {"email": "", "linkedin": "", "github": "", "instagram": ""},
            "education": [],
            "experiences": [],
            "projects": [],
            "certifications_and_achievements": [],
            "family_meta": {"summary": ""}
        }
        with open(STORAGE_FILE, "w") as f:
            json.dump(default_data, f)

initialize_storage()

def load_data():
    with open(STORAGE_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(STORAGE_FILE, "w") as f:
        json.dump(data, f, indent=4)

def get_complete_portfolio():
    return load_data()

def update_profile_core(payload):
    data = load_data()
    core = data["profile_core"]
    for key in ["full_name", "professional_title", "location", "profile_summary", "current_status"]:
        if key in payload:
            core[key] = payload[key]
    save_data(data)
    return core

def update_social_channels(payload):
    data = load_data()
    socials = data["social_channels"]
    for key in ["email", "linkedin", "github", "instagram"]:
        if key in payload:
            socials[key] = payload[key]
    save_data(data)
    return socials

def insert_dynamic_item(category, payload):
    data = load_data()
    if category not in data:
        return None
    
    item_structure = {
        "id": int(time.time()),
        "title": payload.get("title") or payload.get("degree"),
        "organization_or_issuer": payload.get("organization_or_issuer") or payload.get("institution"),
        "duration_or_date": payload.get("duration_or_date"),
        "description": payload.get("description", ""),
        "tag_or_skills_mapped": payload.get("tag_or_skills_mapped", ""),
        "external_redirection_link": payload.get("external_redirection_link", None)
    }
    
    data[category].append(item_structure)
    save_data(data)
    return item_structure

def remove_dynamic_item(category, item_id):
    data = load_data()
    if category not in data:
        return False
    initial_count = len(data[category])
    data[category] = [item for item in data[category] if item["id"] != int(item_id)]
    save_data(data)
    return len(data[category]) < initial_count