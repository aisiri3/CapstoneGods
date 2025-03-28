"""
Highly optimized Malay TTS script with:
1. Model caching
2. INT8 quantization
3. JIT compilation
4. Batch processing for text chunks
"""
import inspect
import os
import argparse
import torch
import time
import numpy as np
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf

# Global model and tokenizer variables for caching
_model = None
_tokenizer = None

# Check for GPU availability
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
class JITParlerTTSWrapper(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
    
    def forward(self, input_ids, attention_mask, input_values, decoder_input_ids):
        return self.model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            input_values=input_values,
            decoder_input_ids=decoder_input_ids
        )

def get_tts_model(device=device, model_path="mesolitica/malay-parler-tts-mini-v1", use_half_precision=False, use_quantization=True, use_jit=True):
    """Initialize the Malay TTS model with advanced optimizations.
    
    Args:
        device: The device to load the model onto
        model_path: Path or Hugging Face model name
        use_half_precision: Whether to use FP16 for faster inference (only for CUDA)
        use_quantization: Whether to use INT8 quantization (for CPU)
        use_jit: Whether to use JIT compilation
        
    Returns:
        tuple: The model and tokenizer
    """
    global _model, _tokenizer
    
    # Return cached model if already loaded
    if _model is not None and _tokenizer is not None:
        print("Using cached model and tokenizer")
        return _model, _tokenizer
    
    print(f"Loading model from {model_path}...")
    start_time = time.time()
    
    # Download model to a local directory if not already downloaded
    local_model_dir = os.path.join(os.path.expanduser("~"), ".cache", "malay-tts")
    os.makedirs(local_model_dir, exist_ok=True)
    
    # Load model
    model = ParlerTTSForConditionalGeneration.from_pretrained(model_path)
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    print(inspect.getsource(model.forward))
    # Set to evaluation mode
    model.eval()
    
    # Apply optimizations based on device
    if device.type == "cuda":
        # Move to device first
        model = model.to(device)
        
        # Use half precision if on CUDA and enabled
        if use_half_precision:
            model = model.half()  # Convert to FP16 for faster inference
            
        # Enable CUDA optimizations
        torch.backends.cudnn.benchmark = True
    else:  # CPU optimizations
        # Quantization for CPU (INT8) - significant speed improvement on CPU
        if use_quantization:
            print("Applying INT8 quantization...")
            # Configure quantization
            model.qconfig = torch.quantization.get_default_qconfig('fbgemm')
            # Prepare for quantization
            torch.quantization.prepare(model, inplace=True)
            # Quantize the model to INT8
            model = torch.quantization.convert(model, inplace=True)
        
        # Move to device after quantization
        model = model.to(device)
        
    # Apply JIT compilation for further speed improvement
    if use_jit:
        print("Applying JIT compilation...")
        try:
            # Create sample inputs for tracing
            sample_text = "Sample text for tracing."
            sample_input = tokenizer(sample_text, return_tensors="pt").to(device)
            
            # Create and trace the wrapper
            wrapper_model = JITParlerTTSWrapper(model)
            traced_model = torch.jit.script(wrapper_model)



            model = traced_model
            print("JIT compilation successful")
        except Exception as e:
            print(f"JIT compilation failed: {e}. Continuing with standard model.")
    # Cache the model and tokenizer
    _model = model
    _tokenizer = tokenizer
    
    load_time = time.time() - start_time
    print(f"Model loaded in {load_time:.2f} seconds with optimizations")
    
    return model, tokenizer

def batch_process_chunks(model, tokenizer, speaker_input_ids, chunks, device, batch_size=4):
    """Process text chunks in batches for faster inference.
    
    Args:
        model: The TTS model
        tokenizer: The tokenizer
        speaker_input_ids: Pre-tokenized speaker description
        chunks: List of text chunks to process
        device: The compute device
        batch_size: Number of chunks to process simultaneously
        
    Returns:
        list: List of audio arrays for each chunk
    """
    all_audio_arrays = []
    
    # Process chunks in batches
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1} with {len(batch_chunks)} chunks")
        
        # Tokenize all chunks in the batch
        batch_inputs = tokenizer(batch_chunks, padding=True, return_tensors="pt").to(device)
        
        # Prepare speaker inputs for the batch
        batch_speaker_input_ids = speaker_input_ids.input_ids.repeat(len(batch_chunks), 1)
        batch_speaker_attention_mask = speaker_input_ids.attention_mask.repeat(len(batch_chunks), 1)
        
        # Generate audio for the batch
        with torch.no_grad():
            batch_generations = model.generate(
                input_ids=batch_speaker_input_ids,
                attention_mask=batch_speaker_attention_mask,
                prompt_input_ids=batch_inputs.input_ids,
                prompt_attention_mask=batch_inputs.attention_mask,
            )
        
        # Extract individual audio arrays
        for audio_arr in batch_generations:
            all_audio_arrays.append(audio_arr.cpu().numpy().squeeze())
        
        # Free up memory
        if device.type == "cuda":
            torch.cuda.empty_cache()
    
    return all_audio_arrays

