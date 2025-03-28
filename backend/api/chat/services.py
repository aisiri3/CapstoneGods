"""
Chat services with integrated language model generation and TTS.
"""
from flask import current_app, session
import time
import os
import subprocess
from pathlib import Path
import base64
import json
import gc
import torch
import re

# Import English workflows
from workflows.tts.coqui import get_tts_model as get_english_tts_model
from workflows.tts.coqui import tts_workflow as english_tts_workflow
from workflows.tts.coqui import playback_speech
from workflows.text_to_text.english import get_model as get_llama_model

# Import Malay text-to-text directly
# Use the direct function rather than just the model loader
from workflows.text_to_text.malay import generate_mallam_response

from workflows.lipsync.lipsync import generate_rhubarb_lipsync

from transformers.utils.logging import disable_progress_bar
disable_progress_bar()

# Initialize model references (but don't load them yet)
english_tts_model = None
llama_model = None

# Track which models are currently loaded in memory
loaded_models = {
    "english_tts": False,
    "llama": False
}

# Current avatar selections
current_avatar_selections = {
    "gender": "Male",
    "persona": "Casual",
    "language": "English"
}

def unload_models(except_language=None):
    """
    Unload TTS models that aren't needed for the current language to free up GPU memory.
    Only called when language is changed in avatar settings.
    Llama model remains loaded regardless of language change.
    
    Args:
        except_language (str, optional): Language models to keep loaded ('English' or 'Malay')
    """
    global english_tts_model, loaded_models
    
    print(f"Unloading TTS models except for language: {except_language}")
    
    # Unload English TTS model if we're switching to Malay
    if except_language != "English" and loaded_models["english_tts"]:
        print("Unloading English TTS model...")
        english_tts_model = None
        loaded_models["english_tts"] = False
    
    # Force garbage collection to free memory
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    print("TTS model unloading complete")
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

# def run_malay_tts(text, speaker, output_path):
#     """
#     Run the Malay TTS using a subprocess with the dedicated virtual environment.
    
#     Args:
#         text (str): Text to convert to speech
#         speaker (str): Speaker name ('Osman' for male, 'Yasmin' for female)
#         output_path (str): Path to save the output audio file
        
#     Returns:
#         bool: True if successful, False otherwise
#     """
#     try:
#         # Get the current directory and build paths relative to it
#         base_dir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
#         print(f"Base directory: {base_dir}")
        
#         # Path to the mesolitica.py script
#         script_path = os.path.join(base_dir, 'workflows', 'tts', 'mesolitica.py')
#         print(f"Script path: {script_path}")
        
#         # Verify script exists
#         if not os.path.exists(script_path):
#             print(f"ERROR: Script file not found at: {script_path}")
#             # Try to find the script
#             for root, dirs, files in os.walk(base_dir):
#                 if 'mesolitica.py' in files:
#                     script_path = os.path.join(root, 'mesolitica.py')
#                     print(f"Found script at: {script_path}")
#                     break
        
#         # Path to the Python executable in the Malay venv
#         if os.name == 'nt':  # Windows
#             python_path = os.path.join(base_dir, 'venv-malay', 'Scripts', 'python.exe')
#         else:  # Linux/Mac
#             python_path = os.path.join(base_dir, 'venv-malay', 'bin', 'python')
        
#         print(f"Python path: {python_path}")
        
#         # Verify Python executable exists
#         if not os.path.exists(python_path):
#             print(f"ERROR: Python executable not found at: {python_path}")
#             # Try to find python in venv-malay
#             for root, dirs, files in os.walk(os.path.join(base_dir, 'venv-malay')):
#                 for file in files:
#                     if file == 'python.exe' or file == 'python':
#                         python_path = os.path.join(root, file)
#                         print(f"Found Python at: {python_path}")
#                         break
        
#         # Ensure output directory exists (using absolute path)
#         output_dir = os.path.dirname(os.path.abspath(output_path))
#         os.makedirs(output_dir, exist_ok=True)
#         print(f"Output directory: {output_dir}")
        
#         # Create a temporary file to hold the text with absolute path
#         temp_text_file = os.path.join(output_dir, "temp_text.txt")
#         print(f"Temp text file: {temp_text_file}")
        
#         with open(temp_text_file, "w", encoding="utf-8") as f:
#             f.write(text)
#             print(f"Text written to temp file: {text[:30]}...")
        
#         # Verify temp file was created
#         if not os.path.exists(temp_text_file):
#             print(f"ERROR: Failed to create temp file at: {temp_text_file}")
#             return False
            
