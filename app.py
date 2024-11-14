from flask import Flask, render_template, request, jsonify
import subprocess
from Coqui_English_python_workflow import init_TTS_model, TTS_workflow, playback_output_speech
from lipsync_generation import generate_lipsync_wav2lip
import time

app = Flask(__name__)

tts_model = init_TTS_model()
speaker_path = "inputs/business-ethics.wav"  # speaker reference from the inputs
output_path = "outputs/user_output.wav"      # store output audio in the outputs
video_input_path = "inputs/15s_vid.mp4"     # input video for lipsync -- use 15s vid for now for efficiency (assume audio <= 15s)

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
    input_text = data['text']
    
    # copy the input text as output
    # TODO: replace with actual response from TTT model
    response_text = input_text

    # log input + output to conversation history (for now in txt file)
    # TODO: store history as json in database
    with open("conversation_input_text.txt", "a", encoding="utf-8") as f:
        f.write(input_text + "\n")

    # Run TTS workflow to generate audio file
    TTS_workflow(tts_model, input_text, speaker_path, output_path)
    
    # Generate lipsync with Wav2Lip (with output from TTS)
    generate_lipsync_wav2lip(output_path, video_input_path)

    return jsonify({"response": response_text})

if __name__ == '__main__':
    app.run(debug=True)