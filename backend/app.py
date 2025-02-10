from flask import Flask, request, jsonify
# TODO: switch to restx / cors / a better & secure alternative
from flask_restful import Api, Resource
import subprocess
from Coqui_English_python_workflow import init_TTS_model, TTS_workflow, playback_output_speech

app = Flask(__name__)
api = Api(app)

tts_model = init_TTS_model()
speaker_path = "inputs/business-ethics.wav"  # Speaker reference
output_path = "outputs/user_output.wav"      # Output audio path

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
            print(f"Received input_text: {input_text}")

            # Log conversation
            # TODO: CHANGE THIS TO A DATABASE
            with open("conversation_input_text.txt", "a", encoding="utf-8") as f:
                f.write(input_text + "\n")

            # Run TTS model
            TTS_workflow(tts_model, input_text, speaker_path, output_path)

            return {"response": input_text}, 200

        except Exception as e:
            print(f"Exception: {e}")
            return {"error": str(e)}, 500

class PlayAudio(Resource):
    def post(self):
        # Play the generated audio file
        playback_output_speech(output_path)
        return {"status": "audio_played"}, 200

# Register resources with Flask-RESTful
api.add_resource(Speak, "/api/speak")
api.add_resource(PlayAudio, "/api/play_audio")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888, debug=True, use_reloader=False)

