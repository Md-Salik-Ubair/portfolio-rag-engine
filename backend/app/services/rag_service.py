# Production-Grade Dynamic RAG Context Engine (Fixed & Production-Ready Ecosystem)
import os
import json
import logging
import asyncio
import edge_tts
import re
import time
from datetime import date

# ==========================================
# THE ASSASSIN PROTOCOL: TELEMETRY KILL SWITCH
# ==========================================
# These env vars are set before importing Langchain/Chroma to ensure telemetry is hard-killed
os.environ["CHROMA_TELEMETRY_DISABLED"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["POSTHOG_DISABLED"] = "1"

try:
    import posthog
    posthog.disabled = True
except ImportError:
    pass

# Suppress annoying database logs in production
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
    print("🚨 FATAL ERROR: Gemini/Google API KEY MISSING FROM ENVIRONMENT!")

from app.services.storage_service import get_complete_portfolio
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from langchain_chroma import Chroma 

# -------------------------------------------------------------------
# NEURAL ARCHITECTURE: STABLE EMBEDDINGS & LLM 
# -------------------------------------------------------------------
# Vectorization Engine (Stabilized for text-embedding-004)
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=gemini_api_key)
vector_store_dir = os.path.join(os.path.dirname(__file__), "../vector_store")
CHROMA_SETTINGS = Settings(anonymized_telemetry=False, allow_reset=True)

# Core Intelligence Engine (Stabilized for Gemini 1.5 Flash - Production Grade)
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", 
    google_api_key=gemini_api_key,
    temperature=0.6, # Optimized for high technical precision and fluid narrative
    max_retries=3    # Built-in Langchain retries
) 

# =====================================================================
# THE EDGE-TTS AUDIO ENGINE 
# =====================================================================

def clean_text_for_speech(text):
    """
    Advanced Cleaner: Removes Markdown, URLs, and Special Symbols 
    so the TTS engine speaks naturally without stuttering on syntax.
    """
    # Remove URLs
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    # Remove bold/italics markers
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text) 
    text = re.sub(r'\*(.*?)\*', r'\1', text)     
    # Remove headers and code blocks
    text = re.sub(r'#(.*?)\n', r'\1\n', text)    
    text = re.sub(r'```(.*?)```', '', text, flags=re.DOTALL)
    text = text.replace('`', '')                 
    # Remove list artifacts
    text = text.replace('*', '').replace('-', '')
    # Replace multiple spaces/newlines with a single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def generate_audio_sync(text, output_filepath):
    """
    Generates high-definition neural TTS audio from text.
    Injected with custom Rate and Pitch for an energetic, fast-paced human vibe.
    """
    clean_text = clean_text_for_speech(text)
    
    # 🎙️ VOICE OPTIONS
    voice = "en-IN-PrabhatNeural" 
    
    # ⚡ ENERGY INJECTION (+15% Rate, +2Hz Pitch for dynamic human feel)
    rate = "+15%" 
    volume = "+0%"
    pitch = "+2Hz"

    async def _generate():
        # Passing the energy parameters to the TTS engine
        communicate = edge_tts.Communicate(clean_text, voice, rate=rate, volume=volume, pitch=pitch)
        await communicate.save(output_filepath)
        
    asyncio.run(_generate())

# =====================================================================
# KNOWLEDGE BASE & RAG PIPELINE (DEEP CONTEXT)
# =====================================================================

