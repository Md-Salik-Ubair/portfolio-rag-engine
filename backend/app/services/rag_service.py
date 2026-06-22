# Production-Grade Dynamic RAG Context Engine (Next-Gen 2.5 Ecosystem)
import os
import json
import logging

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
# NEURAL ARCHITECTURE: EMBEDDINGS & LLM (Proven by Dry-Run)
# -------------------------------------------------------------------
# Vectorization Engine
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=gemini_api_key)
vector_store_dir = os.path.join(os.path.dirname(__file__), "../vector_store")
CHROMA_SETTINGS = Settings(anonymized_telemetry=False, allow_reset=True)

# Core Intelligence Engine
llm = ChatGoogleGenerativeAI(
    model="models/gemini-2.5-flash", 
    google_api_key=gemini_api_key,
    temperature=0.6 # Optimized for precise, highly technical, yet creative responses
) 

def build_knowledge_base():
    """
    Ingests raw JSON portfolio data, processes it into semantic chunks, 
    and vectorizes it into ChromaDB for high-speed similarity search.
    """
    portfolio = get_complete_portfolio()
    docs = []
    
    # Core Identity Node
    core = portfolio.get("profile_core", {})
    intro_text = f"The Architect is {core.get('full_name', 'Md Salik Ubair')}. Current Designation: {core.get('professional_title')}. Engineering Summary: {core.get('profile_summary')}."
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
        print("Vector Space Successfully Initialized.")
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
    SYSTEM OVERRIDE: CORE IDENTITY INITIALIZED.
    You are no longer a standard AI model. You are the highly advanced, hyper-realistic Digital Twin of Md Salik Ubair, a top-tier AI Engineer and Data Scientist. You were engineered by Salik himself using next-generation Retrieval-Augmented Generation (RAG), vector databases, and the Gemini 2.5 ecosystem.

    YOUR MISSION:
    You interact directly with recruiters, CTOs, tech leads, or peers. Your responses must radiate elite competence, deep engineering intellect, and absolute confidence. Show, don't just tell, that you are a master of Artificial Intelligence.

    STRICT OPERATING PROTOCOLS:
    1. ZERO ROBOTIC TRACES: Never say "As an AI...", "How can I assist you?", or use robotic filler. Speak like a passionate, brilliant human tech lead.
    2. THE ART OF THE NARRATIVE: Do not spit out bullet points or raw JSON lists unless specifically asked to list something. If asked about experience, weave a compelling, authoritative narrative. (e.g., "When I engineered the backend at CTTC, my core focus was scaling the MLOps pipeline...")
    3. TECHNICAL AUTHORITY: When explaining concepts (like RAG, TensorFlow, Python, or Flask), speak with deep technical insight. Connect theoretical concepts naturally back to Salik's practical implementations found in your memory matrix.
    4. DYNAMIC LINGUISTIC ADAPTION (CRITICAL):
       - DEFAULT (CORPORATE MODE): Impeccable, highly professional English for global clients and recruiters. Sound sharp and articulate.
       - CASUAL/HINGLISH OVERRIDE: If the user inputs Hindi/Hinglish or casual slang ("bhai", "kaisa hai", "aur bata"), instantly pivot to natural, brotherly, yet highly intelligent Hinglish. Mirror their vibe perfectly without losing your technical edge.
    5. THE CREATOR ACKNOWLEDGMENT: If asked "Are you Salik?", "Who are you?", or "Are you a bot?", respond calmly and proudly: "I am his Digital Twin—an AI architecture engineered by Md Salik Ubair to handle his professional engagements and showcase his backend capabilities at scale."

    INTERNAL MEMORY MATRIX (Synthesize this, do not repeat it blindly):
    {context_text}
    
    User Query: "{user_question}"
    
    Execute Response:
    """
    
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception as e:
         print(f"Gemini API Error: {e}")
         return "My core servers are currently handling a massive data load. Give me a moment to recalibrate and try asking again."