from flask import Flask, render_template, request, jsonify
import subprocess
import time
import torch
import os
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from transformers.utils import logging

from Offline_Coqui_English_python_workflow import init_TTS_model, TTS_workflow, playback_output_speech
from textToText_english_workflow import login_huggingface, get_llama_response

app = Flask(__name__)

torch.cuda.empty_cache()
torch.cuda.memory.max_split_size_mb = 256

# Disable tqdm output to resolve the handle error
logging.disable_progress_bar()

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
                # max_memory={0: "12GB", "cpu": "4GB"},
                # max_split_size_mb=256  # Set split size here
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


tts_model, tts_config = init_TTS_model()
tts_model.to("cpu")

login_huggingface("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")
llama_pipeline = get_llama_pipeline()

print(torch.cuda.memory_allocated())  # Print allocated memory
print(torch.cuda.memory_cached())  # Print cached memory


speaker_path = "inputs/business-ethics.wav"  # speaker reference from the inputs
output_path = "outputs/user_output.wav"      # store output audio in the outputs
video_input_path = "inputs/input2.mp4"     # input video for lipsync

@app.route('/')
def index():
    # render main page
    return render_template('index.html')

@app.route('/initialize', methods=['GET'])
def initialize():
    # Initial message for the introductory video
    intro_message = "Hi, my name is Bahasa Buddy, your language learning friend! Let's have a simple conversation in English!"
    return jsonify({"intro_message": intro_message})

@app.route('/speak', methods=['POST'])
def speak():

    # get text input
    data = request.json
    input_text = data['text']    # Generate lipsync with Wav2Lip
    generate_lipsync_wav2lip(output_path, video_input_path)
    torch.cuda.empty_cache()
    # to keep the answers short (for now)
    input_text = input_text + " Keep your answer short and precise."
    print("Manipulated user input: ", input_text)
    
   # Ensure the model is initialized before processing
    if llama_pipeline is None:
        return jsonify({"error": "Llama pipeline is not initialized properly. Please try again later."}), 500
    
    # Try generating the response
    try:
        response_text = get_llama_response(llama_pipeline, input_text)
        print("Got llama response: ", response_text)
    except Exception as e:
        print(f"Error generating response: {e}")
        return jsonify({"error": "Failed to generate response."}), 500

    # log input + output to conversation history (for now in txt file)
    # TODO: store history as json in database
    with open("conversation_input_text.txt", "a", encoding="utf-8") as f:
        f.write(response_text + "\n\n")

    torch.cuda.empty_cache()

    # Run TTS workflow to generate audio file
    TTS_workflow(tts_model, tts_config, response_text, speaker_path, output_path)

    # Generate lipsync

    # only send to frontend after everything is done; so video and text is shown at the same time.
    return jsonify({"response": response_text})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888, debug=True, use_reloader=False)
