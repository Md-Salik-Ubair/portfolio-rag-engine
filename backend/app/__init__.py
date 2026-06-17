from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    # Strictly configure CORS to allow your Vercel frontend domain
    # Replace 'https://portfolio-salik-live.vercel.app' with your actual production URL
    CORS(app, resources={r"/api/*": {"origins": [
        "https://portfolio-salik-live.vercel.app", 
        "http://localhost:5173" # Keep this for local testing
    ]}}, supports_credentials=True)
    
    app.config['JSON_SORT_KEYS'] = False

    # Blueprints registration
    from app.routes.auth import auth_bp
    from app.routes.portfolio import portfolio_bp
    from app.routes.rag import rag_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
    app.register_blueprint(rag_bp, url_prefix='/api/rag')

    @app.route('/health', methods=['GET'])
    def system_status():
        return {"status": "healthy", "architecture": "Strict Persistent Blueprint Core 2026"}, 200

    return app