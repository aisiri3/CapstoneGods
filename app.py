from flask import Flask, render_template, request, jsonify
import subprocess
from Coqui_English_python_workflow import init_TTS_model, TTS_workflow, playback_output_speech
import time

app = Flask(__name__)

# Initialize TTS model once
tts_model = init_TTS_model()
speaker_path = "inputs/business-ethics.wav"  # speaker reference from the inputs
output_path = "outputs/user_output.wav"      # store output audio in the outputs
# video_input_path = "inputs/15s_vid.mp4"     # input video for lipsync
video_input_path = "inputs/15s_vid.mp4"

# NOTE: inference_adjusted.py saves the lipsync video to the static folder.
def generate_lipsync_video(audio_path, video_input):
    """
    uses subprocess to run Wav2Lip's inference file to generate lipsync video.
    need to run as it is from Wav2Lip directory so that it works!
    We will run inference_adjusted.py that will save the results video to static folder.
    """
    subprocess.run([
        "python", "inference_adjusted.py",
        "--checkpoint_path", "checkpoints/wav2lip.pth",
        "--face", f"../{video_input}",
        "--audio", f"../{audio_path}",
    ], cwd="Wav2Lip")

@app.route('/')
def index():
    # render main page
    return render_template('index.html')

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
    generate_lipsync_video(output_path, video_input_path)

    return jsonify({"response": response_text})

@app.route('/play_audio', methods=['POST'])
def play_audio():
    # # play audio file
    # playback_output_speech(output_path)
    # return jsonify({"status": "audio_played"})
    
    # Triggered by frontend to play lipsync video
    return jsonify({"status": "video_ready"})
    

if __name__ == '__main__':
    app.run(debug=True)