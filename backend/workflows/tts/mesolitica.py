"""
Malay TTS script designed to run as a standalone process.
This script is called by services.py through a subprocess.
"""
import os
import argparse
import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf

# Check for GPU availability
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_tts_model(device=device):
    """Initialize the Malay TTS model."""
    model = ParlerTTSForConditionalGeneration.from_pretrained("mesolitica/malay-parler-tts-mini-v1").to(device)
    tokenizer = AutoTokenizer.from_pretrained("mesolitica/malay-parler-tts-mini-v1")
    return model, tokenizer

def tts_workflow(model, tokenizer, input_text, speaker, output_path):
    """Convert Malay text to speech using the TTS model.
    
    Args:
        model: The ParlerTTS model
        tokenizer: The tokenizer for the model
        input_text (str): Text to convert to speech
        speaker (str): Speaker identity ('Osman' for male, 'Yasmin' for female)
        output_path (str): Path to save the audio file
    
    Returns:
        str: Path to the generated audio file
    """
    try:
        # Convert to absolute path
        abs_output_path = os.path.abspath(output_path)
        print(f"Output path (absolute): {abs_output_path}")
        
        # Ensure output directory exists
        output_dir = os.path.dirname(abs_output_path)
        os.makedirs(output_dir, exist_ok=True)
        print(f"Created output directory: {output_dir}")
        
        # Define speaker characteristics
        if speaker == "Osman":
            description = "Osman's voice, delivers a deep and steady speech with a confident tone. The recording is of high quality, with the speaker's voice sounding clear and well-articulated."
        else:  # Yasmin
            description = "Yasmin's voice, delivers a clear and melodious speech with a pleasant tone. The recording is of high quality, with the speaker's voice sounding articulate and natural."
        
        print(f"Using speaker description for {speaker}")
        
        try:
            # Tokenize input
            print("Tokenizing speaker description...")
            input_ids = tokenizer(description, return_tensors="pt").to(device)
            
            print("Tokenizing input text...")
            prompt_input_ids = tokenizer(input_text, return_tensors="pt").to(device)
            
            print("Starting speech generation...")
            # Generate speech
            generation = model.generate(
                input_ids=input_ids.input_ids,
                attention_mask=input_ids.attention_mask,
                prompt_input_ids=prompt_input_ids.input_ids,
                prompt_attention_mask=prompt_input_ids.attention_mask,
            )
            print("Speech generation completed")
            
            # Convert to NumPy and save audio
            print("Converting to CPU for audio processing...")
            audio_arr = generation.cpu()
            
            print(f"Saving audio to: {abs_output_path}")
            sf.write(abs_output_path, audio_arr.numpy().squeeze(), 44100)
            
            # Verify file was created
            if os.path.exists(abs_output_path):
                print(f"Audio saved successfully at {abs_output_path}")
            else:
                print(f"ERROR: Failed to save audio file at {abs_output_path}")
                
            return abs_output_path
            
        except Exception as inner_e:
            print(f"Error during TTS processing: {inner_e}")
            import traceback
            traceback.print_exc()
            
            # Try fallback with a simpler message if original fails
            if len(input_text) > 50:
                print("Attempting fallback with shorter text...")
                fallback_text = "Maaf, terdapat ralat sistem."
                
                input_ids = tokenizer(description, return_tensors="pt").to(device)
                prompt_input_ids = tokenizer(fallback_text, return_tensors="pt").to(device)
                
                generation = model.generate(
                    input_ids=input_ids.input_ids,
                    attention_mask=input_ids.attention_mask,
                    prompt_input_ids=prompt_input_ids.input_ids,
                    prompt_attention_mask=prompt_input_ids.attention_mask,
                )
                
                audio_arr = generation.cpu()
                sf.write(abs_output_path, audio_arr.numpy().squeeze(), 44100)
                print(f"Fallback audio saved as {abs_output_path}")
                return abs_output_path
            else:
                raise
                
    except Exception as e:
        print(f"Critical error in TTS workflow: {e}")
        import traceback
        traceback.print_exc()
        raise

def main():
    """Main function to parse arguments and run the TTS process."""
    parser = argparse.ArgumentParser(description="Malay Text-to-Speech Converter")
    
    # Add command-line arguments
    parser.add_argument("--text", type=str, help="Text to convert to speech")
    parser.add_argument("--text-file", type=str, help="File containing text to convert to speech")
    parser.add_argument("--speaker", type=str, default="Osman", choices=["Osman", "Yasmin"], 
                        help="Speaker voice to use (Osman for male, Yasmin for female)")
    parser.add_argument("--output", type=str, required=True, help="Path to save the output audio file")
    
    args = parser.parse_args()
    
    # Print all arguments for debugging
    print(f"Arguments received: {vars(args)}")
    
    # Convert paths to absolute paths
    if args.text_file:
        args.text_file = os.path.abspath(args.text_file)
        print(f"Text file (absolute): {args.text_file}")
        
        # Check if file exists
        if not os.path.exists(args.text_file):
            print(f"ERROR: Text file does not exist: {args.text_file}")
            return False
    
    args.output = os.path.abspath(args.output)
    print(f"Output path (absolute): {args.output}")
    
    # Ensure output directory exists
    output_dir = os.path.dirname(args.output)
    os.makedirs(output_dir, exist_ok=True)
    
    # Get text either from direct input or from file
    if args.text_file:
        try:
            print(f"Reading text from file: {args.text_file}")
            with open(args.text_file, "r", encoding="utf-8") as f:
                input_text = f.read().strip()
                print(f"Text read from file: '{input_text[:50]}...'")
        except Exception as e:
            print(f"Error reading text file: {e}")
            import traceback
            traceback.print_exc()
            return False
    elif args.text:
        input_text = args.text
        print(f"Using direct text input: '{input_text[:50]}...'")
    else:
        print("Error: Either --text or --text-file must be provided")
        return False
    
    try:
        print(f"Current directory: {os.getcwd()}")
        print(f"Initializing Malay TTS with speaker: {args.speaker}")
        
        # Check if CUDA is available
        print(f"CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"CUDA device count: {torch.cuda.device_count()}")
            print(f"Current CUDA device: {torch.cuda.current_device()}")
            print(f"CUDA device name: {torch.cuda.get_device_name(0)}")
        
        # Load the model
        model, tokenizer = get_tts_model()
        print("Model and tokenizer loaded successfully")
        
        print(f"Generating speech for text: '{input_text[:50]}...'")
        output_path = tts_workflow(model, tokenizer, input_text, args.speaker, args.output)
        
        # Verify output file was created
        if os.path.exists(output_path):
            print(f"Success: Output file exists at {output_path}")
        else:
            print(f"WARNING: Output file not found at expected path: {output_path}")
            
        print(f"Speech generation complete. Output saved to: {output_path}")
        return True
    except Exception as e:
        print(f"Error in Malay TTS processing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    # Exit with appropriate status code
    exit(0 if success else 1)