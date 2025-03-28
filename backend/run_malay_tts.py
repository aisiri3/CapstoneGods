# Import the function
from api.chat.services import run_malay_tts
import time  # Import time module to measure execution time

# Start timing
start_time = time.time()

# Define parameters
speaker = "Osman"  # Male speaker (alternative is "Yasmin" for female)
text = "Adalah perkara biasa untuk berasa gementar apabila mengajak seseorang keluar, tetapi terdapat beberapa perkara yang boleh anda lakukan untuk menjadikannya lebih mudah dan selesa. Berikut adalah beberapa petua: 1. Cari masa dan tempat yang sesuai untuk bercakap. Anda mahu memilih masa dan tempat di mana orang lain berasa selesa dan santai. 2. Jelas dan terus terang. Biarkan orang lain tahu perasaan anda dan apa yang anda tanya. 3. Bersikap hormat dan bertimbang rasa."
output_path = "outputs/user_output.wav"  # Where to save the generated audio

# Call the function
result = run_malay_tts(text, speaker, output_path)

# Calculate total execution time
total_time = time.time() - start_time

# Check if it was successful
if result:
    print(f"TTS completed successfully in {total_time:.2f} seconds!")
else:
    print(f"TTS failed after {total_time:.2f} seconds.")