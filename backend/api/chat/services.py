"""
Chat services with integrated Llama text generation.
"""
from flask import current_app
import time

from workflows.tts.coqui import get_tts_model, tts_workflow, playback_speech
from workflows.text_to_text.english import get_model as get_llama_model

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
    """Process speech from text input, using Llama for text generation."""
    # TODO: Log prompt in database
    
    # Generate response using Llama
    response_text = generate_llama_response(text)
    
    # TODO: Log the repsonse in database
    
    # Get TTS model
    model = get_tts()
    
    # Get configuration
    speaker_path = current_app.config.get('TTS_SPEAKER_PATH', 'inputs/business-ethics.wav')
    output_path = current_app.config.get('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
    
    # Convert response to speech
    tts_workflow(model, response_text, speaker_path, output_path)
    
    return response_text

def play_audio():
    """Play the generated audio file."""
    output_path = current_app.config.get('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
    playback_speech(output_path)