#         # Use absolute paths for everything in the command
#         abs_output_path = os.path.abspath(output_path)
        
#         # Run the subprocess
#         command = [
#             python_path,
#             script_path,
#             "--text-file", temp_text_file,
#             "--speaker", speaker,
#             "--output", abs_output_path
#         ]
        
#         print(f"Running Malay TTS subprocess with command: {' '.join(command)}")
        
#         # Run the subprocess and capture output
#         result = subprocess.run(
#             command, 
#             capture_output=True,
#             text=True
#         )
        
#         # Print both stdout and stderr regardless of success
#         if result.stdout:
#             print(f"Malay TTS subprocess stdout: {result.stdout}")
#         if result.stderr:
#             print(f"Malay TTS subprocess stderr: {result.stderr}")
            
#         # Check return code
#         if result.returncode != 0:
#             print(f"Subprocess failed with return code: {result.returncode}")
#             return False
        
#         # Clean up the temporary file
#         try:
#             if os.path.exists(temp_text_file):
#                 os.remove(temp_text_file)
#                 print("Temp file removed successfully")
#         except Exception as cleanup_error:
#             print(f"Warning: Failed to remove temp file: {cleanup_error}")
        
#         # Verify the output file was created
#         if os.path.exists(abs_output_path):
#             print(f"Success: Output file created at {abs_output_path}")
#             return True
#         else:
#             print(f"ERROR: Output file was not created at {abs_output_path}")
#             return False
    
#     except Exception as e:
#         print(f"Error running Malay TTS subprocess: {e}")
#         import traceback
#         traceback.print_exc()
#         return False
def run_malay_tts(text, speaker, output_path):
    """
    Run the Malay TTS using a subprocess with optimizations for speed.
    Shows print statements from the TTS subprocess.
    
    Args:
        text (str): Text to convert to speech
        speaker (str): Speaker name ('Osman' for male, 'Yasmin' for female)
        output_path (str): Path to save the output audio file
        
    Returns:
        bool: True if successful, False otherwise
    """
    import os
    import subprocess
    import time
    import sys
    
    try:
        start_time = time.time()
        print(f"Starting TTS for text: '{text[:30]}...'")
        
        # Get the current directory and build paths relative to it
        base_dir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        
        # Path to the optimized mesolitica.py script
        script_path = os.path.join(base_dir, 'workflows', 'tts', 'mesolitica_optimized.py')
        
        # Fallback to original script if optimized version doesn't exist
        if not os.path.exists(script_path):
            script_path = os.path.join(base_dir, 'workflows', 'tts', 'mesolitica.py')
            print(f"Using original script at: {script_path}")
        
        # Path to the Python executable in the Malay venv
        if os.name == 'nt':  # Windows
            python_path = os.path.join(base_dir, 'venv-malay', 'Scripts', 'python.exe')
        else:  # Linux/Mac
            python_path = os.path.join(base_dir, 'venv-malay', 'bin', 'python')
        
        # Ensure output directory exists
        output_dir = os.path.dirname(os.path.abspath(output_path))
        os.makedirs(output_dir, exist_ok=True)
        
        # Use direct text input for short texts (avoids file I/O)
        if len(text) < 500:
            command = [
                python_path,
                script_path,
                "--text", text,
                "--speaker", speaker,
                "--output", os.path.abspath(output_path)
            ]
        else:
            # Create a temporary file for longer texts
            temp_text_file = os.path.join(output_dir, "temp_text.txt")
            with open(temp_text_file, "w", encoding="utf-8") as f:
                f.write(text)
            
            command = [
                python_path,
                script_path,
                "--text-file", temp_text_file,
                "--speaker", speaker,
                "--output", os.path.abspath(output_path)
            ]
        
        # Add performance optimization flags
        command.extend([
            "--chunk-size", "150",  # Process text in smaller chunks
            "--use-quantization",   # Enable INT8 quantization for CPU
            "--use-jit",            # Enable JIT compilation
            "--batch-size", "4"     # Process in batches of 4 chunks
            # Disable half-precision by default to avoid compatibility issues
            # "--use-half-precision"  # Uncomment only if you know your system supports it
        ])
        
        print(f"Running Malay TTS subprocess with command:")
        print(" ".join(command))
        
        # Run the subprocess with real-time output forwarding
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,  # Line buffered
            universal_newlines=True
        )
        
        # Print real-time output
        print("\n--- TTS Subprocess Output ---")
        
        # Function to handle output stream in real-time
        def print_output(stream, prefix):
            for line in iter(stream.readline, ''):
                print(f"{prefix} {line.rstrip()}")
                
        # Create separate threads for stdout and stderr to avoid blocking
        import threading
        stdout_thread = threading.Thread(target=print_output, args=(process.stdout, "[TTS]"))
        stderr_thread = threading.Thread(target=print_output, args=(process.stderr, "[TTS-ERROR]"))
        
        # Set as daemon threads so they exit when the main thread exits
        stdout_thread.daemon = True
        stderr_thread.daemon = True
        
        # Start the threads
        stdout_thread.start()
        stderr_thread.start()
        
        try:
            # Wait for the process to complete with timeout
            return_code = process.wait(timeout=300)
            # Give threads a moment to finish printing remaining output
            stdout_thread.join(2)
            stderr_thread.join(2)
            print("--- End TTS Subprocess Output ---\n")
            
            # Clean up temporary file if it exists
            if len(text) >= 500 and os.path.exists(temp_text_file):
                try:
                    os.remove(temp_text_file)
                except Exception as cleanup_error:
                    print(f"Warning: Failed to remove temp file: {cleanup_error}")
            
            # Check result
            if return_code != 0:
                print(f"TTS subprocess failed with return code: {return_code}")
                return False
            
            # Verify output file was created
            if os.path.exists(os.path.abspath(output_path)):
                total_time = time.time() - start_time
                print(f"TTS completed successfully in {total_time:.2f} seconds")
                return True
            else:
                print(f"Error: Output file was not created at {output_path}")
                return False
                
        except subprocess.TimeoutExpired:
            print("TTS process timed out after 300 seconds")
            process.kill()
            return False
            
    except Exception as e:
        print(f"Error running Malay TTS: {e}")
        import traceback
        traceback.print_exc()
        return False
