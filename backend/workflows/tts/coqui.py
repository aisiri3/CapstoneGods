"""
Coqui TTS Implementation.
"""
import torch
import torch.serialization
from TTS.tts.configs.xtts_config import XttsConfig  # Add this import
from TTS.tts.models.xtts import XttsAudioConfig  # Add this import

# Allow PyTorch to deserialize XttsConfig and XttsAudioConfig
# torch.serialization.add_safe_globals([XttsConfig, XttsAudioConfig])

from TTS.api import TTS
import sounddevice as sd
import soundfile as sf

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_tts_model(device=device):
    """Initialize the TTS model with weights_only=False."""
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
    
    # Override PyTorch default behavior to allow full model loading
    # torch.load = lambda *args, **kwargs: torch._load(*args, weights_only=False, **kwargs)

    tts.to(device)
    return tts


def tts_workflow(tts, input_text, speaker_path, output_path):
    """Convert text to speech using the TTS model."""
    # Text to Speech conversion
    tts.tts_to_file(
        text=input_text, 
        speaker_wav=speaker_path,
        file_path=output_path, 
        language="en")

    print("TTS conversion completed!")
    print("Output audio path: ", output_path)

def playback_speech(output_path):
    """Play back the generated speech."""
    print("Playing generated audio:")

    data, sample_rate = sf.read(output_path)
    sd.play(data, samplerate=sample_rate)
    sd.wait()  # Wait until playback is done

    print("TTS playback completed!")
