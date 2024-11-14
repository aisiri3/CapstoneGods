import transformers
from transformers import pipeline
import torch
import accelerate
from transformers import AutoTokenizer
import time
from huggingface_hub import login
import os

def login_huggingface(huggingface_API):

    login(huggingface_API)


def init_ttt_model():
    print("init!!!!!!!!")
    model_id = "meta-llama/Llama-2-7b-chat-hf"
    tokenizer = AutoTokenizer.from_pretrained(model_id,use_auth_token=True)
    print("tokenizer !!!!!!!!!!")

    llama_pipeline = pipeline(task="text-generation",model="meta-llama/Llama-2-7b-chat-hf",torch_dtype=torch.float16,device_map='auto')
    print("llama pipeline !!!!!!!!!!!!!")

    return llama_pipeline


def get_llama_response(llama_pipeline, prompt: str) -> None:
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
    elapsed_time = end_time - start_time  # Calculate elapsed time

    full_response = sequences[0]["generated_text"]

    if "Answer:" in full_response:
        answer_text = full_response.split("Answer:", 1)[1].strip()
    else:
        answer_text = full_response.replace(prompt, "").strip()

    print(f"\nRaw Answer: {answer_text}")
    print(f"\nResponse generated in {elapsed_time:.2f} seconds")

    return answer_text




if __name__ == "__main__":

    print("in main !!!!")
    login_huggingface("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")
    print("in main!!!!!!!!!!")

    llama_pipeline = init_ttt_model()

    output_dir = "Llama_TTT_Output"  # Replace with your desired path

    # os.makedirs(output_dir, exist_ok=True)

    prompts = ["What colour is an apple"]

    responses = {}
    print("in main !!!!!!!!!!!!!!!!!!!")

    for i, prompt in enumerate(prompts, 1):
        response = get_llama_response(llama_pipeline, prompt)  
        
        variable_name = f"response_{i}"
        responses[variable_name] = response 
    
        print(f"\n{variable_name} (Prompt {i}): {response}\n")

        filename = f"{output_dir}/{variable_name}.txt"
        
        with open(filename, "w") as file:
            file.write(response) 
        
        print(f"Saved raw answer for Prompt {i} to {filename}")

    