import transformers
from transformers import pipeline
import torch
import accelerate
from transformers import AutoTokenizer
import time


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

    print("\nChatbot:", sequences[0]["generated_text"])
    print(f"\nResponse generated in {elapsed_time:.2f} seconds")



if __name__ == "__main__":

    llama_pipeline = init_ttt_model()

    prompts = [
        "What colour is an apple?",
        "Can you explain why leaves change color in autumn?",
        "Imagine you're an explorer discovering an ancient civilization in the jungle. Describe the scene and your feelings.",
        "Provide a summary of the key points on climate change and how individuals can contribute to reducing their carbon footprint.",
        "Write a short story about a scientist who invents a machine that can communicate with animals. Describe the first animal they speak to, the conversation that unfolds, and the scientist's reaction to learning how animals perceive humans."
    ]

    for i, prompt in enumerate(prompts, 1):
        print(f"\nPrompt {i}:")
        get_llama_response(llama_pipeline, prompt)

    