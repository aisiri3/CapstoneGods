import transformers
from transformers import pipeline
import torch
import accelerate
from transformers import AutoTokenizer
import time
from TTS.api import TTS
import sounddevice as sd
import soundfile as sf

from Coqui_English_python_workflow import init_TTS_model, TTS_workflow, playback_output_speech
from textToText_english_workflow import init_ttt_model, get_llama_response

if __name__ == "__main__":

    llama_pipeline = init_ttt_model()

    tts_model = init_TTS_model() 

    # Speaker reference:
    # Currently, taken from business_ethics.wav file (3 min audio clip):
    speaker_path = "inputs/business-ethics.wav"

    # Define output path:
    output_path = "outputs/user_output.wav"

    # prompts = [
    #     "What colour is an apple?",
    #     "Can you explain why leaves change color in autumn?",
    #     "Imagine you're an explorer discovering an ancient civilization in the jungle. Describe the scene and your feelings.",
    #     "Provide a summary of the key points on climate change and how individuals can contribute to reducing their carbon footprint.",
    #     "Write a short story about a scientist who invents a machine that can communicate with animals. Describe the first animal they speak to, the conversation that unfolds, and the scientist's reaction to learning how animals perceive humans."
    # ]

    # for i, prompt in enumerate(prompts, 1):
    #     print(f"\nPrompt {i}:")
    #     get_llama_response(llama_pipeline, prompt)

    # For testing purpose, user inputs a text, TTT model generates a response and then the TTS model converts the 
    # response to speech:
    while True:
        input_text = input("Enter text (or 'exit' to quit): ")
        if input_text.lower() == 'exit':
            break

        # Get response from TTT model:
        response_text = get_llama_response(llama_pipeline, input_text)

        # Run the TTS workflow:
        TTS_workflow(tts_model, response_text, speaker_path, output_path)

        # Playback the generated speech immediately after conversion:
        playback_output_speech(output_path)

        