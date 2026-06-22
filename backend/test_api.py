import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load the API key from your .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("🚨 API Key not found! Check your .env file.")
    exit()

genai.configure(api_key=api_key)

print("\n🔍 FETCHING ALLOWED MODELS FROM GOOGLE SERVER...")
print("-" * 50)

try:
    models = list(genai.list_models())
    
    print("\n✅ TEXT MODELS (For LLM):")
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f" -> {m.name}")
            
    print("\n✅ EMBEDDING MODELS (For Vector DB):")
    for m in models:
        if 'embedContent' in m.supported_generation_methods:
            print(f" -> {m.name}")
            
    print("\n" + "-" * 50)
    print("Test Complete.")
    
except Exception as e:
    print(f"❌ API CRASHED: {e}")