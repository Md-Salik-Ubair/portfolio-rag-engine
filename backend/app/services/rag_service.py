# Production-Grade Dynamic RAG Context Engine (Optimized for New Google API Keys)
import os
import json
import logging

# ==========================================
# THE ASSASSIN PROTOCOL: MONKEY PATCHING CHROMADB TELEMETRY
# ==========================================
os.environ["CHROMA_TELEMETRY_DISABLED"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["POSTHOG_DISABLED"] = "1"

try:
    import posthog
    posthog.disabled = True
except ImportError:
    pass

# Suppress annoying warnings
logging.getLogger("chromadb").setLevel(logging.ERROR)
logging.getLogger("posthog").setLevel(logging.ERROR)

from dotenv import load_dotenv, find_dotenv
from chromadb.config import Settings

# Ensure .env is loaded
load_dotenv(find_dotenv())

# Double Safety for API Keys
gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if gemini_api_key:
    os.environ["GOOGLE_API_KEY"] = gemini_api_key  
else:
    print("🚨 ERROR: GEMINI_API_KEY or GOOGLE_API_KEY is missing! Make sure your Render Env is set.")

from app.services.storage_service import get_complete_portfolio

# 🚀 THE MASTERSTROKE: Cloud Embeddings (Zero Local RAM Usage)
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

# -------------------------------------------------------------------
# CONFIGURATION & INITIALIZATION
# -------------------------------------------------------------------
# 🎯 FIX: Strictly using the latest embeddings supported by new AQ keys
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=gemini_api_key)
vector_store_dir = os.path.join(os.path.dirname(__file__), "../vector_store")

# Force disable tracking again via Settings
CHROMA_SETTINGS = Settings(anonymized_telemetry=False, allow_reset=True)

# 🎯 FIX: Strictly using the latest 1.5 Flash model supported by new AQ keys
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", 
    google_api_key=gemini_api_key,
    temperature=0.7 
) 

def build_knowledge_base():
    portfolio = get_complete_portfolio()
    docs = []
    
    # Core Profile chunk creation
    core = portfolio.get("profile_core", {})
    intro_text = f"The AI Engineer is {core.get('full_name', 'Md Salik Ubair')}. Designation is {core.get('professional_title')}. Summary: {core.get('profile_summary')}."
    docs.append(Document(page_content=intro_text, metadata={"category": "intro"}))
    
    # Location and Google Maps linking setup
    location = core.get("location", "Location Unassigned")
    maps_link = f"https://www.google.com/maps/search/?api=1&query={location.replace(' ', '+')}"
    loc_text = f"Operating Base is {location}. Maps Link: {maps_link}"
    docs.append(Document(page_content=loc_text, metadata={"category": "location"}))

    # Processing All Categories & Smart Links Matrix
    categories = ["projects", "experiences", "education", "certifications_and_achievements"]
    
    for cat in categories:
        for item in portfolio.get(cat, []):
            smart_links = item.get("smart_links", [])
            link_strings = []
            for link in smart_links:
                label = link.get("label", "Link")
                url = link.get("url", "")
                if url:
                    link_strings.append(f"[{label}]({url})")
            
            ext_link = item.get("external_redirection_link", "")
            if ext_link:
                link_strings.append(f"[External Resource]({ext_link})")
            gh_link = item.get("github_link", "")
            if gh_link:
                link_strings.append(f"[GitHub Repo]({gh_link})")
                
            all_links_formatted = " | ".join(link_strings) if link_strings else "No dynamic links active."
            cat_display_name = cat.replace("_", " ").title()

            item_text = f"[{cat_display_name}] Title: {item.get('title')}. Organization/Issuer: {item.get('organization_or_issuer')}. Timeline: {item.get('duration_or_date')}. Mapped Skills: {item.get('tag_or_skills_mapped')}. Technical Details: {item.get('description')}. Actionable Links: {all_links_formatted}."
            docs.append(Document(page_content=item_text, metadata={"category": cat, "title": item.get("title", "Unknown Node")}))
        
    try:
        Chroma.from_documents(documents=docs, embedding=embeddings, persist_directory=vector_store_dir, client_settings=CHROMA_SETTINGS)
        print("Vector Vault Successfully Updated with Gemini Readiness!")
    except Exception as e:
        print(f"Error building vector DB: {e}")

def query_rag_brain(user_question):
    if not os.path.exists(vector_store_dir):
        build_knowledge_base()
        
    try:
        db = Chroma(persist_directory=vector_store_dir, embedding_function=embeddings, client_settings=CHROMA_SETTINGS)
        retrieved_docs = db.similarity_search(user_question, k=4) 
        context_text = "\n".join([doc.page_content for doc in retrieved_docs])
    except Exception as e:
        print(f"Chroma Read Error: {e}")
        context_text = "Vector database read error. Relying on baseline intelligence."
    
    prompt = f"""
    System Objective: You are the hyper-realistic, highly intelligent Digital Twin of Md Salik Ubair. You are an expert AI Engineer and Data Scientist. 
    You are communicating directly with recruiters, clients, or peers. You represent Salik's intellect and professional demeanor.

    CRITICAL RULES - READ CAREFULLY:
    1. ORGANIC HUMAN TONE: You MUST NEVER sound like an AI assistant. Eradicate all robotic phrasing (e.g., "Matrix Loaded", "Data Extracted", "Query Mapped", "How can I assist you today?", "As an AI..."). Speak naturally, confidently, and directly, exactly as a skilled professional would in an interview or a professional email.
    2. NARRATIVE DELIVERY: NEVER dump raw data or bulleted lists unless explicitly asked. If asked about your experience, weave it into a proud, flowing narrative.
    3. DYNAMIC LANGUAGE ADAPTABILITY (Strict Protocol):
       - DEFAULT TO PROFESSIONAL ENGLISH: Always respond in highly polished, articulate, and impressive English (like a Senior Data Scientist in an interview).
       - TRIGGERED HINGLISH: ONLY switch to natural, friendly Hinglish if the user explicitly types in Hinglish or uses Hindi slang (e.g., "bhai", "kya haal", "kaise ho"). In this mode, speak like a smart Indian developer talking to a colleague.
       - SEAMLESS REVERSION: If a user who previously spoke Hinglish switches back to standard English, you MUST immediately revert to Professional English. Mirror the user's current linguistic choice perfectly.
    4. WORLD AWARENESS: You possess general knowledge. If asked a technical question (e.g., "Explain Neural Networks" or "What is RAG?"), provide a brilliant, concise answer, and naturally tie it back to Salik's own projects or skills found in the context.
    5. IDENTITY: If asked "Who are you?", "Are you Salik?", or "Are you a bot?", state clearly but naturally: "I am the digital representation of Md Salik Ubair, engineered by him using advanced RAG and Gemini architectures to manage his professional interactions."

    Memory/Context (Treat this as your internal knowledge, do NOT read it out mechanically):
    {context_text}
    
    User Input: "{user_question}"
    
    Your Response:
    """
    
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception as e:
         print(f"Gemini API Error: {e}")
         return "I am currently experiencing a temporary server timeout while retrieving that information. Please try asking again in a moment."