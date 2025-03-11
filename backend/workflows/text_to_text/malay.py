"""
Malay Text-to-Text Implementation.
"""
import time
import torch
import nltk
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from huggingface_hub import login

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
        if 'mallam_pipeline' not in globals() or mallam_pipeline is None:
            print("Initializing MaLLaM pipeline with memory optimizations...")
            
            # Use BitsAndBytes for quantization
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
                device_map="auto",  # Automatically decide what goes where
                quantization_config=quantization_config,
                offload_folder="offload_malay",  # Folder for disk offloading
                offload_state_dict=True,  # Enable offloading
                low_cpu_mem_usage=True
            )
            
            tokenizer = AutoTokenizer.from_pretrained("mesolitica/mallam-5B-4096")
            
            mallam_pipeline = pipeline(
                task="text-generation",
                model=model,
                tokenizer=tokenizer,
                max_length=200
            )
            print("MaLLaM pipeline initialized with memory optimization!")
        return mallam_pipeline
    except Exception as e:
        print(f"Error during MaLLaM pipeline initialization: {e}")
        import traceback
        traceback.print_exc()
        raise
