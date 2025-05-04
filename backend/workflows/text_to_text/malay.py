"""
Malay Text-to-Text Implementation with Windows-friendly approach.
"""
import time
import torch
import nltk
import os
import platform
import re
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from huggingface_hub import login

from transformers.utils.logging import disable_progress_bar
disable_progress_bar()

# Global variable to hold the pipeline
mallam_pipeline = None

def login_huggingface(huggingface_API):
    """Login to Hugging Face Hub."""
    login(huggingface_API)

def init_model(model_id="mesolitica/mallam-5B-4096"):
    """Initialize the text-to-text model."""
    print("Initializing Malay LLM model...")
    
    # Ensure NLTK tokenizer is available
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')
    
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    
    mallam_pipeline = pipeline(
        task="text-generation",
        model=model_id,
        torch_dtype=torch.float16,
        device_map='auto'
    )
    
    print("Malay LLM model initialized successfully!")
    return mallam_pipeline

def get_response(mallam_pipeline, prompt):
    """Get a response from the model."""
    start_time = time.time()
    sequences = mallam_pipeline(
        prompt,
        do_sample=True,
        top_k=10,
        num_return_sequences=1,
        max_length=200,
        temperature=0.7,
        truncation=True
    )
    end_time = time.time()
    elapsed_time = end_time - start_time
    full_response = sequences[0]["generated_text"]
    
    # Similar to your English implementation, extract answer text
    if "Answer:" in full_response:
        answer_text = full_response.split("Answer:", 1)[1].strip()
    else:
        answer_text = full_response.replace(prompt, "").strip()
    
    print(f"\nRaw Answer: {answer_text}")
    print(f"\nResponse generated in {elapsed_time:.2f} seconds")
    return answer_text, elapsed_time

def get_model():
    """Get the model with memory optimization for limited resources."""
    global mallam_pipeline
    try:
        if mallam_pipeline is None:
            print("Initializing MaLLaM pipeline...")
            
            # Check if running on Windows
            is_windows = platform.system() == "Windows"
            
            # Simpler initialization approach for Windows
            if is_windows:
                print("Running on Windows, using simplified model loading")
                # Use a simpler approach without BitsAndBytes on Windows
                model = AutoModelForCausalLM.from_pretrained(
                    "mesolitica/mallam-5B-4096",
                    device_map="auto",
                    torch_dtype=torch.float16,
                    low_cpu_mem_usage=True
                )
            else:
                # Use BitsAndBytes for quantization on non-Windows platforms
                from transformers import BitsAndBytesConfig
                
                # 4-bit quantization config
                quantization_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_use_double_quant=True,
                )
                
                # Load with disk offloading and quantization
                model = AutoModelForCausalLM.from_pretrained(
                    "mesolitica/mallam-5B-4096",
                    device_map="auto",
                    quantization_config=quantization_config,
                    offload_folder="offload_malay",
                    offload_state_dict=True,
                    low_cpu_mem_usage=True
                )
            
            tokenizer = AutoTokenizer.from_pretrained("mesolitica/mallam-5B-4096")
            
            mallam_pipeline = pipeline(
                task="text-generation",
                model=model,
                tokenizer=tokenizer,
                max_length=200
            )
            print("MaLLaM pipeline initialized!")
        return mallam_pipeline
    except Exception as e:
        print(f"Error during MaLLaM pipeline initialization: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to even simpler approach if first attempt fails
        try:
            print("Attempting fallback initialization...")
            if mallam_pipeline is None:
                # Simplest approach - use pipeline without custom model loading
                mallam_pipeline = pipeline(
                    "text-generation",
                    model="mesolitica/mallam-5B-4096",
                    max_length=200
                )
                print("Fallback MaLLaM pipeline initialized!")
            return mallam_pipeline
        except Exception as e2:
            print(f"Fallback initialization also failed: {e2}")
            traceback.print_exc()
            raise

def truncate_malay_text(text, max_length=150):
    """
    Intelligently truncate Malay text to a maximum length while preserving complete sentences.
    
    Args:
        text (str): The text to truncate
        max_length (int): Maximum desired length
        
    Returns:
        str: Truncated text ending with a complete sentence when possible
    """
    # Clean the text first
    text = text.replace("\\n", "\n")
    text = re.sub(r'\n{3,}', '\n\n', text)  # Remove excessive newlines
    text = re.sub(r'\\[a-zA-Z]', ' ', text)  # Remove escape sequences
    text = re.sub(r' {2,}', ' ', text)  # Fix spacing issues
    
    # If text is already shorter than max_length, return cleaned version
    if len(text) <= max_length:
        return text.strip()
        
    # Try to find the last sentence ending within the max length
    # Malay sentence endings can be periods, exclamation marks, or question marks
    last_punctuation_match = re.search(r'([.!?])[^.!?]*$', text[:max_length])
    
    if last_punctuation_match:
        # Found a sentence ending, truncate there
        last_punctuation_index = last_punctuation_match.start(1)
        truncated = text[:last_punctuation_index + 1]  # Include the punctuation
    else:
        # Look for other natural break points like commas or common Malay conjunctions
        conjunction_match = re.search(r'(,|\sdan|\satau|\stetapi|\skerana|\smaka|\slalu|\sjika|\sapabila)[^,.!?]*$', text[:max_length])
        
        if conjunction_match:
            # Found a conjunction or comma, truncate there
            conjunction_index = conjunction_match.start(1)
            truncated = text[:conjunction_index]
            # Add ellipsis to show truncation
            truncated += "..."
        else:
            # No good break point found, truncate at max_length
            truncated = text[:max_length]
            # Add ellipsis to show truncation
            truncated += "..."
    
    # Clean up any trailing whitespace
    return truncated.strip()

# Direct use function
def generate_mallam_response(text):
    """Generate a response using the Mallam model - direct use from services.py"""
    try:
        model = get_model()
        
        # Limit input length to avoid unnecessarily long context
        input_text = text[:500] if len(text) > 500 else text
        
        # Measure response time
        start_time = time.time()
        
        # Generate response using the Mallam pipeline
        # Set max_length to limit token generation
        sequences = model(
            input_text,
            do_sample=True,
            top_k=10,
            num_return_sequences=1,
            max_length=200,  # Limit token generation
            temperature=0.7,
        )
        
        end_time = time.time()
        elapsed_time = end_time - start_time
        
        # Extract the response
        full_response = sequences[0]["generated_text"]
        
        # Similar to the implementation in malay.py
        if "Answer:" in full_response:
            response = full_response.split("Answer:", 1)[1].strip()
        else:
            response = full_response.replace(input_text, "").strip()
        
        # Truncate the response to reduce latency
        max_response_length = 150  # Character limit
        truncated_response = truncate_malay_text(response, max_response_length)
        
        print(f"Mallam response generated in {elapsed_time:.2f} seconds")
        print(f"Original length: {len(response)}, Truncated length: {len(truncated_response)}")
        print(f"Truncated response: {truncated_response}")
        
        return truncated_response
        
    except Exception as e:
        print(f"Error generating Mallam response: {e}")
        import traceback
        traceback.print_exc()
        # Return a simple error message as fallback
        return "Maaf, saya menghadapi masalah teknikal sekarang."
