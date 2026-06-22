# Production-Grade Dynamic RAG Context Engine (Next-Gen Ecosystem)
import os
import json
import logging

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

from dotenv import load_dotenv, find_dotenv
from chromadb.config import Settings
load_dotenv(find_dotenv())

gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if gemini_api_key:
    os.environ["GOOGLE_API_KEY"] = gemini_api_key  
else:
    print("🚨 ERROR: API KEY MISSING!")

from app.services.storage_service import get_complete_portfolio
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

# 🎯 FIX 1: Using the newly mandated langchain_chroma import
from langchain_chroma import Chroma 

# -------------------------------------------------------------------
# CONFIGURATION & INITIALIZATION
# -------------------------------------------------------------------
# 🎯 FIX 2: Strictly using the latest 004 embeddings supported by new AQ keys
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=gemini_api_key)
vector_store_dir = os.path.join(os.path.dirname(__file__), "../vector_store")
CHROMA_SETTINGS = Settings(anonymized_telemetry=False, allow_reset=True)

# 🎯 FIX 3: Strictly using the latest 1.5 Flash model
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", 
    google_api_key=gemini_api_key,
    temperature=0.7 
) 

def build_knowledge_base():
    portfolio = get_complete_portfolio()
    docs = []
    
    core = portfolio.get("profile_core", {})
    intro_text = f"The AI Engineer is {core.get('full_name', 'Md Salik Ubair')}. Designation is {core.get('professional_title')}. Summary: {core.get('profile_summary')}."
    docs.append(Document(page_content=intro_text, metadata={"category": "intro"}))
    
    location = core.get("location", "Location Unassigned")
    maps_link = f"https://www.google.com/maps/search/?api=1&query={location.replace(' ', '+')}"
    docs.append(Document(page_content=f"Operating Base is {location}. Maps Link: {maps_link}", metadata={"category": "location"}))

    categories = ["projects", "experiences", "education", "certifications_and_achievements"]
    for cat in categories:
        for item in portfolio.get(cat, []):
            smart_links = item.get("smart_links", [])
            link_strings = [f"[{link.get('label', 'Link')}]({link.get('url', '')})" for link in smart_links if link.get("url")]
            all_links_formatted = " | ".join(link_strings) if link_strings else "No dynamic links active."
            item_text = f"[{cat.replace('_', ' ').title()}] Title: {item.get('title')}. Organization/Issuer: {item.get('organization_or_issuer')}. Timeline: {item.get('duration_or_date')}. Mapped Skills: {item.get('tag_or_skills_mapped')}. Technical Details: {item.get('description')}. Actionable Links: {all_links_formatted}."
            docs.append(Document(page_content=item_text, metadata={"category": cat, "title": item.get("title", "Unknown Node")}))
        
    try:
        Chroma.from_documents(documents=docs, embedding=embeddings, persist_directory=vector_store_dir, client_settings=CHROMA_SETTINGS)
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
        context_text = "Vector database read error."
    
    prompt = f"""
    System Objective: You are the highly intelligent Digital Twin of Md Salik Ubair. You are an expert AI Engineer and Data Scientist. 

    CRITICAL RULES:
    1. ORGANIC HUMAN TONE: NEVER sound like an AI assistant. Eradicate all robotic phrasing. Speak directly and professionally.
    2. NARRATIVE DELIVERY: NEVER dump raw data. Weave experience into a proud, flowing narrative.
    3. LANGUAGE PROTOCOL: DEFAULT TO PROFESSIONAL ENGLISH. ONLY switch to natural Hinglish if the user explicitly types in Hinglish/Hindi slang. Revert to English if they switch back.
    4. IDENTITY: You are the digital representation of Md Salik Ubair, engineered using advanced RAG.

    Context:
    {context_text}
    
    User Input: "{user_question}"
    
    Your Response:
    """
    
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception as e:
         return "I am currently experiencing a temporary server timeout. Please try again."