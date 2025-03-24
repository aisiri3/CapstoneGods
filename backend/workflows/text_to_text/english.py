# """
# English Text-to-Text Implementation.
# """
# import time
# import torch
# import re
# from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
# from huggingface_hub import login
# from transformers.utils.logging import disable_progress_bar
# disable_progress_bar()

# def login_huggingface(huggingface_API):
#     """Login to Hugging Face Hub."""
#     login(huggingface_API)


# def get_model(model_id="meta-llama/Llama-2-7b-chat-hf"):
#     """Initialize the text-to-text model."""
#     print("Initializing model...")
#     tokenizer = AutoTokenizer.from_pretrained(model_id, use_auth_token=True)
    
#     llama_pipeline = pipeline(
#         task="text-generation",
#         model=model_id,
#         torch_dtype=torch.float16,
#         device_map='auto'
#     )
    
#     print("Model initialized successfully!")
#     return llama_pipeline

# # def init_model(model_id="meta-llama/Llama-2-7b-chat-hf"):
# #     """Initialize the text-to-text model (disabled for testing)."""
# #     print("Initializing model SKIPPED for testing...")
    
# #     # Return a dummy object instead of the actual model
# #     class DummyPipeline:
# #         def __call__(self, *args, **kwargs):
# #             return [{"generated_text": f"[TEST MODE] This is a dummy response. Original prompt: {args[0]}"}]
    
# #     print("Dummy model initialized successfully!")
# #     return DummyPipeline()


# def remove_emojis(text):
#     """Remove emojis from a string."""
#     emoji_pattern = re.compile(
#         "["
#         "\U0001F600-\U0001F64F"  # Emoticons
#         "\U0001F300-\U0001F5FF"  # Symbols & Pictographs
#         "\U0001F680-\U0001F6FF"  # Transport & Map Symbols
#         "\U0001F700-\U0001F77F"  # Alchemical Symbols
#         "\U0001F780-\U0001F7FF"  # Geometric Shapes Extended
#         "\U0001F800-\U0001F8FF"  # Supplemental Arrows-C
#         "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
#         "\U0001FA00-\U0001FA6F"  # Chess Symbols
#         "\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
#         "\U00002702-\U000027B0"  # Dingbats
#         "\U000024C2-\U0001F251"  # Enclosed Characters
#         "]+", flags=re.UNICODE
#     )
#     return emoji_pattern.sub('', text)


# def generate_response(llama_pipeline, prompt):
#     """Generate a response using the Llama model."""
#     persona_intro = (
#         "You are a friendly English language assistant helping learners improve their communication skills in casual, everyday settings."
#          "Your response should focus on casual language and tone, avoiding overly formal or stiff expressions." 
#          "Provide light, conversational examples."
#          "Keep to maximum of 3 lines."
#          "Keep response super short and sweet."
          
#     )

#     modified_prompt = persona_intro + "\n" + prompt
#     start_time = time.time()

#     sequences = llama_pipeline(
#         modified_prompt,
#         do_sample=True,
#         top_k=4,
#         num_return_sequences=1,
#         max_length=10,
#         temperature=0.4,
#     )

#     end_time = time.time()
#     elapsed_time = end_time - start_time  # Calculate elapsed time

#     full_response = sequences[0]["generated_text"]

#     # Strip persona intro, prompt, and "A: " anywhere in the response
#     answer_text = full_response.strip()

#     # Replace persona intro anywhere in the response
#     answer_text = answer_text.replace(persona_intro, "").strip()

#     # Replace prompt anywhere in the response
#     answer_text = answer_text.replace(prompt, "").strip()

#     # Replace "A: " anywhere in the response
#     answer_text = answer_text.replace("A: ", "").strip()

#     # Remove emojis from the response
#     answer_text = remove_emojis(answer_text)

#     return answer_text, elapsed_time


# # def get_response(llama_pipeline, prompt):
# #     response_text = prompt
# #     print("Note: Llama model is disabled for testing.")
# #     return response_text, 0.0

# if __name__ == "__main__":
#     print("hey Im running llama")
#     llama_pipeline = get_model()
#     prompt = "Hi there! What is the day today in Singapore?"
#     response = get_response(llama_pipeline, prompt)
#     print(response)



# import time
# import torch
# import re
# from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
# from huggingface_hub import login
# from transformers.utils.logging import disable_progress_bar
# disable_progress_bar()

# def login_huggingface(huggingface_API):
#     """Login to Hugging Face Hub."""
#     login(huggingface_API)

# def get_model(model_id="meta-llama/Llama-2-7b-chat-hf"):
#     """Initialize the text-to-text model."""
#     print("Initializing model...")
#     tokenizer = AutoTokenizer.from_pretrained(model_id, use_auth_token=True)
    
