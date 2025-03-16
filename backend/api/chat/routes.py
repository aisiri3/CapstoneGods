"""
Chat routes.
"""
from flask import request, current_app, send_file
from flask_restful import Resource
import os

from config import Config
from api.chat.services import process_speech, play_audio, encode_audio_to_base64, save_avatar_selections

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
            
            # Get avatar configuration if provided
            avatar_config = data.get("avatarConfig", None)
                
            # Process the speech -- put through llama, TTS, and lipsync
            result = process_speech(input_text, avatar_config)
            
            # Encode the audio file to base64 for transmission
            encoded_audio = encode_audio_to_base64(result["audio_path"])
            
            # Return all the data needed by the frontend
            return {
                "response": result["response_text"],
                "audio": encoded_audio,
                "mouthCues": result["mouth_cues"]
            }, 200

        except Exception as e:
            return {"error": str(e)}, 500

class AvatarSelections(Resource):
    def post(self):
        """Handle avatar selection updates from the frontend."""
        # Ensure request is JSON
        if not request.is_json:
            return {"error": "Invalid JSON request"}, 400

        try:
            data = request.get_json()
            if not data or "gender" not in data or "persona" not in data or "language" not in data:
                return {"error": "Missing required selection fields"}, 400

            # Save the selections
            result = save_avatar_selections(data)
            
            return {"message": "Avatar selections saved successfully", "data": result}, 200

        except Exception as e:
            return {"error": str(e)}, 500

class GetAudioFile(Resource):
    def get(self):
        try:
            # Get the audio file path from configuration
            output_path = current_app.config.get('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
            
            # Check if file exists
            if not os.path.exists(output_path):
                return {"error": "Audio file not found"}, 404
                
            # Return the audio file
            return send_file(output_path, mimetype="audio/wav")
        except Exception as e:
            return {"error": str(e)}, 500

# This route is kept for backward compatibility but is now deprecated
class PlayAudio(Resource):
    def post(self):
        try:
            # Play the generated audio file on the backend (deprecated)
            play_audio()
            return {"status": "audio_played"}, 200
        except Exception as e:
            return {"error": str(e)}, 500

def register_routes(api):
    """Register the chat routes with the API."""
    api.add_resource(Speak, '/speak')
    api.add_resource(GetAudioFile, '/get_audio')
    api.add_resource(PlayAudio, '/play_audio')  # Kept for backward compatibility
    api.add_resource(AvatarSelections, '/selections')  # New endpoint for avatar selections