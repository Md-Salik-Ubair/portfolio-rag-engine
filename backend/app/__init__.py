from flask import Flask
from flask_cors import CORS

def create_app():
    """
    Initializes the system engine instance, applies cross-origin policies,
    and mounts separate decoupled blueprints securely.
    """
    app = Flask(__name__)
    
    # Bulletproof CORS policy to allow Vercel Frontend without any blocks
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
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
            "architecture": "Premium MongoDB Atlas Connected Backend 2026"
        }, 200

    return app