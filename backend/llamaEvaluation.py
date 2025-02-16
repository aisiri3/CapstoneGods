## Removed database connection

import time
import torch
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
from sentence_transformers import SentenceTransformer, util

# Ensure GPU usage if available
device = 0 if torch.cuda.is_available() else -1

# Load Llama model and tokenizer
model_id = "meta-llama/Llama-2-7b-chat-hf"
tokenizer = AutoTokenizer.from_pretrained(model_id)

# Set up the Llama pipeline
llama_pipeline = pipeline(
    task="text-generation",
    model=model_id,
    torch_dtype=torch.float16,
    device=device
)

# Load the sentence transformer model for similarity calculation
similarity_model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_response(prompt: str) -> tuple:
    """Generate a response using the Llama model"""
    persona_intro = (
        "You are a language learning assistant helping English speakers to learn and improve their English. "
        "You provide explanations, examples, and suggestions to help users speak and understand English better. "
        "You are friendly, patient, and encouraging in your responses. Keep responses short and concise."
    )

    modified_prompt = persona_intro + "\n" + prompt
    start_time = time.time()

    sequences = llama_pipeline(
        modified_prompt,
        do_sample=True,
        top_k=10,
        num_return_sequences=1,
        max_length=512,
        temperature=0.7,
    )

    elapsed_time = time.time() - start_time  # Calculate elapsed time
    full_response = sequences[0]["generated_text"]

    # Clean response
    answer_text = full_response.replace(persona_intro, "").strip().replace(prompt, "").strip().replace("A: ", "").strip()

    return answer_text, elapsed_time

def calculate_similarity(sample_response: str, generated_response: str) -> float:
    """Calculate similarity score between sample response and generated response"""
    
    sample_embedding = similarity_model.encode(sample_response, convert_to_tensor=True)
    response_embedding = similarity_model.encode(generated_response, convert_to_tensor=True)
    similarity = util.pytorch_cos_sim(sample_embedding, response_embedding)
    return similarity.item()
