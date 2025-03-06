"""
Chat routes.
"""
from flask import request, current_app
from flask_restful import Resource

from config import Config
from api.chat.services import process_speech, play_audio

class Speak(Resource):
    def post(self):
        # Ensure request is JSON
        if not request.is_json:
            return {"error": "Invalid JSON request"}, 400

        try:
            data = request.get_json()
            if not data or "text" not in data:
                return {"error": "Missing 'text' field"}, 400

            input_text = data["text"]
                
            # Process the speech -- put through llama and TTS
            response_text = process_speech(input_text)
            
            return {"response": response_text}, 200

        except Exception as e:
            return {"error": str(e)}, 500

class PlayAudio(Resource):
    def post(self):
        try:
            # Play the generated audio file
            play_audio()
            return {"status": "audio_played"}, 200
        except Exception as e:
            return {"error": str(e)}, 500

def register_routes(api):
    """Register the chat routes with the API."""
    api.add_resource(Speak, '/speak')
    api.add_resource(PlayAudio, '/play_audio')