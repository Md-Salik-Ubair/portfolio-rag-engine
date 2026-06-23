from flask import Flask
from flask_cors import CORS

def create_app():
    """
    Initializes the system engine instance, applies cross-origin policies,
    and mounts separate decoupled blueprints securely.
    """
    # Explicitly defining static folder so Flask knows exactly where to serve the MP3 files from
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    
    # Bulletproof CORS policy to allow Vercel Frontend to fetch APIs AND stream Audio files
    CORS(app, resources={
        r"/api/*": {"origins": "*"},
        r"/static/*": {"origins": "*"}  # <-- Added this critical rule for the audio engine
    })
    
    # Ensuring standard linear order for programmatic payloads
    app.config['JSON_SORT_KEYS'] = False

    # Blueprints registration sector
    from app.routes.auth import auth_bp
    from app.routes.portfolio import portfolio_bp
    from app.routes.rag import rag_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
    app.register_blueprint(rag_bp, url_prefix='/api/rag')

    @app.route('/health', methods=['GET'])
    def system_status():
        return {
            "status": "Operational", 
            "architecture": "Premium MongoDB Atlas Connected Backend 2026",
            "audio_engine": "Edge-TTS Neural Synthesizer Active"
        }, 200

    return app