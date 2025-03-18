"""
English Text-to-Text Implementation.
"""
import sys
import os
import re
import time
from flask import Flask
from flask_mysqldb import MySQL
import torch
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import time
import re
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
    tokenizer = AutoTokenizer.from_pretrained(model_id, token=True)
    
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

def remove_emojis(text):
    """Remove emojis from a string."""
    emoji_pattern = re.compile(
        r"[^\w\s,]"  # Match all non-word characters except whitespace and commas
    )
    return re.sub(emoji_pattern, '', text)


# def generate_llama_response(text):
#     """Generate a response using the Llama model."""
#     try:
#         model = get_model()
        
#         # Measure response time
#         start_time = time.time()
        
#         # Generate response
#         sequences = model(
#             text,
#             do_sample=True,
#             top_k=10,
#             num_return_sequences=1,
#             max_length=512,
#             truncation=True,
#             temperature=0.7,
#         )
        
#         end_time = time.time()
#         elapsed_time = end_time - start_time
        
#         # Extract and clean the response
#         response = sequences[0]["generated_text"]
        
#         print(f"Llama response generated in {elapsed_time:.2f} seconds: {response}")
#         return response
        
#     except Exception as e:
#         print(f"Error generating Llama response: {e}")
#         # Return the original text with an error message as fallback
#         return f"I couldn't process that properly. Here's what you said: {text}"
        
#     except Exception as e:
#         print(f"Error generating Llama response: {e}")
#         # Return the original text with an error message as fallback
#         return f"I couldn't process that properly. Here's what you said: {text}"
    
def generate_response(llama_pipeline, prompt):
    """Generate a response using the Llama model."""
    persona_intro = (
        "You are a language learning assistant helping English speakers to learn and improve their English. "
        "You provide explanations, examples, and suggestions to help users speak and understand English better. "
        "You are friendly, patient, and encouraging in your responses. Keep your responses very short and sweet and concise. Keep to maximum of 3 lines."
    )

    modified_prompt = persona_intro + "\n" + prompt
    start_time = time.time()

    sequences = llama_pipeline(
        modified_prompt,
        do_sample=True,
        top_k=10,
        num_return_sequences=1,
        max_length=512,
        truncation=True,
        temperature=0.7,
    )

    end_time = time.time()
    elapsed_time = end_time - start_time  # Calculate elapsed time

    full_response = sequences[0]["generated_text"]

    # Strip persona intro, prompt, and "A: " anywhere in the response
    answer_text = full_response.strip()

    # Replace persona intro anywhere in the response
    answer_text = answer_text.replace(persona_intro, "").strip()

    # Replace prompt anywhere in the response
    answer_text = answer_text.replace(prompt, "").strip()

    # Replace "A: " anywhere in the response
    answer_text = answer_text.replace("A: ", "").strip()

    # Remove emojis from the response
    answer_text = remove_emojis(answer_text)

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