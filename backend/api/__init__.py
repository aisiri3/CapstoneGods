"""
API Blueprint module.
This module initializes the Flask Blueprint for the API.
"""
from flask import Blueprint
from flask_restful import Api

# Create the API blueprint
api_bp = Blueprint('api', __name__)
api = Api(api_bp)

# Import routes from modules (under the api folder)
from api.auth.routes import register_routes as register_auth_routes
from api.chat.routes import register_routes as register_chat_routes
from api.evaluation.routes import register_routes as register_eval_routes
from api.persona.routes import register_routes as register_persona_routes

# Register routes with the API
register_auth_routes(api)
register_chat_routes(api)
register_eval_routes(api)
register_persona_routes(api)