def generate_llama_response(prompt, persona=None, avatar_config=None):
    """Generate a response using the Llama model."""
    print("im here!!!!")
        # Use provided config or fallback to current selections
    config = avatar_config or current_avatar_selections
    
    persona_context = config.get("persona", "Casual")
    print(f'persona = {persona_context}')
    # Drastically different persona intros
    if persona_context == "Casual":
        persona = (
            "DO NOT CONTINUE THE PROMPT!!!"
            "You are a friendly English language assistant helping learners improve their communication skills in casual, everyday settings."
            "Please provide simple, short, and friendly responses with examples that are suitable for informal conversations." 
            "Your response should focus on casual language and tone, avoiding overly formal or stiff expressions." 
            "Keep your responses friendly, warm, and easy to understand, with a relaxed vibe." 
            "Provide light, conversational examples. Keep to maximum of 3 lines."
            "DO NOT USE ANY EMOJIS"
        )
    elif persona_context == "Professional":
        persona = (
            "DO NOT CONTINUE THE PROMPT!!!"
            "You are an English language assistant helping professionals improve their communication skills in the workplace. Please provide clear, concise, and formal responses with examples appropriate for a business setting." 
            "Your response should focus on professional language and avoid informal or casual phrases." 
            "Make sure the language is polite, respectful, and suitable for use in professional conversations." 
            "Provide formal, polite examples." 
            "Keep to maximum of 3 lines."
            "DO NOT USE ANY EMOJIS"
        )
    else:
        persona = (
            "I'm your English learning assistant, ready to adapt to your needs. "
            "Let me know how you'd like to learn!"
            "Keep your response length within 2 sentences."
            "Don't use emojis in your response!"
        )

    modified_prompt = persona + "\n" + prompt
    start_time = time.time()

    try:
        print(f'getting llama')
        model = get_llama()
        print(f'got llama')
        # Measure response time
        start_time = time.time()
        
        sequences = model(
            modified_prompt,
            do_sample=True,
            top_k=10,
            num_return_sequences=1,
            max_length=250,  # Ensure token limit
            truncation=True,
            temperature=0.7,
        )

        end_time = time.time()
        elapsed_time = end_time - start_time

        full_response = sequences[0]["generated_text"].strip()

        # Find the last punctuation mark before truncation
        last_punctuation_match = re.search(r'([.!?])[^.!?]*$', full_response)

        if last_punctuation_match:
            last_punctuation_index = last_punctuation_match.start(1)
            answer_text = full_response[:last_punctuation_index + 1]  # Include the pumnctuation
        else:
            answer_text = full_response  # If no punctuation is found, return as is

        # Remove trailing numbered list items if cut off (e.g., "1.", "2.")
        answer_text = re.sub(r'\s*\d+\.\s*$', '', answer_text)

        # Strip persona intro and prompt
        answer_text = answer_text.replace(persona, "").strip()
        answer_text = answer_text.replace(prompt, "").strip()

        # Replace "A: " anywhere in the response
        answer_text = answer_text.replace("A: ", "").strip()

        # If final answer text is empty or just whitespace, use a fallback message
        if not answer_text or answer_text.isspace():
            answer_text = "That's a difficult one. Could you rephrase that?"

        print(f"Llama response generated in {elapsed_time:.2f} seconds: {answer_text}")
        return answer_text
        
    except Exception as e:
        print(f"Error generating Llama response: {e}")
        # Return the original text with an error message as fallback
        return f"I couldn't process that properly. Here's what you said: {prompt}"

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
        # This is when we actually unload models - only when language changes
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
        ("Male", "Casual"): "inputs/male_casual3.wav",
        ("Male", "Professional"): "inputs/male_formal.wav",
        ("Female", "Casual"): "inputs/female_casual_cleaned.wav",
        ("Female", "Professional"): "inputs/business-ethics.wav"
    }
    
    # Get the appropriate speaker path, with fallback
    speaker_path = speaker_mapping.get(
        (gender, persona), 
        current_app.config.get('TTS_SPEAKER_PATH', 'inputs/business-ethics.wav')
    )
    
    print(f"Using speaker path: {speaker_path} for gender={gender}, persona={persona}")
    return speaker_path

