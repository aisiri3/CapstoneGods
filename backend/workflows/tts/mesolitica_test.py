import os
import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf

# Check for GPU availability
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Global variables for lazy loading
malay_tts_model = None
malay_tokenizer = None
loaded_models = {"malay_tts": False}

def get_malay_tts_model(device=device):
    """Initialize the Malay TTS model."""
    model = ParlerTTSForConditionalGeneration.from_pretrained("mesolitica/malay-parler-tts-mini-v1").to(device)
    tokenizer = AutoTokenizer.from_pretrained("mesolitica/malay-parler-tts-mini-v1")
    return model, tokenizer

def get_malay_tts():
    """Lazy-load the Malay TTS model."""
    global malay_tts_model, malay_tokenizer, loaded_models
    if malay_tts_model is None:
        print("Loading Malay TTS model...")
        malay_tts_model, malay_tokenizer = get_malay_tts_model()
        loaded_models["malay_tts"] = True
    return malay_tts_model, malay_tokenizer

def malay_tts_workflow(input_text, speaker, output_path=None):
    """Convert Malay text to speech using the TTS model.
    
    Args:
        input_text (str): Text to convert to speech
        speaker (str): Speaker identity ('Osman' for male, 'Yasmin' for female)
        output_path (str, optional): Path to save the audio file. If None, a default name will be used.
    
    Returns:
        str: Path to the generated audio file
    """
    # Load model if not already loaded
    model, tokenizer = get_malay_tts()
    
    # Set default output path if not provided
    if output_path is None:
        gender = "male" if speaker == "Osman" else "female"
        output_folder = "/outputs/user_output.wav"
        os.makedirs(output_folder, exist_ok=True)  # Ensure the output folder exists
        output_path = os.path.join(output_folder, f'{gender}_tts_{speaker.lower()}.wav')
    
    # Define speaker characteristics
    description = f"{speaker}'s voice, delivers a {'deep' if speaker == 'Osman' else 'clear'} and steady speech with a confident tone. The recording is of high quality, with the speaker's voice sounding clear and well-articulated."
    
    # Tokenize input
    input_ids = tokenizer(description, return_tensors="pt").to(device)
    prompt_input_ids = tokenizer(input_text, return_tensors="pt").to(device)
    
    # Generate speech
    generation = model.generate(
        input_ids=input_ids.input_ids,
        attention_mask=input_ids.attention_mask,
        prompt_input_ids=prompt_input_ids.input_ids,
        prompt_attention_mask=prompt_input_ids.attention_mask,
    )
    
    # Convert to NumPy and save audio
    audio_arr = generation.cpu()
    sf.write(output_path, audio_arr.numpy().squeeze(), 44100)
    
    print(f"Audio saved as {output_path} 🎵")
    return output_path

if __name__ == "__main__":
    print("Running Malay TTS test...")
    sample_text = "Harap bersabar semasa saya menyemak butirannya. Saya mengambil masa yang diperlukan untuk memastikan saya memberikan anda jawapan yang lengkap, tepat dan teliti. Ia hanya sebentar lagi. Saya memastikan untuk mengumpulkan semua perkara yang berkaitan, menyemak semula segala-galanya dan menyusun respons supaya berguna sebaik mungkin. Terima kasih atas pemahaman anda!"
    output_file = malay_tts_workflow(sample_text, "Osman", "outputs/filler_1_o.wav")
    output_file = malay_tts_workflow(sample_text, "Yasmin", "outputs/filler_1_y.wav")
    print(f"Test complete. Audio generated: {output_file}") 