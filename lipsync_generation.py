import subprocess
import os

# simply runs command to put input audio and video into Wav2Lip model
# NOTE: inference_adjusted.py saves the lipsync video to the static folder.
def generate_lipsync_wav2lip(audio_path, video_input):
    """
    uses subprocess to run Wav2Lip's inference file to generate lipsync video.
    need to run as it is from Wav2Lip directory so that it works!
    We will run inference_adjusted.py that will save the results video to static folder.
    """
    # Set the path to the virtual environment's Python interpreter
    venv_python = os.path.join(".venv\Scripts\python.exe")

    subprocess.run([
        venv_python, "inference_adjusted.py",
        "--checkpoint_path", "checkpoints/wav2lip.pth",
        "--face", f"../{video_input}",
        "--audio", f"../{audio_path}",
    ], cwd="Wav2Lip", check=True)