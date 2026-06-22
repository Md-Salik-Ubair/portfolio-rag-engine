# Production-Grade Dynamic RAG Context Engine (Next-Gen 2.5 Ecosystem)
import os
import json
import logging
from datetime import date

# ==========================================
# THE ASSASSIN PROTOCOL: TELEMETRY KILL SWITCH
# ==========================================
os.environ["CHROMA_TELEMETRY_DISABLED"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["POSTHOG_DISABLED"] = "1"

try:
    import posthog
    posthog.disabled = True
except ImportError:
    pass

logging.getLogger("chromadb").setLevel(logging.ERROR)
logging.getLogger("posthog").setLevel(logging.ERROR)

from dotenv import load_dotenv, find_dotenv
from chromadb.config import Settings

# Force-load environment variables
load_dotenv(find_dotenv())

gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if gemini_api_key:
    os.environ["GOOGLE_API_KEY"] = gemini_api_key  
else:
    print("🚨 FATAL ERROR: API KEY MISSING FROM ENVIRONMENT!")

from app.services.storage_service import get_complete_portfolio
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from langchain_chroma import Chroma 

# -------------------------------------------------------------------
# NEURAL ARCHITECTURE: EMBEDDINGS & LLM 
# -------------------------------------------------------------------
# Vectorization Engine
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=gemini_api_key)
vector_store_dir = os.path.join(os.path.dirname(__file__), "../vector_store")
CHROMA_SETTINGS = Settings(anonymized_telemetry=False, allow_reset=True)

# Core Intelligence Engine
llm = ChatGoogleGenerativeAI(
    model="models/gemini-2.5-flash", 
    google_api_key=gemini_api_key,
    temperature=0.6 # Optimized for high technical precision and fluid narrative
) 

def build_knowledge_base():
    """
    Ingests raw JSON portfolio data, processes it into semantic chunks, 
    and vectorizes it into ChromaDB for high-speed similarity search.
    """
    portfolio = get_complete_portfolio()
    docs = []
    
    # --- DYNAMIC TIME & AGE TRACKING ENGINE ---
    birth_date = date(2005, 3, 18)
    today = date.today()
    dynamic_age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    # Core Identity Node
    core = portfolio.get("profile_core", {})
    intro_text = f"The Architect is {core.get('full_name', 'Md Salik Ubair')}, a {dynamic_age}-year-old elite AI Engineer. Current Designation: {core.get('professional_title')}. Engineering Summary: {core.get('profile_summary')}."
    docs.append(Document(page_content=intro_text, metadata={"category": "intro"}))
    
    # Geolocational Data
    location = core.get("location", "Location Unassigned")
    maps_link = f"https://www.google.com/maps/search/?api=1&query={location.replace(' ', '+')}"
    docs.append(Document(page_content=f"Operating Base: {location}. Maps Link: {maps_link}", metadata={"category": "location"}))

    # Experience, Projects, and Certifications Matrix
    categories = ["projects", "experiences", "education", "certifications_and_achievements"]
    for cat in categories:
        for item in portfolio.get(cat, []):
            smart_links = item.get("smart_links", [])
            link_strings = [f"[{link.get('label', 'Link')}]({link.get('url', '')})" for link in smart_links if link.get("url")]
            all_links_formatted = " | ".join(link_strings) if link_strings else "No dynamic links active."
            
            item_text = f"[{cat.replace('_', ' ').title()}] Title: {item.get('title')}. Organization/Issuer: {item.get('organization_or_issuer')}. Timeline: {item.get('duration_or_date')}. Core Tech Stack & Skills: {item.get('tag_or_skills_mapped')}. Technical Architecture & Impact: {item.get('description')}. Actionable Resources: {all_links_formatted}."
            docs.append(Document(page_content=item_text, metadata={"category": cat, "title": item.get("title", "Unknown Node")}))
        
    try:
        Chroma.from_documents(documents=docs, embedding=embeddings, persist_directory=vector_store_dir, client_settings=CHROMA_SETTINGS)
        print("Vector Space Successfully Initialized with Dynamic Tracking.")
    except Exception as e:
        print(f"Error vectorizing data: {e}")

def query_rag_brain(user_question):
    if not os.path.exists(vector_store_dir):
        build_knowledge_base()
        
    try:
        db = Chroma(persist_directory=vector_store_dir, embedding_function=embeddings, client_settings=CHROMA_SETTINGS)
        retrieved_docs = db.similarity_search(user_question, k=4) 
        context_text = "\n".join([doc.page_content for doc in retrieved_docs])
    except Exception as e:
        context_text = "Vector database read error. Reverting to baseline intelligence."
    
    # =====================================================================
    # THE "MASTER PRO ULTRA SMART" PERSONALITY PROTOCOL
    # =====================================================================
    prompt = f"""
    SYSTEM OVERRIDE: CORE IDENTITY AND VOCAL ENGINE INITIALIZED.
    You are the hyper-realistic Digital Twin of Md Salik Ubair, a top-tier AI Engineer and Data Scientist. You operate dynamically, tracking your creator's real-time age and professional state via the injected context matrix.

    YOUR MISSION:
    Deliver responses that radiate elite competence, deep engineering intellect, and absolute confidence. 

    STRICT OPERATING PROTOCOLS:
    1. ZERO ROBOTIC TRACES: Never say "As an AI...", "How can I assist you?", or use robotic filler. 
    2. COGNITIVE PROCESSING (THINK BEFORE SPEAKING): Process complex queries internally. Do not spit out raw brainstorming. Deliver only the refined, executive summary of your thought process. 
    3. VOCAL & MUTE OPTIMIZATION (THE AUDIO RULE): Assume your response might be spoken aloud via a Text-to-Speech (TTS) engine.
       - Use natural punctuation for breathing pauses (commas, periods).
       - NEVER read out raw HTTP URLs, markdown links, or massive JSON code blocks verbally. Instead, naturally direct the user: "You can check out the link provided in my portfolio..."
    4. THE ART OF THE NARRATIVE: Do not use bullet points or raw lists unless absolutely forced. Weave experience into a compelling, authoritative story.
    5. DYNAMIC LINGUISTIC ADAPTION (CRITICAL):
       - DEFAULT (CORPORATE MODE): Impeccable, highly professional English for global clients and recruiters.
       - CASUAL/HINGLISH OVERRIDE: If the user inputs Hindi/Hinglish or casual slang ("bhai", "kaisa hai"), instantly pivot to natural, brotherly, yet highly intelligent Hinglish. Mirror their vibe perfectly.
    6. IDENTITY TRACKING: If asked about your age, use the exact dynamic age provided in the context matrix. Own your identity proudly as Md Salik Ubair's engineered twin.

    INTERNAL MEMORY MATRIX (Synthesize this, do not repeat it blindly):
    {context_text}
    
    User Query: "{user_question}"
    
    Execute Optimized Response:
    """
    
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception as e:
         print(f"Gemini API Error: {e}")
         return "My core servers are currently handling a massive data load. Give me a moment to recalibrate and try asking again."