"""
English Text-to-Text Implementation.
"""
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from huggingface_hub import login
from transformers.utils.logging import disable_progress_bar
disable_progress_bar()

def login_huggingface(huggingface_API):
    """Login to Hugging Face Hub."""
    login(huggingface_API)


def get_model(model_id="meta-llama/Llama-2-7b-chat-hf"):
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

if __name__ == "__main__":
    print("hey Im running llama")
    llama_pipeline = get_model()
    prompt = "Hi there! What is the day today in Singapore?"
    response = get_response(llama_pipeline, prompt)
    print(response)