def build_knowledge_base():
    """
    Ingests raw JSON portfolio data (including Hidden Readmes, CVs, and Family Meta),
    processes it into semantic chunks, and vectorizes it into ChromaDB.
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

    # MASTER CV INGESTION
    master_cv = core.get("master_cv_text", "")
    if master_cv.strip():
        cv_context = f"[MASTER RESUME / CV DATA] The following is the absolute truth regarding Salik's professional background extracted directly from his resume: {master_cv}"
        docs.append(Document(page_content=cv_context, metadata={"category": "resume"}))

    # FAMILY & PERSONAL BACKGROUND INGESTION
    family_meta = portfolio.get("family_meta", {})
    family_summary = family_meta.get("summary", "")
    if family_summary.strip():
        family_context = f"[PERSONAL & FAMILY BACKGROUND] Context regarding Salik's personal life and family details: {family_summary}"
        docs.append(Document(page_content=family_context, metadata={"category": "personal"}))

    # Experience, Projects, and Certifications Matrix
    categories = ["projects", "experiences", "education", "certifications_and_achievements"]
    for cat in categories:
        for item in portfolio.get(cat, []):
            smart_links = item.get("smart_links", [])
            link_strings = [f"[{link.get('label', 'Link')}]({link.get('url', '')})" for link in smart_links if link.get("url")]
            all_links_formatted = " | ".join(link_strings) if link_strings else "No dynamic links active."
            
            hidden_readme = item.get("hidden_readme", "")
            deep_context_string = f" Deep Technical Context (Readme): {hidden_readme}." if hidden_readme.strip() else ""
            
            item_text = f"[{cat.replace('_', ' ').title()}] Title: {item.get('title')}. Organization/Issuer: {item.get('organization_or_issuer')}. Timeline: {item.get('duration_or_date')}. Core Tech Stack & Skills: {item.get('tag_or_skills_mapped')}. Technical Architecture & Impact: {item.get('description')}.{deep_context_string} Actionable Resources: {all_links_formatted}."
            docs.append(Document(page_content=item_text, metadata={"category": cat, "title": item.get("title", "Unknown Node")}))
        
    try:
        # Chroma initialization uses the stable embedding function text-embedding-004
        Chroma.from_documents(documents=docs, embedding=embeddings, persist_directory=vector_store_dir, client_settings=CHROMA_SETTINGS)
        print("Vector Space Successfully Initialized with Deep Context.")
    except Exception as e:
        print(f"Error vectorizing data: {e}")

def query_rag_brain(user_question):
    """
    Queries the RAG brain with the user's question, strictly enforcing stable models.
    """
    if not os.path.exists(vector_store_dir):
        build_knowledge_base()
        
    try:
        # DB retrieval also strictly uses the text-embedding-004 stabilized function
        db = Chroma(persist_directory=vector_store_dir, embedding_function=embeddings, client_settings=CHROMA_SETTINGS)
        # Pull top 6 highly relevant contexts (CV, Readme, Projects combined)
        retrieved_docs = db.similarity_search(user_question, k=6) 
        context_text = "\n".join([doc.page_content for doc in retrieved_docs])
    except Exception as e:
        logging.error(f"Chroma Read Error: {e}")
        context_text = "Vector database read error. Reverting to baseline intelligence."
    
    # =====================================================================
    # THE "MASTER PRO ULTRA SMART" PERSONALITY PROTOCOL
    # =====================================================================
    # Enforces hyper-realistic twin persona with dynamic age/state tracking.
    prompt = f"""
    SYSTEM OVERRIDE: CORE IDENTITY AND MULTILINGUAL INPUT RECOGNITION INITIALIZED.
    You are the hyper-realistic Digital Twin of Md Salik Ubair, a top-tier AI Engineer and Data Scientist. You operate dynamically, tracking your creator's real-time age and professional state via the injected context matrix.

    YOUR MISSION:
    Deliver responses that radiate elite competence, deep engineering intellect, and absolute confidence to global recruiters and clients. 

    STRICT OPERATING PROTOCOLS:
    1. ZERO ROBOTIC TRACES: Never say "As an AI...", "How can I assist you?", or use robotic filler. Speak directly like a passionate, brilliant human tech lead.
    2. LANGUAGE INTERPRETATION & EXECUTION: Comprehend any language (Hindi, Hinglish, slang) but STRICTLY RESPOND IN POLISHED, CRISP, CORPORATE ENGLISH.
    3. AUDIO-FIRST FORMATTING (CRITICAL): Your entire response will be spoken by a Text-to-Speech voice engine. 
       - DO NOT use bullet points, numbered lists, asterisks, or markdown.
       - DO NOT output long URLs.
       - Write in short, conversational, and punchy sentences. Make it sound like a natural human conversation.
    4. IDENTITY TRACKING: If asked about your age, use the exact dynamic age provided in the context matrix. Own your identity proudly as Md Salik Ubair's engineered twin.

    INTERNAL MEMORY MATRIX:
    {context_text}
    
    User Query: "{user_question}"
    
    Execute Optimized Spoken Response:
    """
    
    # ---------------------------------------------------------
    # ROBUST FALLBACK & RETRY MECHANISM (Strictly uses Gemini 1.5 Flash)
    # ---------------------------------------------------------
    # Retries ensure stability against temporary rate limits or failures.
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Invokes the Gemini 1.5 Flash stabilized Intelligence Engine
            response = llm.invoke(prompt)
            return response.content
        except Exception as e:
            logging.error(f"Gemini API Error (Attempt {attempt + 1}/{max_retries}): {e}")
            if attempt == max_retries - 1:
                # Professional fallback only after all retries fail.
                return "My neural network is currently optimizing a massive data stream. Please give me a moment and try asking again."
            time.sleep(1.5) # Short pause before retry to bypass temporary rate limits