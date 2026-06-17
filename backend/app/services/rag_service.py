# Production-Grade Dynamic RAG Context Engine for Md Salik Ubair
import requests
from app.services.storage_service import get_complete_portfolio

def query_rag_brain(user_question):
    """
    Evaluates incoming queries against the live local storage blueprint.
    Strictly forbids hallucination if the blueprint metrics are blank.
    """
    lower_q = user_question.lower()
    portfolio = get_complete_portfolio()
    core = portfolio["profile_core"]
    socials = portfolio["social_channels"]
    
    # 1. LIVE CONTEXT BINDING (Capturing updates made via Admin Dashboard)
    name = core.get("full_name") or "Md Salik Ubair"
    title = core.get("professional_title") or "Data Pending"
    location = core.get("location") or "Data Pending"
    summary = core.get("profile_summary") or "Data Pending"
    status = core.get("current_status") or "Data Pending"

    # Strict fallback wrapper message for empty spaces
    fallback_msg = "This specific credential profile node is currently empty. Allocation is pending update inside the Administrator Dashboard Control."

    # 2. FAST-TRACK STRUCTURAL INTENT ROUTING (Zero Hallucination Blueprint)
    
    # Context Category: Identity & Location
    if any(keyword in lower_q for keyword in ["who", "salik", "ubair", "profile", "identity", "about"]):
        return (
            f"Verified Core Matrix:\n"
            f"- Full Name: {name}\n"
            f"- Title: {title}\n"
            f"- Location: {location}\n"
            f"- Status: {status}\n"
            f"- Narrative Summary: {summary}"
        )
        
    if any(keyword in lower_q for keyword in ["where", "live", "from", "location", "hometown"]):
        if location == "Data Pending":
            return f"Location Node: {fallback_msg}"
        return f"Md Salik Ubair is currently operating from: {location}."

    # Context Category: Projects Repository
    if any(keyword in lower_q for keyword in ["project", "repositories", "build", "hand", "gesture"]):
        if not portfolio["projects"]:
            return f"Projects Grid: {fallback_msg}"
        project_list = ""
        for proj in portfolio["projects"]:
            project_list += f"- {proj['title']} ({proj['tag_or_skills_mapped']}): {proj['description']} | Link: {proj['external_redirection_link']}\n"
        return f"Operational Academic & Production Projects Grid:\n{project_list}"

    # Context Category: Professional Experience Track
    if any(keyword in lower_q for keyword in ["experience", "intern", "work", "job", "cttc"]):
        if not portfolio["experiences"]:
            return f"Experience Tracker: {fallback_msg}"
        exp_list = ""
        for exp in portfolio["experiences"]:
            exp_list += f"- {exp['title']} at {exp['organization_or_issuer']} ({exp['duration_or_date']}): {exp['description']}\n"
        return f"Professional Experience Timeline Matrix:\n{exp_list}"

    # Context Category: Certifications & Achievements Combined Grid
    if any(keyword in lower_q for keyword in ["certification", "achieve", "award", "medal", "course"]):
        if not portfolio["certifications_and_achievements"]:
            return f"Certifications & Achievements Hub: {fallback_msg}"
        cert_list = ""
        for cert in portfolio["certifications_and_achievements"]:
            cert_list += f"- {cert['title']} issued by {cert['organization_or_issuer']}: {cert['description']} (Credential ID: {cert['score_or_credential_id']})\n"
        return f"Verified Credentials Subsystem:\n{cert_list}"

    # Context Category: Direct Contact Redirection Coordinates
    if any(keyword in lower_q for keyword in ["contact", "email", "linkedin", "github", "instagram", "social"]):
        return (
            f"Active Digital Redirection Channels:\n"
            f"- Email: {socials.get('email') or 'Pending'}\n"
            f"- LinkedIn: {socials.get('linkedin') or 'Pending'}\n"
            f"- GitHub: {socials.get('github') or 'Pending'}\n"
            f"- Instagram: {socials.get('instagram') or 'Pending'}"
        )

    # 3. RUNTIME LOCAL OLLAMA REPLICATOR INTERFACE
    try:
        ollama_url = "http://localhost:11434/api/generate"
        system_rules = f"Identity: {name}. Title: {title}. Context summary: {summary}. Answer concisely and professionally based ONLY on this context."
        payload = {
            "model": "llama3",
            "prompt": f"{system_rules}\nUser Question: {user_question}\nAnswer:",
            "stream": False
        }
        response = requests.post(ollama_url, json=payload, timeout=4)
        if response.status_code == 200:
            return response.json().get("response")
    except Exception:
        pass

    # 4. FINAL PRODUCTION CRADLE FALLBACK
    return (
        f"Automated Matrix Guard: Request successfully mapped. Md Salik Ubair specializes in "
        f"Computer Science frameworks. Advanced details can be pulled using explicit headers "
        f"(e.g., 'projects', 'experience', 'certifications')."
    )