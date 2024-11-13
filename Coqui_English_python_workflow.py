# To check if the delay in output is due to importing the torch and TTS libraries:
import time
start_time = time.time()

import torch
from TTS.api import TTS

import sounddevice as sd
import soundfile as sf
import os

# It is taking quite some time (about 6 seconds) to import the libraries (so the output becomes delayed) - currently running on CPU, should be faster on GPU:
print(f"Import time: {time.time() - start_time:.2f} seconds")


# Initialise the TTS with the target model name:
def init_TTS_model():
    # We will be using the XTTS version 2 framework for English Text to Speech:
    # We will be using the multi speaker, multi lingual version because:
    #   1. Voice cloning - Can specify a speaker reference with a short audio sample of the target speaker's voice for voice cloning. 
    #   2. Multi lingual capability - Can set the language parameter (eg. "en" for english) to generate speech in multiple languages. 

    # Get the specified device (CPU or GPU):
    device = "cuda" if torch.cuda.is_available() else "cpu"


    # Use the XTTS version 2 model:
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2") # For now, we remove the gpu=True parameter because we are running on CPU

    # Move the TTS model to the specified device:
    tts.to(device)


    return tts



# Define the TTS workflow where we convert the text (received from the Text to text model) to speech:
def TTS_workflow(tts, input_text, speaker_path, output_path):
    # Parameters:
    #   1. tts - The TTS model (initialised with init_TTS_model() function)
    #   2. input_text - The text to be converted
    #   3. speaker_path - Path to the speaker reference .wav file
    #   4. output_path - Path to save the generated audio .wav file

    # # Save the input_text to a file (if we are planning to integrate with a database) - appending to file so stores history of input text:
    # with open("conversation_input_text.txt", "a", encoding="utf-8") as input_file:
    #     input_file.write(input_text + "\n")

    # Text to Speech conversion:
    tts.tts_to_file(
        text=input_text, 
        speaker_wav=speaker_path,
        file_path=output_path, 
        language="en")

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
    tts_model = init_TTS_model() 
    print("init done")

    # Speaker reference:
    # Currently, taken from business_ethics.wav file (3 min audio clip):
    speaker_path = "inputs/business-ethics.wav"

    # Define output path:
    input_dir = "Llama_TTT_Output"
    output_dir = "Llama_TTS_Output"
    # for i, filename in enumerate(input_dir, 1):
    #     print("inside for")
    #     print("filename: ", filename)

    #     if filename.endswith('.txt'):
    #         print("inside if")

    #         file_path = f"{input_dir}/{filename}"
    #         print("got filepath")
    #         with open(file_path, 'r') as file:
    #             response = file.read().strip()
    #             print("response extracted")

    #         output_path = f"{output_dir}/english_output_audio_{i}.wav"

    #         print(f"Generated audio file for {filename}: {output_path}")

    for i, filename in enumerate(os.listdir(input_dir), 1):

        if filename.endswith('.txt'):

            file_path = os.path.join(input_dir, filename)
            with open(file_path, 'r') as file:
                response = file.read().strip()

            output_path = os.path.join(output_dir, f"english_output_audio_{i}.wav")

            print(f"Generated audio file for {filename}: {output_path}")

            TTS_workflow(tts_model, response, speaker_path, output_path)
            playback_output_speech(output_path)

    # output_path = "outputs/user_output.wav"

    # # For testing purpose, user inputs a text and then the TTS model converts the user input to speech:
    # while True:
    #     input_text = input("Enter text to convert to speech (or 'exit' to quit): ")
    #     if input_text.lower() == 'exit':
    #         break
    #     # Run the TTS workflow:
    #     TTS_workflow(tts_model, input_text, speaker_path, output_path)

    #     # Playback the generated speech immediately after conversion:
    #     playback_output_speech(output_path)

    

    
    