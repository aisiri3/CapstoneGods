"""
Main application entry point.
This file initializes the Flask application and registers all blueprints.
"""
from flask import Flask
from flask_restful import Api

from config import Config
from extensions import mysql

# Import blueprints -- to provide structure for backend
from api import api_bp

def create_app(config_class=Config):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    mysql.init_app(app)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    print("app.py: Registered API blueprints!")
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8888, debug=True, use_reloader=False)