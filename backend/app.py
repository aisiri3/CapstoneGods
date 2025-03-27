"""
Main application entry point.
This file initializes the Flask application and registers all blueprints.
"""
from flask import Flask
from flask_restful import Api

from config import Config
from extensions import mysql
import sys
import traceback

def force_excepthook(exctype, value, tb):
    print("\nUncaught Exception:", "".join(traceback.format_exception(exctype, value, tb)))

sys.excepthook = force_excepthook

# Import blueprints -- to provide structure for backend
from api import api_bp
def create_app(config_class=Config):
    """Create and configure the Flask application."""
    print("Step 1: Creating Flask app instance...")
    app = Flask(__name__)

    print("Step 2: Loading config...")
    try:
        app.config.from_object(config_class)
        print("Config loaded successfully!")
    except Exception as e:
        print("Error loading config:")
        import traceback
        print(traceback.format_exc())
        return None  # Exit early if config is broken

    # Initialize extensions
    print("Step 3: Initializing MySQL...")
    try:
        mysql.init_app(app)
        print("MySQL initialized successfully!")
    except Exception as e:
        print("Error initializing MySQL:")
        import traceback
        print(traceback.format_exc())
        return None

    # Register blueprints
    print("Step 4: Registering blueprints...")
    try:
        app.register_blueprint(api_bp, url_prefix='/api')
        print("Blueprints registered successfully!")
    except Exception as e:
        print("Error registering blueprints:")
        import traceback
        print(traceback.format_exc())
        return None

    print("Flask app creation successful!")
    return app

if __name__ == "__main__":
    app = create_app()
    try:
        app.run(host="0.0.0.0", port=8888, debug=True, use_reloader=False)
    except Exception as e:
        import traceback
        print("Application failed to start with error:")
        print(traceback.format_exc())