import os
from app import create_app

app = create_app()

# ==========================================
# PRE-FLIGHT SYSTEM CHECKS
# ==========================================
# Ensure the static audio directory exists before the first request hits
audio_dir = os.path.join(app.root_path, 'static', 'audio')
os.makedirs(audio_dir, exist_ok=True)

if __name__ == '__main__':
    print("=======================================================")
    print("🚀 Starting Premium RAG + Edge-TTS Backend Server")
    print(f"🔊 Audio Engine Directory verified at: {audio_dir}")
    print("🔗 Live on http://127.0.0.1:5000")
    print("=======================================================")
    app.run(debug=True, port=5000)