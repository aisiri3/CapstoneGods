from flask import Flask, request, jsonify
from flask_restful import Api, Resource
import torch
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from transformers.utils import logging
from Coqui_English_python_workflow import init_TTS_model, TTS_workflow, playback_output_speech

app = Flask(__name__)
api = Api(app)

# Disable tqdm output to resolve the handle error
logging.disable_progress_bar()

# Initialize TTS model
tts_model = init_TTS_model()
speaker_path = "inputs/business-ethics.wav"  # Speaker reference
output_path = "outputs/user_output.wav"      # Output audio path

# Llama pipeline initialization
llama_pipeline = None

def get_llama_pipeline():
    global llama_pipeline
    if llama_pipeline is None:
        try:
            print("Initializing Llama pipeline...")
            model = AutoModelForCausalLM.from_pretrained(
                "meta-llama/Llama-2-7b-chat-hf",
                torch_dtype=torch.float16,
                device_map="auto",
            )
            # model.to("cuda")

            tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-chat-hf")
            llama_pipeline = pipeline(
                task="text-generation",
                model=model,
                tokenizer=tokenizer
            )
            print("Llama pipeline initialized!")
        except Exception as e:
            print(f"Error during Llama pipeline initialization: {e}")
            import traceback
            traceback.print_exc()  # Print detailed stack trace
            raise
    return llama_pipeline

# Initialize Llama pipeline
llama_pipeline = get_llama_pipeline()

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

            # Ensure the model is initialized before processing
            if llama_pipeline is None:
                return {"error": "Llama pipeline is not initialized properly. Please try again later."}, 500

            # Generate response using Llama pipeline
            prompt = input_text + " Keep your answer short and precise."
            full_response = llama_pipeline(prompt)[0]['generated_text']
            print(f"Full response: {full_response}")

            # Extract only the generated text (exclude the input prompt)
            response_text = full_response[len(prompt):].strip()
            print(f"Generated response_text: {response_text}")
            

            # Log conversation
            # TODO: CHANGE THIS TO A DATABASE
            with open("conversation_input_text.txt", "a", encoding="utf-8") as f:
                f.write(response_text + "\n")

            # Run TTS model
            TTS_workflow(tts_model, response_text, speaker_path, output_path)

            return {"response": response_text}, 200

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