def tts_workflow(model, tokenizer, input_text, speaker, output_path, chunk_size=150, batch_size=4):
    """Convert Malay text to speech using the TTS model with optimized processing.
    
    Args:
        model: The ParlerTTS model
        tokenizer: The tokenizer for the model
        input_text (str): Text to convert to speech
        speaker (str): Speaker identity ('Osman' for male, 'Yasmin' for female)
        output_path (str): Path to save the audio file
        chunk_size (int): Maximum chunk size for processing long text
        batch_size (int): Number of chunks to process in one batch
        
    Returns:
        str: Path to the generated audio file
    """
    try:
        abs_output_path = os.path.abspath(output_path)
        output_dir = os.path.dirname(abs_output_path)
        os.makedirs(output_dir, exist_ok=True)
        
        # Define speaker characteristics
        if speaker == "Osman":
            description = "Osman's voice, delivers a deep and steady speech with a confident tone."
        else:  # Yasmin
            description = "Yasmin's voice, delivers a clear and melodious speech with a pleasant tone."
        
        # Pre-tokenize the speaker description for reuse
        speaker_input_ids = tokenizer(description, return_tensors="pt").to(device)
        
        # Handle short text directly
        if len(input_text) <= chunk_size:
            print(f"Processing text ({len(input_text)} chars) in single chunk")
            with torch.no_grad():
                generation = model.generate(
                    input_ids=speaker_input_ids.input_ids,
                    attention_mask=speaker_input_ids.attention_mask,
                    prompt_input_ids=tokenizer(input_text, return_tensors="pt").input_ids.to(device),
                    prompt_attention_mask=tokenizer(input_text, return_tensors="pt").attention_mask.to(device),
                )
            
            # Save the audio
            audio_arr = generation.cpu().numpy().squeeze()
            if audio_arr.dtype == 'float16':
                audio_arr = audio_arr.astype('float32')
            sf.write(abs_output_path, audio_arr, 44100)
            return abs_output_path
        
        # For longer text, break into chunks at sentence boundaries
        print(f"Text is long ({len(input_text)} chars), processing in chunks with batch size {batch_size}")
        
        # Split text into sentences and chunks
        sentences = split_into_sentences(input_text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= chunk_size:
                current_chunk += sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = sentence
        
        # Add the last chunk if it contains anything
        if current_chunk:
            chunks.append(current_chunk)
        
        print(f"Split text into {len(chunks)} chunks")
        
        # Process chunks in batches
        start_time = time.time()
        audio_arrays = batch_process_chunks(model, tokenizer, speaker_input_ids, chunks, device, batch_size)
        batch_time = time.time() - start_time
        print(f"Batch processing completed in {batch_time:.2f} seconds")
        
        # Save each audio array to a temporary file
        chunk_audio_files = []
        for i, audio_arr in enumerate(audio_arrays):
            chunk_output = f"{abs_output_path}.chunk{i}.wav"
            # Ensure float32 format
            if audio_arr.dtype == 'float16':
                audio_arr = audio_arr.astype('float32')
            sf.write(chunk_output, audio_arr, 44100)
            chunk_audio_files.append(chunk_output)
        
        # Concatenate audio files
        concatenate_audio_files(chunk_audio_files, abs_output_path)
        
        # Clean up temporary chunk files
        for chunk_file in chunk_audio_files:
            if os.path.exists(chunk_file):
                os.remove(chunk_file)
        
        return abs_output_path
    
    except Exception as e:
        print(f"Error in TTS workflow: {e}")
        import traceback
        traceback.print_exc()
        
        # Try fallback with a simple message
        try:
            fallback_text = "Maaf, terdapat ralat sistem."
            with torch.no_grad():
                generation = model.generate(
                    input_ids=speaker_input_ids.input_ids,
                    attention_mask=speaker_input_ids.attention_mask,
                    prompt_input_ids=tokenizer(fallback_text, return_tensors="pt").input_ids.to(device),
                    prompt_attention_mask=tokenizer(fallback_text, return_tensors="pt").attention_mask.to(device),
                )
            
            audio_arr = generation.cpu().numpy().squeeze()
            if audio_arr.dtype == 'float16':
                audio_arr = audio_arr.astype('float32')
            sf.write(abs_output_path, audio_arr, 44100)
            return abs_output_path
        except:
            raise

def split_into_sentences(text):
    """Split text into sentences at punctuation marks."""
    # Simple sentence splitting at common punctuation marks
    for sep in ['. ', '! ', '? ', '.\n', '!\n', '?\n']:
        text = text.replace(sep, sep + '|SPLIT|')
    
    sentences = text.split('|SPLIT|')
    return [s for s in sentences if s.strip()]

def concatenate_audio_files(input_files, output_file):
    """Concatenate multiple audio files into one."""
    print(f"Concatenating {len(input_files)} audio chunks")
    
    # Read all audio files
    segments = []
    sample_rate = None
    
    for file_path in input_files:
        data, rate = sf.read(file_path)
        if sample_rate is None:
            sample_rate = rate
        segments.append(data)
    
    # Concatenate audio data
    concatenated = np.concatenate(segments)
    
    # Write to output file
    sf.write(output_file, concatenated, sample_rate)
    print(f"Concatenated audio saved to {output_file}")
    
    return output_file

def serve_tts_model():
    """Load model once at startup for faster inference."""
    print("Pre-loading TTS model with optimizations for faster inference...")
    get_tts_model(use_quantization=True, use_jit=True)
    print("Model pre-loaded and ready for inference")

def main():
    """Main function with optimizations."""
    parser = argparse.ArgumentParser(description="Optimized Malay Text-to-Speech Converter")
    
    # Add command-line arguments
    parser.add_argument("--text", type=str, help="Text to convert to speech")
    parser.add_argument("--text-file", type=str, help="File containing text to convert to speech")
    parser.add_argument("--speaker", type=str, default="Osman", choices=["Osman", "Yasmin"], 
                        help="Speaker voice to use")
    parser.add_argument("--output", type=str, required=True, help="Path to save the output audio file")
    parser.add_argument("--chunk-size", type=int, default=150, help="Maximum characters per chunk")
    parser.add_argument("--batch-size", type=int, default=4, help="Number of chunks to process in one batch")
    parser.add_argument("--use-half-precision", action="store_true", help="Enable half precision (CUDA only)")
    parser.add_argument("--use-quantization", action="store_true", default=True, help="Enable INT8 quantization (CPU only)")
    parser.add_argument("--use-jit", action="store_true", default=True, help="Enable JIT compilation for speedup")
    
    args = parser.parse_args()
    
    # Get input text
    if args.text_file:
        try:
            args.text_file = os.path.abspath(args.text_file)
            with open(args.text_file, "r", encoding="utf-8") as f:
                input_text = f.read().strip()
        except Exception as e:
            print(f"Error reading text file: {e}")
            return False
    elif args.text:
        input_text = args.text
    else:
        print("Error: Either --text or --text-file must be provided")
        return False
    
    try:
        start_time = time.time()
        
        # Load model with optimizations
        model, tokenizer = get_tts_model(
            use_half_precision=args.use_half_precision,
            use_quantization=args.use_quantization,
            use_jit=args.use_jit
        )
        
        # Generate speech with batch processing
        output_path = tts_workflow(
            model, 
            tokenizer, 
            input_text, 
            args.speaker, 
            args.output, 
            chunk_size=args.chunk_size,
            batch_size=args.batch_size
        )
        
        total_time = time.time() - start_time
        print(f"Total processing time: {total_time:.2f} seconds")
        
        return True
    except Exception as e:
        print(f"Error in Malay TTS processing: {e}")
        import traceback
        traceback.print_exc()
        return False

# Pre-load the model when imported as a module
if __name__ != "__main__":
    serve_tts_model()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)