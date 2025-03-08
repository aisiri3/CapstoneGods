"""
Chat services with integrated Llama text generation.
"""
from flask import current_app, send_file
import time
import os
from pathlib import Path
import base64

from workflows.tts.coqui import get_tts_model, tts_workflow, playback_speech
from workflows.text_to_text.english import get_model as get_llama_model
from workflows.lipsync.lipsync import generate_rhubarb_lipsync

# Initialize models
tts_model = None
llama_model = None

def get_tts():
    """Lazy-load the TTS model."""
    global tts_model
    if tts_model is None:
        tts_model = get_tts_model()
    return tts_model

def get_llama():
    """Lazy-load the Llama model."""
    global llama_model
    if llama_model is None:
        llama_model = get_llama_model()
    return llama_model

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
        print("Generated response: ", response)
        return response
        
    except Exception as e:
        print(f"Error generating Llama response: {e}")
        # Return the original text with an error message as fallback
        return f"I couldn't process that properly. Here's what you said: {text}"

def process_speech(text):
    """
    Process speech from text input, using Llama for text generation,
    TTS for audio generation, and Rhubarb for lipsync.
    
    Returns a dict containing the response text, audio file path, and lipsync data.
    """
    # TODO: Log prompt in database
    
    # Generate response using Llama
    response_text = generate_llama_response(text)
    
    # TODO: Log the response in database
    
    # Get TTS model
    model = get_tts()
    
    # Get configuration
    speaker_path = current_app.config.get('TTS_SPEAKER_PATH', 'inputs/business-ethics.wav')
    output_path = current_app.config.get('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
    
    # Convert response to speech
    tts_workflow(model, response_text, speaker_path, output_path)
    
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