#     llama_pipeline = pipeline(
#         task="text-generation",
#         model=model_id,
#         tokenizer=tokenizer,  # Tokenizer is now passed into the pipeline
#         torch_dtype=torch.float16,
#         device_map='auto'
#     )
    
#     print("Model initialized successfully!")
#     return llama_pipeline, tokenizer

# def remove_emojis(text):
#     """Remove emojis from a string."""
#     emoji_pattern = re.compile(
#         "[" 
#         "\U0001F600-\U0001F64F"  # Emoticons
#         "\U0001F300-\U0001F5FF"  # Symbols & Pictographs
#         "\U0001F680-\U0001F6FF"  # Transport & Map Symbols
#         "\U0001F700-\U0001F77F"  # Alchemical Symbols
#         "\U0001F780-\U0001F7FF"  # Geometric Shapes Extended
#         "\U0001F800-\U0001F8FF"  # Supplemental Arrows-C
#         "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
#         "\U0001FA00-\U0001FA6F"  # Chess Symbols
#         "\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
#         "\U00002702-\U000027B0"  # Dingbats
#         "\U000024C2-\U0001F251"  # Enclosed Characters
#         "]+", flags=re.UNICODE
#     )
#     return emoji_pattern.sub('', text)

# def generate_response(llama_pipeline, tokenizer, prompt):
#     """Generate a response using the Llama model."""
#     persona_intro = (
#         "You are a friendly English language assistant helping learners improve their communication skills in casual, everyday settings. "
#         "Your response should focus on casual language and tone, avoiding overly formal or stiff expressions. "
#         "Provide light, conversational examples. Keep the response short and sweet, focusing on clarity."
#     )

#     modified_prompt = persona_intro + "\n" + prompt
#     start_time = time.time()

#     # Generate response with a restricted length (shorter max_length to control verbosity)
#     sequences = llama_pipeline(
#         modified_prompt,
#         do_sample=True,
#         top_k=4,
#         num_return_sequences=1,
#         max_length=30,  # Adjusting max_length to prevent overly long responses
#         temperature=0.7,  # Adjust temperature for a bit more creativity
#     )

#     end_time = time.time()
#     elapsed_time = end_time - start_time  # Calculate elapsed time

#     full_response = sequences[0]["generated_text"].strip()

#     # Strip persona intro and prompt repetition from the response
#     answer_text = full_response.replace(persona_intro, "").strip()
#     answer_text = answer_text.replace(prompt, "").strip()

#     # Remove "A:" if present and extra spaces
#     answer_text = answer_text.replace("A: ", "").strip()

#     # Remove emojis from the response
#     answer_text = remove_emojis(answer_text)

#     # Shorten the response to ensure it’s concise
#     answer_text = " ".join(answer_text.split()[:30])  # Limit to the first 30 words

#     return answer_text, elapsed_time

# if __name__ == "__main__":
#     print("hey I'm running llama")
    
#     # Initialize the model and tokenizer
#     llama_pipeline, tokenizer = get_model()
    
#     # Example prompt
#     prompt = "Hi there! What is the day today in Singapore?"
    
#     # Generate the response
#     response, elapsed_time = generate_response(llama_pipeline, tokenizer, prompt)
    
#     print(f"Response: {response}")
#     print(f"Time taken: {elapsed_time} seconds")





"""
English Text-to-Text Implementation.
"""
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from huggingface_hub import login
from transformers.utils.logging import disable_progress_bar
disable_progress_bar()
import re

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


def remove_emojis(text):
    """Remove emojis from a string."""
    emoji_pattern = re.compile(
        r"[^\w\s,]"  # Match all non-word characters except whitespace and commas
    )
    return re.sub(emoji_pattern, '', text)


def generate_response(llama_pipeline, prompt,persona):
    """Generate a response using the Llama model."""
    # persona_intro = (
    #     "You are a language learning assistant helping English speakers to learn and improve their English. "
    #     "You provide explanations, examples, and suggestions to help users speak and understand English better. "
    #     "You are friendly, patient, and encouraging in your responses. Keep your responses very short and sweet and concise. Keep to maximum of 3 lines."
    # )

    modified_prompt = persona + "\n" + prompt
    start_time = time.time()

    sequences = llama_pipeline(
        modified_prompt,
        do_sample=True,
        top_k=10,
        num_return_sequences=1,
        max_length=300,
        temperature=0.7,
    )

    end_time = time.time()
    elapsed_time = end_time - start_time  # Calculate elapsed time

    full_response = sequences[0]["generated_text"]

    # Strip persona intro, prompt, and "A: " anywhere in the response
    answer_text = full_response.strip()

    # Replace persona intro anywhere in the response
    answer_text = answer_text.replace(persona, "").strip()

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