"""
Chat services with integrated language model generation and TTS.
"""
from flask import current_app, session
import time
import os
from pathlib import Path
import base64
import json
import gc
import torch

# Import English workflows
from workflows.tts.coqui import get_tts_model as get_english_tts_model
from workflows.tts.coqui import tts_workflow as english_tts_workflow
from workflows.tts.coqui import playback_speech
from workflows.text_to_text.english import get_model as get_llama_model

# Import Malay workflows
from workflows.tts.malay_male_tts import get_tts_model as get_malay_male_tts_model
from workflows.tts.malay_male_tts import tts_workflow as malay_male_tts_workflow
from workflows.tts.malay_female_tts import get_tts_model as get_malay_female_tts_model
from workflows.tts.malay_female_tts import tts_workflow as malay_female_tts_workflow

# Import Malay text-to-text directly
# Use the direct function rather than just the model loader
from workflows.text_to_text.malay import generate_mallam_response

from workflows.lipsync.lipsync import generate_rhubarb_lipsync

from transformers.utils.logging import disable_progress_bar
disable_progress_bar()

# Initialize model references (but don't load them yet)
english_tts_model = None
llama_model = None
malay_male_tts_model = None
malay_female_tts_model = None

# Track which models are currently loaded in memory
loaded_models = {
    "english_tts": False,
    "llama": False,
    "malay_male_tts": False,
    "malay_female_tts": False
}

# Current avatar selections
current_avatar_selections = {
    "gender": "Male",
    "persona": "Casual",
    "language": "English"
}

def unload_models(except_language=None):
    """
    Unload models that aren't needed for the current language to free up GPU memory.
    
    Args:
        except_language (str, optional): Language models to keep loaded ('English' or 'Malay')
    """
    global english_tts_model, llama_model, malay_male_tts_model, malay_female_tts_model, loaded_models
    
    print(f"Unloading models except for language: {except_language}")
    
    # Unload English models if we're switching to Malay
    if except_language != "English" and (loaded_models["english_tts"] or loaded_models["llama"]):
        print("Unloading English models...")
        if loaded_models["english_tts"]:
            english_tts_model = None
            loaded_models["english_tts"] = False
        
        if loaded_models["llama"]:
            llama_model = None
            loaded_models["llama"] = False
    
    # Unload Malay models if we're switching to English
    if except_language != "Malay" and (loaded_models["malay_male_tts"] or loaded_models["malay_female_tts"]):
        print("Unloading Malay models...")
        if loaded_models["malay_male_tts"]:
            malay_male_tts_model = None
            loaded_models["malay_male_tts"] = False
        
        if loaded_models["malay_female_tts"]:
            malay_female_tts_model = None
            loaded_models["malay_female_tts"] = False
    
    # Force garbage collection to free memory
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    print("Model unloading complete")
    print(f"Current loaded models: {loaded_models}")

def get_english_tts():
    """Lazy-load the English TTS model."""
    global english_tts_model, loaded_models
    if english_tts_model is None:
        print("Loading English TTS model...")
        english_tts_model = get_english_tts_model()
        loaded_models["english_tts"] = True
    return english_tts_model

def get_llama():
    """Lazy-load the Llama model."""
    global llama_model, loaded_models
    if llama_model is None:
        print("Loading Llama model...")
        llama_model = get_llama_model()
        loaded_models["llama"] = True
    return llama_model

def get_malay_male_tts():
    """Lazy-load the Malay male TTS model."""
    global malay_male_tts_model, loaded_models
    if malay_male_tts_model is None:
        print("Loading Malay male TTS model...")
        malay_male_tts_model = get_malay_male_tts_model()
        loaded_models["malay_male_tts"] = True
    return malay_male_tts_model

def get_malay_female_tts():
    """Lazy-load the Malay female TTS model."""
    global malay_female_tts_model, loaded_models
    if malay_female_tts_model is None:
        print("Loading Malay female TTS model...")
        malay_female_tts_model = get_malay_female_tts_model()
        loaded_models["malay_female_tts"] = True
    return malay_female_tts_model

def generate_llama_response(text):
    """Generate a response using the Llama model."""
    try:
        model = get_llama()
        
        # Measure response time
        start_time = time.time()
        
        # Generate response
        sequences = model(
            text,
            do_sample=True,
            top_k=10,
            num_return_sequences=1,
            max_length=512,
            temperature=0.7,
        )
        
        end_time = time.time()
        elapsed_time = end_time - start_time
        
        # Extract and clean the response
        response = sequences[0]["generated_text"]
        
        print(f"Llama response generated in {elapsed_time:.2f} seconds")
        return response
        
    except Exception as e:
        print(f"Error generating Llama response: {e}")
        # Return the original text with an error message as fallback
        return f"I couldn't process that properly. Here's what you said: {text}"

def save_avatar_selections(selections):
    """
    Save the avatar selections to use for future interactions.
    
    Args:
        selections (dict): Dictionary containing gender, persona, and language selections
        
    Returns:
        dict: The saved selections
    """
    global current_avatar_selections
    
    # Check if language is changing
    language_changing = current_avatar_selections.get("language") != selections.get("language")
    
    # Update the current selections
    current_avatar_selections.update({
        "gender": selections.get("gender", "Male"),
        "persona": selections.get("persona", "Casual"),
        "language": selections.get("language", "English")
    })
    
    # Log the updated selections
    print(f"Updated avatar selections: {current_avatar_selections}")
    
    # If language is changing, unload models for the previous language
    if language_changing:
        print(f"Language changed from {current_avatar_selections.get('language')} to {selections.get('language')}")
        unload_models(except_language=selections.get("language"))
    
    # Optionally, save to a file for persistence across server restarts
    selections_file = current_app.config.get('AVATAR_SELECTIONS_PATH', 'data/avatar_selections.json')
    os.makedirs(os.path.dirname(selections_file), exist_ok=True)
    
    try:
        with open(selections_file, 'w') as f:
            json.dump(current_avatar_selections, f)
    except Exception as e:
        print(f"Warning: Could not save selections to file: {e}")
    
    return current_avatar_selections

