""" 
Unit test suite for Coqui XTTS (English TTS) component using Pytest framework:
To run tests:
    1. Ensure the virtual environment is configured correctly and all requirements are installed.
    2. cd backend/testing/unitTests
    3. pytest -v coqui_test.py 

If you encounter an ImportError when importing functions from the 'workflows' directory, 
try setting the PYTHONPATH environment variable to the current directory:
Run `export PYTHONPATH=$(pwd)` in your terminal, then re-run the tests.
""" 


import pytest
import os
import time
import torch
from TTS.api import TTS
import sounddevice as sd
import soundfile as sf
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from workflows.tts.coqui import get_tts_model, tts_workflow

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Functional test cases: 

# Unit Test 1: Test that the TTS model initializes correctly
def test_tts_initialization():
    try:
        tts_model = get_tts_model(device)
        # Expected behaviour: the TTS model initialises correctly
        assert tts_model is not None, "TTS model failed to initialize"
    except Exception as e:
        pytest.fail(f"TTS initialization failed: {e}")


# Unit Test 2: Test TTS workflow with valid input text and valid speaker reference:
def test_tts_workflow_valid_input():
    tts_model = get_tts_model(device)
    input_text = "Hello, this is a test."
    speaker_path = "../../inputs/male_formal.wav"
    output_path = "../../outputs/test/test_valid_input.wav"
    
    try:
        tts_workflow(tts_model, input_text, speaker_path, output_path)
        # Expected behaviour: TTS model successfully converts text to speech and generates the output file
        assert os.path.isfile(output_path), "Failed to generate speech file"
    except Exception as e:
        pytest.fail(f"TTS workflow failed with valid input: {e}")



# Edge case test cases:

# Unit Test 3: Test TTS with empty input text
        
# Run the test three times for 3 different empty inputs -> "", None, " "
@pytest.mark.parametrize("empty_input", ["", None, "    "])
def test_tts_empty_input(empty_input):
    tts_model = get_tts_model(device)
    speaker_path = "../../inputs/male_formal.wav"
    output_path = "../../outputs/test/test_empty_input.wav"
    
    try:
        tts_workflow(tts_model, empty_input, speaker_path, output_path)
        # Expected behaviour: No output file should be generated if the text input is empty
        assert not os.path.isfile(output_path), "Empty input generated a file"
    except Exception as e:
        print(f"Handled empty input as expected: {e}")


# Unit Test 4: Test TTS with a very long text input
def test_tts_long_text():
    long_text = "This is a very long text input " * 1000  
    tts_model = get_tts_model(device)
    speaker_path = "../../inputs/male_formal.wav"
    output_path = "../../outputs/test/test_long_text_input.wav"
    

    # Expected behaviour: XTTS throws error generating speech for more than 400 tokens (throws warning that audio will be truncated if more than 250 characters (for english))
    with pytest.raises(Exception, match=r"XTTS can only generate text with a maximum of 400 tokens"):
        tts_workflow(tts_model, long_text, speaker_path, output_path)

    # Ensure no output file is created
    assert not os.path.isfile(output_path), "Output file should not be generated for long text input"



# Unit Test 5: Test TTS with non-string input (numerical or special characters)
    
# Run the test three times for 3 different non string inputs -> 123456, "@#$%^&*", "1 2 3 4 5" and also save the 3 outputs to different output files
@pytest.mark.parametrize("non_string_input, output_filename, expect_error", [
    (123456, "test_non_string_input1.wav", True), 
    ("@#$%^&*!,", "test_non_string_input2.wav", False), 
    ("1 2 3 4 5", "test_non_string_input3.wav", False), 
    ])
def test_tts_non_string_input(non_string_input, output_filename, expect_error):
    tts_model = get_tts_model(device)
    speaker_path = "../../inputs/male_formal.wav"
    output_path = f"../../outputs/test/{output_filename}"
    
    if expect_error:
        # Expected behaviour: Expect XTTS to throw an error for numerical input
        with pytest.raises(TypeError, match=r"expected string or bytes-like object"):
            tts_workflow(tts_model, non_string_input, speaker_path, output_path)
    else:
        # Expected behaviour: For other cases(still defined as a string), ensure TTS generates a valid output file
        tts_workflow(tts_model, non_string_input, speaker_path, output_path)
        assert os.path.isfile(output_path), f"Non-string input '{non_string_input}' did not generate output"



# Unit Test 6: Test TTS with emojis
def test_tts_emojis_text():
    emoji_text = "😭💪😡" 
    tts_model = get_tts_model(device)
    speaker_path = "../../inputs/male_formal.wav"
    output_path = "../../outputs/test/test_emojis_input.wav"
    print("text with emojis: ", emoji_text)
    
    try:
        # Expected behaviour: Ensure TTS still generates valid output file(although the speech generated is incoherent)
        tts_workflow(tts_model, emoji_text, speaker_path, output_path)
        assert os.path.isfile(output_path), "Failed to generate speech for input with emojis"
    except Exception as e:
        pytest.fail(f"TTS failed with input with emojis: {e}")



# Unit Test 7: Test TTS with invalid speaker reference (silent file)
def test_tts_invalid_speaker():
    tts_model = get_tts_model(device)
    input_text = "Testing with silent speaker reference."
    speaker_path = "../../outputs/test/silent_audio.wav"  # Make sure this file exists and is silent
    output_path = "../../outputs/test/test_invalid_speaker.wav"

    try:
        # Expected behaviour: Ensure TTS still generates valid output file(although the speech generated is incoherent as it uses default speaker embeddings)
        tts_workflow(tts_model, input_text, speaker_path, output_path)
        assert os.path.isfile(output_path), "Failed to generate speech for silent speaker reference"
    except Exception as e:
            pytest.fail(f"TTS failed with silent speaker reference: {e}")



# Run the tests
if __name__ == "__main__":
    pytest.main(["-v", "coqui_test.py"])