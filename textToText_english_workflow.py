import transformers
from transformers import pipeline
import torch
import accelerate
from transformers import AutoTokenizer
import time
from huggingface_hub import login

def login_huggingface(huggingface_API):

    login(huggingface_API)


def init_ttt_model():
    model_id = "meta-llama/Llama-2-7b-chat-hf"
    tokenizer = AutoTokenizer.from_pretrained(model_id,use_auth_token=True)

    llama_pipeline = pipeline(task="text-generation",model="meta-llama/Llama-2-7b-chat-hf",torch_dtype=torch.float16,device_map='auto')

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

    # Response_text:
    response_text = sequences[0]["generated_text"]

    print("\nChatbot:", response_text)
    print(f"\nResponse generated in {elapsed_time:.2f} seconds")

    return response_text



if __name__ == "__main__":

    login_huggingface("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")

    llama_pipeline = init_ttt_model()

    prompts = [
        "What colour is an apple?"
    ]

    for i, prompt in enumerate(prompts, 1):
        print(f"\nPrompt {i}:")
        get_llama_response(llama_pipeline, prompt)

    