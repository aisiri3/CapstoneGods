import torch
import librosa
import numpy as np
import soundfile as sf
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
from scipy import signal

# Check for GPU availability
device = "cuda:0" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load the model & tokenizer
model = ParlerTTSForConditionalGeneration.from_pretrained("mesolitica/malay-parler-tts-mini-v1").to(device)
tokenizer = AutoTokenizer.from_pretrained("mesolitica/malay-parler-tts-mini-v1")

# Choose a female speaker
female_speaker = "Yasmin"  # You can also try other female voices like "Bunga", "Ayu", or "Elina"

# Text to synthesize
prompt = "Selamat datang ke demonstrasi sistem TTS dalam Bahasa Melayu."

# Variation 1: Excited and casual
description_excited = f"{female_speaker}'s voice, delivers an excited and casual speech with an energetic tone and slightly faster pace. The speech sounds enthusiastic and friendly, with natural-sounding inflections. The recording is of very high quality, with the speaker's voice sounding clear and very close up."

# Variation 2: Serious and friendly
description_serious = f"{female_speaker}'s voice, delivers a serious and professional speech with a friendly undertone. The pace is measured and deliberate, with clear articulation and thoughtful pauses. The recording is of very high quality, with the speaker's voice sounding clear and very close up."

# Generate both variations
variations = [
    {"name": "excited_casual", "description": description_excited},
    {"name": "serious_friendly", "description": description_serious}
]

# Process each variation
for variation in variations:
    print(f"\nGenerating {variation['name']} variation...")
    
    # Tokenize input
    input_ids = tokenizer(variation["description"], return_tensors="pt").to(device)
    prompt_input_ids = tokenizer(prompt, return_tensors="pt").to(device)
    
    # Generate speech
    generation = model.generate(
        input_ids=input_ids.input_ids,
        attention_mask=input_ids.attention_mask,
        prompt_input_ids=prompt_input_ids.input_ids,
        prompt_attention_mask=prompt_input_ids.attention_mask,
    )
    
    # Convert to NumPy and save audio
    audio_arr = generation.cpu().numpy().squeeze()
    output_path = f"female_tts_{female_speaker}_{variation['name']}.mp3"
    sf.write(output_path, audio_arr, 44100)
    print(f"Audio saved as {output_path} 🎵")

    # Optional: If you want to also apply the time-stretching effects from your original code
    if False:  # Set to True if you want to apply the slow-down effects
        # Apply slow-down effect (using the librosa method as an example)
        slow_output_path = f"female_tts_{female_speaker}_{variation['name']}_slow.mp3"
        
        # Load the audio
        y, sr = librosa.load(output_path, sr=44100)
        
        # Use a larger frame length and hop length for better quality
        frame_length = 2048
        hop_length = 512
        
        # Apply time stretch with specific parameters
        y_slow = librosa.effects.time_stretch(
            y=y, 
            rate=0.85,
            n_fft=frame_length,
            hop_length=hop_length
        )
        
        # Apply a slight high-pass filter to reduce mud/echo in lower frequencies
        b, a = signal.butter(4, 100/(sr/2), 'highpass')
        y_slow = signal.filtfilt(b, a, y_slow)
        
        # Normalize audio level
        y_slow = y_slow / np.max(np.abs(y_slow))
        
        sf.write(slow_output_path, y_slow, sr)
        print(f"Slowed version saved as {slow_output_path} 🎶")

print("\nGeneration complete! You can now compare the two variations.")