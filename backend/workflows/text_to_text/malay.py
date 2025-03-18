"""
Malay Text-to-Text Implementation with Windows-friendly approach.
"""
import time
import torch
import nltk
import os
import platform
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
                # # Use BitsAndBytes for quantization on non-Windows platforms
                # from transformers import BitsAndBytesConfig
                
                # # 4-bit quantization config
                # quantization_config = BitsAndBytesConfig(
                #     load_in_4bit=True,
                #     bnb_4bit_compute_dtype=torch.float16,
                #     bnb_4bit_quant_type="nf4",
                #     bnb_4bit_use_double_quant=True,
                # )
                
                # # Load with disk offloading and quantization
                # model = AutoModelForCausalLM.from_pretrained(
                #     "mesolitica/mallam-5B-4096",
                #     device_map="auto",
                #     quantization_config=quantization_config,
                #     offload_folder="offload_malay",
                #     offload_state_dict=True,
                #     low_cpu_mem_usage=True
                # )

                print("NOT Running on Windows, using simplified model loading")
                # Use a simpler approach without BitsAndBytes on Windows
                model = AutoModelForCausalLM.from_pretrained(
                    "mesolitica/mallam-5B-4096",
                    device_map="auto",
                    torch_dtype=torch.float16,
                    low_cpu_mem_usage=True
                )
            
            tokenizer = AutoTokenizer.from_pretrained("mesolitica/mallam-5B-4096")
            
            mallam_pipeline = pipeline(
                task="text-generation",
                model=model,
                tokenizer=tokenizer,
                max_length=200, 
                truncation=True
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

# Direct use function
def generate_mallam_response(text):
    """Generate a response using the Mallam model - direct use from services.py"""
    try:
        model = get_model()
        
        # Measure response time
        start_time = time.time()
        
        # Generate response using the Mallam pipeline
        sequences = model(
            text,
            do_sample=True,
            top_k=10,
            num_return_sequences=1,
            max_length=200,
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
            response = full_response.replace(text, "").strip()
        
        print(f"Mallam response generated in {elapsed_time:.2f} seconds: {response}")
        return response
        
    except Exception as e:
        print(f"Error generating Mallam response: {e}")
        # Return the original text with an error message as fallback
        return f"Saya tidak dapat memproses itu dengan baik. Ini adalah apa yang anda katakan: {text}"

# Just for testing
if __name__ == "__main__":
    print("in main!")

    pipeline = get_model()
    prompt = "hari ini hari apa?"
    response = generate_mallam_response(prompt)
    print(f"\nPrompt: {prompt}")
    print(f"Response: {response}")
    print("Malay Text-to-Text conversion completed!")