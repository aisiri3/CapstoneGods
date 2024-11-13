import torch
from TTS.api import TTS
import os

device = "cuda" if torch.cuda.is_available() else "cpu"

input_dir = 'Llama TTT output'

output_dir = 'Llama TTS output/'

os.makedirs(output_dir, exist_ok=True)

tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)

for i, filename in enumerate(os.listdir(input_dir), 1):

    if filename.endswith('.txt'):

        file_path = os.path.join(input_dir, filename)
        with open(file_path, 'r') as file:
            response = file.read().strip()

        output_path = os.path.join(output_dir, f"english_output_audio_{i}.wav")


        tts.tts_to_file(
            text=response,  
            speaker_wav="Llama TTS input/LJ001-0032.wav",
            file_path=output_path
        )

        print(f"Generated audio file for {filename}: {output_path}")
