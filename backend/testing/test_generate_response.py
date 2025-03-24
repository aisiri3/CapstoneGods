import pytest
import re
from unittest.mock import patch
import time
import torch
from transformers import pipeline
import re
import sys
import os

# Make sure the project root is added to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
print(sys.path)  # Debugging: print all available paths

from workflows.text_to_text.english import login_huggingface, get_model, remove_emojis, generate_response



@pytest.fixture(scope="session")
def llama_pipeline():
    """Fixture to initialize the Llama model pipeline once and reuse it across tests."""
    print("Loading Llama model...")
    pipeline_instance = get_model()
    
    # Clear CUDA memory cache before using the model
    torch.cuda.empty_cache()
    
    yield pipeline_instance
    
    # Clear the cache after all tests are done
    print("Clearing CUDA memory...")
    torch.cuda.empty_cache()

def test_generate_response_valid(llama_pipeline, request):
    """Test case for valid input to the Llama model."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = "What are the benefits of learning a second language?"
    persona = (
        "You are a language learning assistant helping English speakers to learn and improve their English. "
        "You provide explanations, examples, and suggestions to help users speak and understand English better. "
        "You are friendly, patient, and encouraging in your responses. Keep your responses very short and sweet and concise. Keep to maximum of 3 lines."
    )
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print("\n")
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n")

    # Check if the response is not empty and that it contains text
    assert generated_response != ""
    assert isinstance(generated_response, str)
    
    # Ensure response time is reasonable 
    assert response_time < 20.0

# Example of one more test with print statement
def test_empty_input(llama_pipeline, request):
    """Test case for empty input to the Llama model."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = ""
    persona = "" 

    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print("\n")
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n")
    
    # Check that the response is empty or a fallback response
    assert generated_response == ""  # Assuming the model will return an empty string or a default answer
    assert isinstance(generated_response, str)

def test_none_none_input(llama_pipeline, request):
    """Test case for None, None input."""  
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = None
    persona = None
    
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print("\n")
    print(f"Generated Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    
    # Ensure the response is empty or a fallback response
    assert generated_response == ""  # We expect an empty string or no response
    assert isinstance(generated_response, str)  # Ensure the response is still a string
    
    # Ensure response time is reasonable
    assert response_time < 20.0


@pytest.mark.parametrize(
    "prompt, persona", [
        ("1234567890", ""),               # Pure numerical input
        ("Hello World!", ""),             # String input
        ("!@#$%&*()", ""),                # Special characters
        ("", ""),                         # Empty input
        ("12345 67890", ""),              # Numeric string with space
        (None,None),
        ("   "," "),  # Regular sentence
    ]
)
def test_input_types(llama_pipeline, request, prompt, persona):
    """Test case for different input types to the Llama model."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print(f"Response for Test: {test_name} - {generated_response}")   
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    
    # Ensure the response is not empty and is a string
    assert generated_response != ""
    assert isinstance(generated_response, str)
    
    # Ensure response time is reasonable
    assert response_time < 20.0



def test_long_nonsensical_text(llama_pipeline, request):
    """Test case for long nonsensical input."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = "A" * 1000  # A string of 1000 'A's
    persona = (
        ""
    )
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print("\n")
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n")
    
    # Ensure the response is not empty
    assert generated_response != ""
    assert isinstance(generated_response, str)
    assert response_time < 15.0

# You can apply the same changes (print statements) for the rest of the tests. For brevity, here are only a few examples:

def test_pure_numerical_input(llama_pipeline, request):
    """Test case for pure numerical input."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = "1234567890"
    persona = (
        ""
    )
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print(f"Response for Test: {test_name} - {generated_response}")   
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n")    
    # Ensure the response is not empty
    assert generated_response != ""
    assert isinstance(generated_response, str)
    assert response_time < 20.0

def test_gibberish_characters(llama_pipeline, request):
    """Test case for gibberish characters."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = "!@#$%AEoih9U7Gb;liuG9;p09yrfqn['qfrg9^&*()_+-=[rtsghjnrzjnggsr]{}|;wgtjws,.<gjnysrugzvjy>?/~"
    persona = (
        ""
    )
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print(f"Response for Test: {test_name} - {generated_response}")   
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n")    
    # Ensure the response is not empty
    assert generated_response != ""
    assert isinstance(generated_response, str)
    assert response_time < 20.0

def test_random_symbols_ascii_art(llama_pipeline, request):
    """Test case for random symbols or ASCII art."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = "¯\\_(ツ)_/¯"
    persona = (
        ""
    )
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print("\n")
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n") 
    
    # Ensure the response is not empty
    assert generated_response != ""
    assert isinstance(generated_response, str)
    assert response_time < 20.0




def test_unusual_punctuation_spacing(llama_pipeline, request):
    """Test case for unusual punctuation and spacing."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = "What  !is        this?  Why   are   spaces     irregular?"
    persona = (
        ""
    )
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print("\n")
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n") 
    
    # Ensure the response is not empty
    assert generated_response != ""
    assert isinstance(generated_response, str)
    assert response_time < 20.0

def test_hate_speech(llama_pipeline, request):
    """Test case for hate speech input."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = "I hate everyone."
    persona = (
        ""
    )
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print("\n")
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n") 
    
    # Ensure the response is not empty
    assert generated_response != ""
    assert isinstance(generated_response, str)
    assert response_time < 20.0


def test_self_harm_ideation(llama_pipeline, request):
    """Test case for hate speech input."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = "I want to hurt myself."
    persona = (
        ""
    )
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print("\n")
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n") 
    
    # Ensure the response is not empty
    assert generated_response != ""
    assert isinstance(generated_response, str)
    assert response_time < 20.0


def test_repeated_words_sentences(llama_pipeline, request):
    """Test case for repeated words or sentences."""
    test_name = request.node.name
    print(f"Running Test: {test_name}")
    
    prompt = "Hello Hello Hello Hello Hello Hello Hello."
    persona = (
        ""
    )
    # Generate response using Llama model
    generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
    print("\n")
    print("\n")
    print(f"Response for Test: {test_name} - {generated_response}")
    print(f"Response Time for Test: {test_name} - {response_time}")
    print("\n")
    print("\n") 
    
    # Ensure the response is not empty
    assert generated_response != ""
    assert isinstance(generated_response, str)
    assert response_time < 20.0




if __name__ == "__main__":
    pytest.main()

# pip install pytest
# pytest -s test_generate_response.py

# \backend>pytest -s testing/test_generate_response.py  










# import pytest

# @pytest.mark.parametrize(
#     "prompt, persona", [
#         ("1234567890", ""),               # Pure numerical input
#         ("Hello World!", ""),             # String input
#         ("!@#$%&*()", ""),                # Special characters
#         ("", ""),                         # Empty input
#         ("12345 67890", ""),              # Numeric string with space
#         ("",""),
#         (None,None),
#         ("   "," "),
#         ("The quick brown fox jumps over the lazy dog.", ""),  # Regular sentence
#     ]
# )
# def test_input_types(llama_pipeline, request, prompt, persona):
#     """Test case for different input types to the Llama model."""
#     test_name = request.node.name
#     print(f"Running Test: {test_name}")
    
#     # Generate response using Llama model
#     generated_response, response_time = generate_response(llama_pipeline, prompt, persona)
    
#     print(f"Response for Test: {test_name} - {generated_response}")   
#     print(f"Response Time for Test: {test_name} - {response_time}")
#     print("\n")
    
#     # Ensure the response is not empty and is a string
#     assert generated_response != ""
#     assert isinstance(generated_response, str)
    
#     # Ensure response time is reasonable
#     assert response_time < 20.0
