"""
Malay Text-to-Speech (MALE VOICE)
"""
import torch
from transformers import VitsModel, AutoTokenizer
import scipy.io.wavfile as wavfile
import sounddevice as sd
import soundfile as sf
import os

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_tts_model(device=device):
    """Initialize the TTS model."""
    print("Initializing Malay TTS model...")
    model = VitsModel.from_pretrained("facebook/mms-tts-zlm")
    tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-zlm")
    
    model.to(device)
    print("Malay TTS model initialized successfully!")
    return model, tokenizer

def tts_workflow(model, tokenizer, input_text, output_path):
    """Convert text to speech using the TTS model."""
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Prepare inputs for the model
    inputs = tokenizer(input_text, return_tensors="pt")
    
    # Move inputs to the same device as the model
    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    # Generate audio waveform
    with torch.no_grad():
        output = model(**inputs).waveform
    
    # Convert the PyTorch tensor to numpy array
    audio_numpy = output.squeeze().cpu().numpy()
    
    # Save as WAV file
    wavfile.write(output_path, 16000, audio_numpy)
    
    print("Malay TTS conversion completed!")
    print("Output audio path:", output_path)
    return output_path

def playback_speech(output_path):
    """Play back the generated speech."""
    print("Playing generated Malay audio:")
    data, sample_rate = sf.read(output_path)
    sd.play(data, samplerate=sample_rate)
    sd.wait()  # Wait until playback is done
    print("Malay TTS playback completed!")
    
if __name__ == "__main__":
    # Initialize the TTS model
    model, tokenizer = get_tts_model()
    
    # Text to Speech conversion
    input_text = "Selamat datang ke TensorFlow Speech Synthesis!"
    output_path = "outputs/malay_tts_output.wav"
    tts_workflow(model, tokenizer, input_text, output_path)
    
    # Play back the generated speech
    playback_speech(output_path)

