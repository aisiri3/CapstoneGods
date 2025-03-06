"""
English Text-to-Text Implementation.
"""
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from huggingface_hub import login

def login_huggingface(huggingface_API):
    """Login to Hugging Face Hub."""
    login(huggingface_API)

def init_model(model_id="meta-llama/Llama-2-7b-chat-hf"):
    """Initialize the text-to-text model."""
    print("Initializing model...")
    tokenizer = AutoTokenizer.from_pretrained(model_id, use_auth_token=True)
    
    llama_pipeline = pipeline(
        task="text-generation",
        model=model_id,
        torch_dtype=torch.float16,
        device_map='auto'
    )
    
    print("Model initialized successfully!")
    return llama_pipeline

# def init_model(model_id="meta-llama/Llama-2-7b-chat-hf"):
#     """Initialize the text-to-text model (disabled for testing)."""
#     print("Initializing model SKIPPED for testing...")
    
#     # Return a dummy object instead of the actual model
#     class DummyPipeline:
#         def __call__(self, *args, **kwargs):
#             return [{"generated_text": f"[TEST MODE] This is a dummy response. Original prompt: {args[0]}"}]
    
#     print("Dummy model initialized successfully!")
#     return DummyPipeline()

def get_response(llama_pipeline, prompt):
    """Get a response from the model."""
    start_time = time.time()

    sequences = llama_pipeline(
        prompt,
        do_sample=True,
        top_k=10,
        num_return_sequences=1,
        max_length=512,
        temperature=0.7,
    )

    end_time = time.time()
    elapsed_time = end_time - start_time

    full_response = sequences[0]["generated_text"]

    if "Answer:" in full_response:
        answer_text = full_response.split("Answer:", 1)[1].strip()
    else:
        answer_text = full_response.replace(prompt, "").strip()

    print(f"\nRaw Answer: {answer_text}")
    print(f"\nResponse generated in {elapsed_time:.2f} seconds")

    return answer_text, elapsed_time

# def get_response(llama_pipeline, prompt):
#     response_text = prompt
#     print("Note: Llama model is disabled for testing.")
#     return response_text, 0.0

def get_model():
    """Get the model with memory optimization for limited resources."""
    global llama_pipeline
    try:
        if 'llama_pipeline' not in globals() or llama_pipeline is None:
            print("Initializing Llama pipeline with memory optimizations...")
            
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
                "meta-llama/Llama-2-7b-chat-hf",
                device_map="auto",  # Automatically decide what goes where
                quantization_config=quantization_config,
                offload_folder="offload",  # Folder for disk offloading
                offload_state_dict=True,  # Enable offloading
                low_cpu_mem_usage=True
            )
            
            tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-chat-hf")
            
            llama_pipeline = pipeline(
                task="text-generation",
                model=model,
                tokenizer=tokenizer,
                max_length=512
            )
            print("Llama pipeline initialized with memory optimization!")
        return llama_pipeline
    except Exception as e:
        print(f"Error during Llama pipeline initialization: {e}")
        import traceback
        traceback.print_exc()
        raise