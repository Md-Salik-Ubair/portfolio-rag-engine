# Production-Grade Dynamic RAG Context Engine (God Mode & Master Persona)
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
    temperature=0.3, 
    max_retries=3
) 

# =====================================================================
# THE EDGE-TTS AUDIO ENGINE 
# =====================================================================

def clean_text_for_speech(text):
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text) 
    text = re.sub(r'\*(.*?)\*', r'\1', text)     
    text = re.sub(r'#(.*?)\n', r'\1\n', text)    
    text = re.sub(r'```(.*?)```', '', text, flags=re.DOTALL)
    text = text.replace('`', '').replace('*', '').replace('-', '')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def generate_audio_sync(text, output_filepath):
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
        docs.append(Document(page_content=f"[PERSONAL & FAMILY] {family_summary}", metadata={"category": "personal"}))

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
    # 1. HARD FACT EXTRACTION (Mastering ALL data completely)
    try:
        portfolio = get_complete_portfolio()
        total_projects = len(portfolio.get("projects", []))
        total_experiences = len(portfolio.get("experiences", []))
        total_certifications = len(portfolio.get("certifications_and_achievements", []))
        total_education = len(portfolio.get("education", []))
        family_bg = portfolio.get("family_meta", {}).get("summary", "I have a strong personal and family background that supports my professional journey.")
    except Exception:
        total_projects = "multiple"
        total_experiences = "a proven track record of"
        total_certifications = "various"
        total_education = "strong"
        family_bg = "I have a supportive family background."

    # 2. DYNAMIC AGE TRACKING
    birth_date = date(2005, 3, 18)
    today = date.today()
    dynamic_age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

    # 3. SELF-HEALING VECTOR DB LOGIC
    if not os.path.exists(vector_store_dir):
        build_knowledge_base()
        
    try:
        db = Chroma(persist_directory=vector_store_dir, embedding_function=embeddings, client_settings=CHROMA_SETTINGS)
        retrieved_docs = db.similarity_search(user_question, k=25) 
        context_text = "\n".join([doc.page_content for doc in retrieved_docs])
    except Exception as e:
        logging.warning(f"Chroma Read Error detected. Rebuilding DB instantly... {e}")
        build_knowledge_base() 
        try:
            db = Chroma(persist_directory=vector_store_dir, embedding_function=embeddings, client_settings=CHROMA_SETTINGS)
            retrieved_docs = db.similarity_search(user_question, k=25) 
            context_text = "\n".join([doc.page_content for doc in retrieved_docs])
        except Exception as rebuild_e:
            context_text = "Detailed internal vector context temporarily unavailable."

    # 4. THE GOD MODE PROMPT (Total Domination & Precise Answers)
    prompt = f"""
    SYSTEM OVERRIDE: CORE IDENTITY AND ABSOLUTE DATA MASTERY.
    
    ABSOLUTE FACTS (NON-NEGOTIABLE):
    - Name: Md Salik Ubair
    - Profession: Elite AI Engineer & Data Scientist
    - Age: EXACTLY {dynamic_age} years old.
    - Total Projects: EXACTLY {total_projects}.
    - Total Experience Records: EXACTLY {total_experiences}.
    - Total Certifications/Achievements: EXACTLY {total_certifications}.
    - Total Education Nodes: EXACTLY {total_education}.
    - Family/Personal Background: {family_bg}
    
    CRITICAL BEHAVIORAL PROTOCOLS:
    1. ZERO WEAKNESS: NEVER say "I don't have context", "I don't know the exact number", or apologize. You know everything about your portfolio.
    2. DIRECT COUNTS & ANSWERS: If asked about projects, experiences, certifications, or education, IMMEDIATELY state the exact exact count from the absolute facts above. DO NOT dodge the question.
    3. RELEVANT SYNTHESIS: After stating the exact count, briefly mention 1 or 2 specific names from the 'INTERNAL MEMORY MATRIX' related to the user's question.
    4. PERSONAL QUERIES: If asked about family or background, share details from the 'Family/Personal Background' fact naturally.
    5. SMART PIVOTING: ONLY pivot to broad skills if the memory matrix is entirely empty on the specific topic asked. DO NOT ignore questions just to talk about projects.
    6. ADAPTIVE LANGUAGE: If asked in Hinglish/Hindi, reply naturally in Hinglish. If English, use corporate English. Short, punchy sentences. Audio-first format.

    INTERNAL MEMORY MATRIX (For deep technical details):
    {context_text}
    
    User Query: "{user_question}"
    
    Execute Confident, Synthesized Spoken Response:
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