def get_speaker_path(avatar_config=None):
    """
    Determine the appropriate speaker path based on avatar configuration.
    
    Args:
        avatar_config (dict, optional): Avatar configuration from frontend
        
    Returns:
        str: Path to the speaker file
    """
    # Use provided config or fallback to current selections
    config = avatar_config or current_avatar_selections
    
    gender = config.get("gender", "Male")
    persona = config.get("persona", "Casual")
    
    # Map config to speaker files
    speaker_mapping = {
        ("Male", "Casual"): "inputs/male_formal.wav",
        ("Male", "Professional"): "inputs/male_formal.wav",
        ("Female", "Casual"): "inputs/business-ethics.wav",
        ("Female", "Professional"): "inputs/business-ethics.wav"
    }
    
    # Get the appropriate speaker path, with fallback
    speaker_path = speaker_mapping.get(
        (gender, persona), 
        current_app.config.get('TTS_SPEAKER_PATH', 'inputs/business-ethics.wav')
    )
    
    print(f"Using speaker path: {speaker_path} for gender={gender}, persona={persona}")
    return speaker_path

def process_speech(text, avatar_config=None):
    """
    Process speech from text input, using the appropriate model for text generation,
    TTS for audio generation, and Rhubarb for lipsync.
    
    Args:
        text (str): The input text from the user
        avatar_config (dict, optional): Avatar configuration from frontend
        
    Returns:
        dict: Contains the response text, audio file path, and lipsync data
    """
    # Use provided config or fallback to current selections
    config = avatar_config or current_avatar_selections
    language = config.get("language", "English")
    gender = config.get("gender", "Male")
    
    output_path = current_app.config.get('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
    
    try:
        # Process based on language
        if language == "English":
            # Generate response using Llama
            response_text = generate_llama_response(text)
            
            # Get TTS model
            model = get_english_tts()
            
            # Get appropriate speaker path based on avatar config
            speaker_path = get_speaker_path(avatar_config)
            
            # Convert response to speech
            english_tts_workflow(model, response_text, speaker_path, output_path)
        
        else:  # Malay
            # Generate response using Mallam (direct call to module function)
            print("Generating Malay response using Mallam...")
            response_text = generate_mallam_response(text)
            
            # Select the appropriate TTS model based on gender
            if gender == "Male":
                model, tokenizer = get_malay_male_tts()
                malay_male_tts_workflow(model, tokenizer, response_text, output_path)
            else:  # Female
                model, tokenizer = get_malay_female_tts()
                malay_female_tts_workflow(model, tokenizer, response_text, output_path)
        
        # Generate lipsync data
        lipsync_data = generate_rhubarb_lipsync(output_path)
        
        # Get just the mouth cues from the lipsync data
        mouth_cues = lipsync_data.get("mouthCues", [])
        
        # Return all necessary data
        return {
            "response_text": response_text,
            "audio_path": output_path,
            "mouth_cues": mouth_cues
        }
    
    except Exception as e:
        print(f"Error in process_speech: {e}")
        import traceback
        traceback.print_exc()
        
        # Provide a fallback response
        fallback_response = "I'm sorry, but I'm having trouble processing your request right now."
        if language == "Malay":
            fallback_response = "Maaf, saya menghadapi masalah dalam memproses permintaan anda sekarang."
        
        # Try to generate audio for the fallback response
        try:
            if language == "English":
                model = get_english_tts()
                speaker_path = get_speaker_path(avatar_config)
                english_tts_workflow(model, fallback_response, speaker_path, output_path)
            else:  # Malay
                if gender == "Male":
                    model, tokenizer = get_malay_male_tts()
                    malay_male_tts_workflow(model, tokenizer, fallback_response, output_path)
                else:  # Female
                    model, tokenizer = get_malay_female_tts()
                    malay_female_tts_workflow(model, tokenizer, fallback_response, output_path)
            
            # Generate lipsync data for fallback
            lipsync_data = generate_rhubarb_lipsync(output_path)
            mouth_cues = lipsync_data.get("mouthCues", [])
        except Exception as e2:
            print(f"Error generating fallback audio: {e2}")
            mouth_cues = []
        
        return {
            "response_text": fallback_response,
            "audio_path": output_path,
            "mouth_cues": mouth_cues
        }

def encode_audio_to_base64(audio_path):
    """Convert audio file to base64 for transmission to frontend."""
    try:
        with open(audio_path, "rb") as audio_file:
            encoded_audio = base64.b64encode(audio_file.read()).decode('utf-8')
            return encoded_audio
    except Exception as e:
        print(f"Error encoding audio: {e}")
        return None

def play_audio():
    """Play the generated audio file (no longer needed for frontend playback)."""
    output_path = current_app.config.get('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
    playback_speech(output_path)

# Load saved selections on module initialization
try:
    selections_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
        'data', 'avatar_selections.json'
    )
    if os.path.exists(selections_file):
        with open(selections_file, 'r') as f:
            current_avatar_selections.update(json.load(f))
            print(f"Loaded avatar selections: {current_avatar_selections}")
except Exception as e:
    print(f"Warning: Could not load saved selections: {e}")