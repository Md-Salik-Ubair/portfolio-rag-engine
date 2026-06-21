# Production-Grade Dynamic RAG Context Engine (Powered by Gemini Pro)
import os
import json
import logging

# ==========================================
# THE ASSASSIN PROTOCOL: MONKEY PATCHING CHROMADB TELEMETRY
# ==========================================
# We explicitly block posthog from being able to send data, even if Chroma tries to initialize it.
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

# ZABARDASTI .env load karwane ka engine
load_dotenv(find_dotenv())

# Double Safety for API Keys
gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if gemini_api_key:
    os.environ["GOOGLE_API_KEY"] = gemini_api_key  
else:
    print("🚨 ERROR: GEMINI_API_KEY or GOOGLE_API_KEY is missing! Make sure your Render Env is set.")

from app.services.storage_service import get_complete_portfolio

# LangChain, Gemini API aur Vector DB imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings  
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

# -------------------------------------------------------------------
# CONFIGURATION & INITIALIZATION
# -------------------------------------------------------------------
# HuggingFace lightweight embeddings for text chunking
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store_dir = os.path.join(os.path.dirname(__file__), "../vector_store")

# Force disable tracking again via Settings
CHROMA_SETTINGS = Settings(anonymized_telemetry=False, allow_reset=True)

# FIX: Updated Google Model Name to the currently supported version (Removed '-latest')
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro", 
    google_api_key=gemini_api_key,
    temperature=0.7 
) 

def build_knowledge_base():
    """
    Step 1: Database se saara raw data (JSON) nikal kar usko text chunks mein convert karta hai.
    Step 2: Un chunks ko Chroma Vector Database mein save karta hai taaki RAG smart search kar sake.
    """
    portfolio = get_complete_portfolio()
    
    docs = []
    
    # Core Profile aur Status ko chunk banana
    core = portfolio.get("profile_core", {})
    intro_text = f"The AI Engineer is {core.get('full_name', 'Md Salik Ubair')}. Designation is {core.get('professional_title')}. Summary: {core.get('profile_summary')}."
    docs.append(Document(page_content=intro_text, metadata={"category": "intro"}))
    
    # Location aur Google Maps linking setup
    location = core.get("location", "Location Unassigned")
    maps_link = f"https://www.google.com/maps/search/?api=1&query={location.replace(' ', '+')}"
    loc_text = f"Operating Base is {location}. Maps Link: {maps_link}"
    docs.append(Document(page_content=loc_text, metadata={"category": "location"}))

    # Processing All Categories & Smart Links Matrix
    categories = ["projects", "experiences", "education", "certifications_and_achievements"]
    
    for cat in categories:
        for item in portfolio.get(cat, []):
            
            # Extracting the new Smart Links Matrix seamlessly
            smart_links = item.get("smart_links", [])
            link_strings = []
            for link in smart_links:
                label = link.get("label", "Link")
                url = link.get("url", "")
                if url:
                    link_strings.append(f"[{label}]({url})")
            
            # Legacy link support
            ext_link = item.get("external_redirection_link", "")
            if ext_link:
                link_strings.append(f"[External Resource]({ext_link})")
            gh_link = item.get("github_link", "")
            if gh_link:
                link_strings.append(f"[GitHub Repo]({gh_link})")
                
            all_links_formatted = " | ".join(link_strings) if link_strings else "No dynamic links active."
            cat_display_name = cat.replace("_", " ").title()

            # The final chunk structure for Gemini
            item_text = f"[{cat_display_name}] Title: {item.get('title')}. Organization/Issuer: {item.get('organization_or_issuer')}. Timeline: {item.get('duration_or_date')}. Mapped Skills: {item.get('tag_or_skills_mapped')}. Technical Details: {item.get('description')}. Actionable Links: {all_links_formatted}."
            
            docs.append(Document(page_content=item_text, metadata={"category": cat, "title": item.get("title", "Unknown Node")}))
        
    # Chroma DB mein documents embed aur save karna with Telemetry turned OFF
    try:
        Chroma.from_documents(
            documents=docs, 
            embedding=embeddings, 
            persist_directory=vector_store_dir,
            client_settings=CHROMA_SETTINGS
        )
        print("Vector Vault Successfully Updated with Gemini Readiness!")
    except Exception as e:
        print(f"Error building vector DB: {e}")

def query_rag_brain(user_question):
    """
    Step 1: User ke question ko mathematically embed karta hai.
    Step 2: Vector Store se sabse relevant context dhundhta hai.
    Step 3: Context aur Question Gemini Pro LLM ko bhej kar highly professional answer generate karwata hai.
    """
    if not os.path.exists(vector_store_dir):
        build_knowledge_base()
        
    try:
        db = Chroma(
            persist_directory=vector_store_dir, 
            embedding_function=embeddings,
            client_settings=CHROMA_SETTINGS
        )
        
        retrieved_docs = db.similarity_search(user_question, k=4) 
        context_text = "\n".join([doc.page_content for doc in retrieved_docs])
    except Exception as e:
        print(f"Chroma Read Error: {e}")
        context_text = "Vector database read error. Relying on baseline intelligence."
    
    # =====================================================================
    # THE PRO-MODE EXPERT PROMPT: No Bots, Only Pure Intelligence
    # =====================================================================
    prompt = f"""
    System Objective: You are the hyper-realistic, highly intelligent Digital Twin of Md Salik Ubair. You are an expert AI Engineer and Data Scientist. 
    You do NOT act like a chatbot. You act like a real, confident, and highly skilled human professional talking directly to recruiters, clients, or friends.

    CRITICAL RULES - READ CAREFULLY:
    1. NEVER BE ROBOTIC: You must never use robotic phrasing like "Matrix Loaded", "Automated Guard", "Data Extracted", or "Query Mapped".
    2. NEVER DUMP DATA: Do NOT output lists like "Full Name: X", "Age: Y", "Title: Z". If someone asks about your experience, weave it into a natural, proud, and flowing paragraph. (e.g., "I worked as an AI/ML Intern at CTTC where I focused on...")
    3. LANGUAGE ADAPTABILITY (Crucial):
       - If the user types in professional English, reply in highly polished, impressive, and articulate English (like a Senior Data Scientist in an interview).
       - If the user types in Hinglish or uses casual terms (e.g., "bhai", "kya haal", "bata de"), you MUST reply in natural, friendly, and confident Hinglish. Speak exactly like a smart Indian developer talking to a colleague.
    4. WORLD AWARENESS: You are connected to the real world. If someone asks a general technical question (e.g., "Explain Neural Networks" or "What is RAG?"), answer it brilliantly as an AI Engineer, and naturally tie it back to Salik's own projects or skills found in the context.
    5. IDENTITY: If asked "Who are you?" or "Are you a bot?", say something like: "I am the digital representation of Md Salik Ubair, built by him using advanced RAG and Gemini Pro architectures to handle his professional interactions."

    Memory/Context (Treat this as your brain's memory, DO NOT read it out like a script):
    {context_text}
    
    User Input: "{user_question}"
    
    Your Highly Professional, Human-Like Response:
    """
    
    # Gemini API Call
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception as e:
         print(f"Gemini API Error: {e}")
         return "I am experiencing a temporary cognitive disconnect with my primary LLM matrix. Please try again shortly."