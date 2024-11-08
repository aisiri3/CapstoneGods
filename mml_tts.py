### NEED TO RUN on python 3.8 venv 

from transformers import VitsModel, AutoTokenizer
import torch
    
import scipy.io.wavfile as wavfile
model = VitsModel.from_pretrained("facebook/mms-tts-zlm")
tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-zlm")

text = "hai, siapa nama awak, Nama saya bukan saya"
inputs = tokenizer(text, return_tensors="pt")

with torch.no_grad():
    output = model(**inputs).waveform



# Convert the PyTorch tensor to numpy array
audio_numpy = output.squeeze().numpy()

# Save as WAV file (sample rate is typically 16000 Hz for this model)
wavfile.write(".\outputs\output.wav", 16000, audio_numpy)