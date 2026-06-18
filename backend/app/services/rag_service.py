# Production-Grade Dynamic RAG Context Engine for Md Salik Ubair
import requests
from app.services.storage_service import get_complete_portfolio

def query_rag_brain(user_question):
    """
    Evaluates incoming queries and returns structured Markdown responses.
    Strictly uses professional corporate terminology and avoids hallucinations.
    """
    lower_q = user_question.lower()
    portfolio = get_complete_portfolio()
    core = portfolio.get("profile_core", {})
    socials = portfolio.get("social_channels", {})
    
    # 1. LIVE CONTEXT BINDING
    name = core.get("full_name") or "Md Salik Ubair"
    title = core.get("professional_title") or "[Designation Unassigned]"
    location = core.get("location") or "[Location Unassigned]"
    summary = core.get("profile_summary") or "[Summary Unassigned]"
    status = core.get("current_status") or "[Status Unassigned]"
    phone = core.get("phone_number") or "[Phone Unassigned]"
    whatsapp = core.get("whatsapp_link") or "[WhatsApp Unassigned]"

    fallback_msg = "*This credential node is pending update in the Administrator Control Hub.*"

    # 2. FAST-TRACK STRUCTURAL INTENT ROUTING (MARKDOWN FORMATTED)
    
    # Context Category: Identity & Location
    if any(keyword in lower_q for keyword in ["who", "salik", "ubair", "profile", "identity", "about"]):
        return (
            f"### **Core Identity Matrix**\n\n"
            f"**Full Name:** {name}\n\n"
            f"**Designation:** {title}\n\n"
            f"**Base Location:** {location}\n\n"
            f"**Current Status:** {status}\n\n"
            f"**Executive Summary:** {summary}"
        )
        
    if any(keyword in lower_q for keyword in ["where", "live", "from", "location", "hometown"]):
        if location == "[Location Unassigned]":
            return f"**Location Node:** {fallback_msg}"
        return f"**Operating Base:** Md Salik Ubair is currently operating from **{location}**."

    # Context Category: Projects Repository
    if any(keyword in lower_q for keyword in ["project", "repositories", "build", "hand", "gesture"]):
        if not portfolio.get("projects"):
            return f"**Engineering & Development Portfolio:** {fallback_msg}"
        project_list = "### **Engineering Portfolio**\n\n"
        for proj in portfolio["projects"]:
            project_list += f"- **{proj['title']}** ({proj['tag_or_skills_mapped']})\n  {proj['description']}\n  [Verification Link]({proj['external_redirection_link']})\n\n"
        return project_list

    # Context Category: Professional Experience Track
    if any(keyword in lower_q for keyword in ["experience", "intern", "work", "job", "cttc", "sdi"]):
        if not portfolio.get("experiences"):
            return f"**Professional Timeline:** {fallback_msg}"
        exp_list = "### **Professional Experience Timeline**\n\n"
        for exp in portfolio["experiences"]:
            exp_list += f"- **{exp['title']}** at **{exp['organization_or_issuer']}** ({exp['duration_or_date']})\n  {exp['description']}\n\n"
        return exp_list

    # Context Category: Certifications & Achievements
    if any(keyword in lower_q for keyword in ["certification", "achieve", "award", "medal", "course"]):
        if not portfolio.get("certifications_and_achievements"):
            return f"**Verified Credentials Subsystem:** {fallback_msg}"
        cert_list = "### **Verified Credentials & Achievements**\n\n"
        for cert in portfolio["certifications_and_achievements"]:
            cert_list += f"- **{cert['title']}** (Issued by {cert['organization_or_issuer']})\n  Credential ID: `{cert['score_or_credential_id']}`\n  {cert['description']}\n\n"
        return cert_list

    # Context Category: Direct Contact (UPDATED WITH PHONE & WA)
    if any(keyword in lower_q for keyword in ["contact", "email", "linkedin", "github", "instagram", "social", "phone", "whatsapp", "call"]):
        return (
            f"### **Active Communication Channels**\n\n"
            f"- 📧 **Email:** {socials.get('email') or 'Pending'}\n"
            f"- 📞 **Phone:** {phone}\n"
            f"- 💬 **WhatsApp:** {whatsapp}\n"
            f"- 💼 **LinkedIn:** {socials.get('linkedin') or 'Pending'}\n"
            f"- 💻 **GitHub:** {socials.get('github') or 'Pending'}\n"
            f"- 📸 **Instagram:** {socials.get('instagram') or 'Pending'}"
        )

    # 3. FINAL PRODUCTION CRADLE FALLBACK
    return (
        "**Automated Matrix Guard:** Query mapped successfully. Md Salik Ubair specializes in "
        "Computer Science and Data Intelligence frameworks. You can ask specifically about his **Projects**, **Experience**, **Skills**, or **Contact** details."
    )