# def process_speech(text, avatar_config=None):
#     """
#     Process speech from text input, using the appropriate model for text generation,
#     TTS for audio generation, and Rhubarb for lipsync.
    
#     Args:
#         text (str): The input text from the user
#         avatar_config (dict, optional): Avatar configuration from frontend
        
#     Returns:
#         dict: Contains the response text, audio file path, and lipsync data
#     """
#     # Use provided config or fallback to current selections
#     config = avatar_config or current_avatar_selections
#     language = config.get("language", "English")
#     gender = config.get("gender", "Male")
    
#     output_path = current_app.config.get('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
    
#     try:
#         # Process based on language
#         if language == "English":
#             # Generate response using Llama
#             response_text = generate_llama_response(text, avatar_config=config)
            
#             # Get TTS model
#             model = get_english_tts()
            
#             # Get appropriate speaker path based on avatar config
#             speaker_path = get_speaker_path(avatar_config)
            
#             # Convert response to speech
#             english_tts_workflow(model, response_text, speaker_path, output_path)
        
#         else:  # Malay
#             # Generate response using Mallam (direct call to module function)
#             print("Generating Malay response using Mallam...")
#             response_text = generate_mallam_response(text)
            
#             # Select the appropriate speaker based on gender
#             speaker_name = "Osman" if gender == "Male" else "Yasmin"
            
#             # Run the Malay TTS subprocess
#             tts_success = run_malay_tts(response_text, speaker_name, output_path)
            
#             if not tts_success:
#                 print("Warning: Malay TTS subprocess failed. Using fallback message.")
#                 response_text = "Maaf, saya menghadapi masalah teknikal sekarang."
#                 # Try again with a simpler message
#                 run_malay_tts(response_text, speaker_name, output_path)
        
#         # Generate lipsync data
#         lipsync_data = generate_rhubarb_lipsync(output_path)
        
#         # Get just the mouth cues from the lipsync data
#         mouth_cues = lipsync_data.get("mouthCues", [])
        
#         # Return all necessary data
#         return {
#             "response_text": response_text,
#             "audio_path": output_path,
#             "mouth_cues": mouth_cues
#         }
    
#     except Exception as e:
#         print(f"Error in process_speech: {e}")
#         import traceback
#         traceback.print_exc()
        
#         # Provide a fallback response
#         fallback_response = "I'm sorry, but I'm having trouble processing your request right now."
#         if language == "Malay":
#             fallback_response = "Maaf, saya menghadapi masalah dalam memproses permintaan anda sekarang."
        
#         # Try to generate audio for the fallback response
#         try:
#             if language == "English":
#                 model = get_english_tts()
#                 speaker_path = get_speaker_path(avatar_config)
#                 english_tts_workflow(model, fallback_response, speaker_path, output_path)
#             else:  # Malay
#                 speaker_name = "Osman" if gender == "Male" else "Yasmin"
#                 run_malay_tts(fallback_response, speaker_name, output_path)
            
