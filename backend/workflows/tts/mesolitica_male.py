import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf

# Check for GPU availability
device = "cuda:0" if torch.cuda.is_available() else "cpu"

# Load the model & tokenizer
model = ParlerTTSForConditionalGeneration.from_pretrained("mesolitica/malay-parler-tts-mini-v1").to(device)
tokenizer = AutoTokenizer.from_pretrained("mesolitica/malay-parler-tts-mini-v1")

# Choose the male speaker
male_speaker = "Danial"

# Define speaker characteristics
description = f"{male_speaker}'s voice, delivers a deep and steady speech with a confident tone. The recording is of high quality, with the speaker's voice sounding clear and well-articulated."

# Text to synthesize
prompt = "Ini adalah ujian sistem TTS dalam Bahasa Melayu menggunakan suara Danial."

# Tokenize input
input_ids = tokenizer(description, return_tensors="pt").to(device)
prompt_input_ids = tokenizer(prompt, return_tensors="pt").to(device)

# Generate speech
generation = model.generate(
    input_ids=input_ids.input_ids,
    attention_mask=input_ids.attention_mask,
    prompt_input_ids=prompt_input_ids.input_ids,
    prompt_attention_mask=prompt_input_ids.attention_mask,
)

# Convert to NumPy and save audio
audio_arr = generation.cpu()
sf.write(f'male_tts_Danial.mp3', audio_arr.numpy().squeeze(), 44100)

print("Audio saved as male_tts_Danial.mp3 🎵")
