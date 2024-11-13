import transformers
from transformers import pipeline
import torch
import accelerate
import os

from huggingface_hub import login
from transformers import AutoTokenizer

login("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")

model_id = "meta-llama/Llama-2-7b-chat-hf"
tokenizer = AutoTokenizer.from_pretrained(model_id, use_auth_token=True)

llama_pipeline = pipeline(task="text-generation", model="meta-llama/Llama-2-7b-chat-hf", torch_dtype=torch.float16, device_map='auto')

import time

def get_llama_response(prompt: str) -> str:
    start_time = time.time()

    sequences = llama_pipeline(
        prompt,
        do_sample=True,
        top_k=10,
        num_return_sequences=1,
        max_length=512,
        temperature=0.7,
        torch_dtype=torch.float16,
        device="cpu"
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

    return answer_text


output_dir = "/Users/ramita/Documents/GitHub/CapstoneGods/TTT output"  # Replace with your desired path

os.makedirs(output_dir, exist_ok=True)

prompts = ["What colour is an apple"]

responses = {}

for i, prompt in enumerate(prompts, 1):
    response = get_llama_response(prompt)  
    
    variable_name = f"response_{i}"
    responses[variable_name] = response 
 
    print(f"\n{variable_name} (Prompt {i}): {response}\n")

    filename = os.path.join(output_dir, f"{variable_name}.txt")
    
    with open(filename, "w") as file:
        file.write(response) 
    
    print(f"Saved raw answer for Prompt {i} to {filename}")
