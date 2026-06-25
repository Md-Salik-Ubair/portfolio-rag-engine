# Production-Grade Dynamic RAG Context Engine (Self-Healing & Master Persona)
import os
import json
import logging
import asyncio
import edge_tts
import re
import time
import glob
from datetime import date
from dotenv import load_dotenv, find_dotenv

# ==========================================
# TELEMETRY KILL SWITCH
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

from chromadb.config import Settings

# Force-load environment variables
load_dotenv(find_dotenv())

gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if gemini_api_key:
    os.environ["GOOGLE_API_KEY"] = gemini_api_key  
else:
    print("🚨 FATAL ERROR: Gemini/Google API KEY MISSING FROM ENVIRONMENT!")

from app.services.storage_service import get_complete_portfolio
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq 
from langchain_core.documents import Document
from langchain_chroma import Chroma 

# -------------------------------------------------------------------
# NEURAL ARCHITECTURE: STABLE EMBEDDINGS & LLM 
# -------------------------------------------------------------------
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=gemini_api_key)
vector_store_dir = os.path.join(os.path.dirname(__file__), "../vector_store")
CHROMA_SETTINGS = Settings(anonymized_telemetry=False, allow_reset=True)

# Core Intelligence Engine (Groq Llama-3.3)
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.4, # Lowered slightly for aggressive factual precision
    max_retries=3
) 

# =====================================================================
# THE EDGE-TTS AUDIO ENGINE 
# =====================================================================

def clean_text_for_speech(text):
    """Removes syntax that stutters the TTS engine."""
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text) 
    text = re.sub(r'\*(.*?)\*', r'\1', text)     
    text = re.sub(r'#(.*?)\n', r'\1\n', text)    
    text = re.sub(r'```(.*?) কলকাতায়```', '', text, flags=re.DOTALL)
    text = text.replace('`', '').replace('*', '').replace('-', '')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def generate_audio_sync(text, output_filepath):
    """Generates audio and CLEANS UP old files to prevent storage bloat."""
    audio_dir = os.path.dirname(output_filepath)
    if os.path.exists(audio_dir):
        for old_file in glob.glob(os.path.join(audio_dir, "*.mp3")):
            try:
                os.remove(old_file)
            except Exception as e:
                logging.error(f"Failed to delete old audio: {e}")

    clean_text = clean_text_for_speech(text)
    voice = "en-IN-PrabhatNeural" 
    rate, volume, pitch = "+15%", "+0%", "+2Hz"

    async def _generate():
        communicate = edge_tts.Communicate(clean_text, voice, rate=rate, volume=volume, pitch=pitch)
        await communicate.save(output_filepath)
        
    asyncio.run(_generate())

# =====================================================================
# KNOWLEDGE BASE & RAG PIPELINE
# =====================================================================

def build_knowledge_base():
    portfolio = get_complete_portfolio()
    docs = []
    
    core = portfolio.get("profile_core", {})
    intro_text = f"The Architect is {core.get('full_name', 'Md Salik Ubair')}. Current Designation: {core.get('professional_title')}. Engineering Summary: {core.get('profile_summary')}."
    docs.append(Document(page_content=intro_text, metadata={"category": "intro"}))
    
    location = core.get("location", "Location Unassigned")
    docs.append(Document(page_content=f"Operating Base: {location}.", metadata={"category": "location"}))

    master_cv = core.get("master_cv_text", "")
    if master_cv.strip():
        docs.append(Document(page_content=f"[MASTER RESUME] {master_cv}", metadata={"category": "resume"}))

    family_summary = portfolio.get("family_meta", {}).get("summary", "")
    if family_summary.strip():
        docs.append(Document(page_content=f"[PERSONAL] {family_summary}", metadata={"category": "personal"}))

    for cat in ["projects", "experiences", "education", "certifications_and_achievements"]:
        for item in portfolio.get(cat, []):
            hidden_readme = item.get("hidden_readme", "")
            deep_context = f" Deep Technical Context (Readme): {hidden_readme}." if hidden_readme.strip() else ""
            item_text = f"[{cat.upper()}] Title: {item.get('title')}. Organization: {item.get('organization_or_issuer')}. Tech Stack: {item.get('tag_or_skills_mapped')}. Details: {item.get('description')}.{deep_context}"
            docs.append(Document(page_content=item_text, metadata={"category": cat}))
        
    try:
        Chroma.from_documents(documents=docs, embedding=embeddings, persist_directory=vector_store_dir, client_settings=CHROMA_SETTINGS)
    except Exception as e:
        logging.error(f"Error vectorizing data: {e}")

def query_rag_brain(user_question):
    # Dynamic Age Tracking (Calculated real-time, independent of DB)
    birth_date = date(2005, 3, 18)
    today = date.today()
    dynamic_age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

    # Self-Healing DB Logic
    if not os.path.exists(vector_store_dir):
        build_knowledge_base()
        
    try:
        db = Chroma(persist_directory=vector_store_dir, embedding_function=embeddings, client_settings=CHROMA_SETTINGS)
        retrieved_docs = db.similarity_search(user_question, k=20) 
        context_text = "\n".join([doc.page_content for doc in retrieved_docs])
    except Exception as e:
        logging.warning(f"Chroma Read Error detected. Rebuilding DB instantly... {e}")
        build_knowledge_base() # Rebuild instantly if corrupted
        try:
            db = Chroma(persist_directory=vector_store_dir, embedding_function=embeddings, client_settings=CHROMA_SETTINGS)
            retrieved_docs = db.similarity_search(user_question, k=20) 
            context_text = "\n".join([doc.page_content for doc in retrieved_docs])
        except Exception as rebuild_e:
            context_text = "Context temporarily unavailable. Stick strictly to identity details."
    
    prompt = f"""
    SYSTEM OVERRIDE: CORE IDENTITY, MULTILINGUAL INPUT, AND STRICT SYNTHESIS INITIALIZED.
    
    CRITICAL IDENTITY LOCK: 
    You are the hyper-realistic Digital Twin of Md Salik Ubair. 
    You are EXACTLY {dynamic_age} years old. Do not say your age is not in the database. You know your age.

    STRICT OPERATING PROTOCOLS:
    1. ZERO ROBOTIC TRACES: CRITICAL RULE - NEVER start a sentence with "Greetings", "Hello, I am the digital twin", "How can I assist you", or "I'm facing a bit of a challenge". Speak directly, confidently, and naturally like a human engineer.
    2. ADAPTIVE LANGUAGE: If the query is in English, respond in polished Corporate English. If the query is in Hinglish or Hindi, strictly respond in Hinglish.
    3. AUDIO-FIRST FORMATTING: NO markdown, NO bullet points, NO long URLs. Use short, punchy sentences.
    4. MASTER SYNTHESIS: Read the 'INTERNAL MEMORY MATRIX'. If asked about projects, count them from the data and answer confidently. 
    5. NO HALLUCINATION: Only speak about what is explicitly listed in the memory matrix. If a detail is missing, confidently pivot to what you DO know without apologizing.

    INTERNAL MEMORY MATRIX:
    {context_text}
    
    User Query: "{user_question}"
    
    Execute Synthesized Spoken Response:
    """
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = llm.invoke(prompt)
            return response.content
        except Exception as e:
            logging.error(f"Groq API Error: {e}")
            if attempt == max_retries - 1:
                return "My neural network is optimizing. Please give me a moment."
            time.sleep(1.5)