#             # Generate lipsync data for fallback
#             lipsync_data = generate_rhubarb_lipsync(output_path)
#             mouth_cues = lipsync_data.get("mouthCues", [])
#         except Exception as e2:
#             print(f"Error generating fallback audio: {e2}")
#             mouth_cues = []
        
#         return {
#             "response_text": fallback_response,
#             "audio_path": output_path,
#             "mouth_cues": mouth_cues
#         }

def encode_audio_to_base64(audio_path):
    """Convert audio file to base64 for transmission to frontend."""
    try:
        with open(audio_path, "rb") as audio_file:
            encoded_audio = base64.b64encode(audio_file.read()).decode('utf-8')
            return encoded_audio
    except Exception as e:
        print(f"Error encoding audio: {e}")
        return None

# def play_audio():
#     """Play the generated audio file (no longer needed for frontend playback)."""
#     output_path = current_app.config.get('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
#     playback_speech(output_path)

# # Load saved selections on module initialization
# try:
#     selections_file = os.path.join(
#         os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
#         'data', 'avatar_selections.json'
#     )
#     if os.path.exists(selections_file):
#         with open(selections_file, 'r') as f:
#             current_avatar_selections.update(json.load(f))
#             print(f"Loaded avatar selections: {current_avatar_selections}")
# except Exception as e:
#     print(f"Warning: Could not load saved selections: {e}")

# Initialize the models for the current language on application startup
def initialize_models_for_current_language():
    """
    Pre-load the models for the current language setting upon startup
    to reduce initial response time.
    """
    try:
        language = current_avatar_selections.get("language", "English")
        
        print(f"Pre-loading models for language: {language}")
        
        if language == "English":
            # Load English models
            get_llama()
            get_english_tts()
        
        print(f"Initial model loading complete. Loaded models: {loaded_models}")
    except Exception as e:
        print(f"Warning: Error during initial model loading: {e}")



def process_speech_modified(text, avatar_config=None):
    print(f'text =  {text}')
    # Use provided config or fallback to current selections
    config = avatar_config or current_avatar_selections
    language = config.get("language", "English")
    gender = config.get("gender", "Male")
    
    output_path = current_app.config.get('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
    
    try:
        # Process based on language
        if language == "English":
            # Generate response using Llama
            
            response_text = generate_llama_response(text, avatar_config=config)
            print(f'response_text {response_text}' )
            # Get TTS model
            model = get_english_tts()
            
            # Get appropriate speaker path based on avatar config
            speaker_path = get_speaker_path(avatar_config)
            
            # Convert response to speech
            english_tts_workflow(model, response_text, speaker_path, output_path)
        
        else:  # Malay language processing
            # Import Google Cloud Translation API
            from google.cloud import translate_v2 as translate
            
            try:
                # Initialize the Translation client
                translate_client = translate.Client()
                print(f'text = {text}' )
            
                # Translate user input from Malay to English
                translation = translate_client.translate(
                    text,
                    source_language='ms',
                    target_language='en'
                )
                translated_input = translation['translatedText']
                print(f'translated_input {translated_input}' )
                # Generate response using Llama (which works with English)
                english_response = generate_llama_response(translated_input, avatar_config=config)
                print(f'llama_response {english_response}')

                # Translate response back from English to Malay
                back_translation = translate_client.translate(
                    english_response,
                    source_language='en',
                    target_language='ms'
                )
                response_text = back_translation['translatedText']

                # Fix HTML entities in quotation marks
                response_text = response_text.replace('&quot;', '"')

                print(f'translated = {response_text}')
                    # Select speaker based on gender
                speaker_name = "Osman" if gender == "Male" else "Yasmin"
                
                # Run the Malay TTS subprocess with translated response
                tts_success = run_malay_tts(response_text, speaker_name, output_path)
                
                if not tts_success:
                    print("Warning: Malay TTS subprocess failed. Using fallback message.")
                    response_text = "Maaf, saya menghadapi masalah teknikal sekarang."
                    # Try again with a simpler message
                    run_malay_tts(response_text, speaker_name, output_path)
                    
            except Exception as translate_error:
                print(f"Translation error: {translate_error}")
                # Fallback to direct Malay response if translation fails
                response_text = "Maaf, terdapat masalah dengan perkhidmatan terjemahan."
                speaker_name = "Osman" if gender == "Male" else "Yasmin"
                run_malay_tts(response_text, speaker_name, output_path)
        
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
                speaker_name = "Osman" if gender == "Male" else "Yasmin"
                run_malay_tts(fallback_response, speaker_name, output_path)
            
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