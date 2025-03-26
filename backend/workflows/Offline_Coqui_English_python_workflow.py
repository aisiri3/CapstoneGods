# To check if the delay in output is due to importing the torch and TTS libraries:
import time
start_time = time.time()

import torch
from TTS.api import TTS
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts
# from TTS.tokenizers import Tokenizer

import sounddevice as sd
import soundfile as sf


# It is taking quite some time (about 6 seconds) to import the libraries (so the output becomes delayed) - currently running on CPU, should be faster on GPU:
print(f"Import time: {time.time() - start_time:.2f} seconds")

# NOTE: Add XttsConfig to PyTorch's safe globals allowlist
torch.serialization.add_safe_globals([XttsConfig])

## NOTE: Moved the model offline (use config file directly)
def init_TTS_model():
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Load the model configuration from a local JSON file
    config = XttsConfig()
    config.load_json("coqui-model/config.json")  # Change this to your local config path

    model = Xtts.init_from_config(config)
    model.load_checkpoint(config, checkpoint_dir="coqui-model/model_file", eval=True)

    # Move model to the appropriate device
    model.to(device)

    return model, config


## NOTE: added config to parameters
def TTS_workflow(model, config, input_text, speaker_path, output_path):
    # Parameters:
    #   1. model - The downloaded TTS pth file
    #   2. config - The model configuration
    #   3. input_text - The text to be converted
    #   4. speaker_path - Path to the speaker reference .wav file
    #   5. output_path - Path to save the generated audio .wav file

    # Save the input_text to a file (if we are planning to integrate with a database) - appending to file so stores history of input text:
    with open("conversation_input_text.txt", "a", encoding="utf-8") as input_file:
        input_file.write(input_text + "\n")

    # before inference
    torch.cuda.reset_peak_memory_stats()
    before = torch.cuda.memory_allocated()

    # Text to Speech conversion:
    outputs = model.synthesize(
        input_text,
        config,
        speaker_wav=speaker_path,
        gpt_cond_len=3,
        language="en",
        attention_mask=None,
    )

    # After inference
    after = torch.cuda.memory_allocated()
    peak = torch.cuda.max_memory_allocated()

    print(f"GPU Memory Before: {before / 1024**2:.2f} MB")
    print(f"GPU Memory After: {after / 1024**2:.2f} MB")
    print(f"Peak GPU Memory Used: {peak / 1024**2:.2f} MB")

    sf.write(output_path, outputs["wav"], config.audio.sample_rate)

    print("TTS conversion completed!")
    print("Output audio path: ", output_path)


# For testing purposes, the TTS workflow will take the user input, play the output audio generated, wait for user input and again play the output audio generated
# for the second user input and so on. This is to test that the TTS conversion works in realtime and it can process input by input:
    
def playback_output_speech(output_path):
    print("Playing generated audio:")

    data, sample_rate = sf.read(output_path)
    sd.play(data, samplerate=sample_rate)
    sd.wait()  # Wait until playback is done
    

    print("TTS completed!")


# Call the functions if we are invoking this file directly: (to be checked when integrating everything):
if __name__ == "__main__":

    print("Hello World")

    # Press y ("Otherwise, I agree to the terms of the non-commercial CPML: https://coqui.ai/cpml") 
    # -> First time it will take some time to download the TTS model locally but subsequent times will be faster because model is already downloaded
    tts_model, tts_config = init_TTS_model()

    # Speaker reference:
    # Currently, taken from business_ethics.wav file (3 min audio clip):
    speaker_path = "inputs/business-ethics.wav"

    # Define output path:
    output_path = "outputs/user_output.wav"

    # For testing purpose, user inputs a text and then the TTS model converts the user input to speech:
    while True:
        input_text = input("Enter text to convert to speech (or 'exit' to quit): ")
        if input_text.lower() == 'exit':
            break
        # Run the TTS workflow:
        TTS_workflow(tts_model, tts_config, input_text, speaker_path, output_path)

        # Playback the generated speech immediately after conversion:
        playback_output_speech(output_path)

    

    
    