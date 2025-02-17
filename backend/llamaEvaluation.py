import sys
import os
site_packages = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'venv', 'Lib', 'site-packages')
sys.path.append(site_packages)

from flask import Flask
from flask_mysqldb import MySQL
import time
from transformers import pipeline
import torch
from sentence_transformers import SentenceTransformer, util

# Initialize Flask app for database connection
app = Flask(__name__)

# MySQL connection details directly in the script
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'cap123'
app.config['MYSQL_DB'] = 'chatbot_eval'

# Add this line to ensure utf8mb4 encoding is used in the connection
app.config['MYSQL_CHARSET'] = 'utf8mb4'

# Initialize MySQL
mysql = MySQL(app)

# Set up the Llama pipeline
device = 0 if torch.cuda.is_available() else -1
model_id = "meta-llama/Llama-2-7b-chat-hf"

llama_pipeline = pipeline(
    task="text-generation",
    model=model_id,
    torch_dtype=torch.float16,
    device=device
)

# Load the sentence transformer model for similarity calculation
similarity_model = SentenceTransformer('all-MiniLM-L6-v2')

import re

def remove_emojis(text: str) -> str:
    """Remove emojis from a string."""
    emoji_pattern = re.compile(
        r"[^\w\s,]"  # Match all non-word characters except whitespace and commas
    )
    return re.sub(emoji_pattern, '', text)


def generate_response(prompt: str) -> str:
    """Generate a response using the Llama model"""
    persona_intro = (
        "You are a language learning assistant helping English speakers to learn and improve their English. "
        "You provide explanations, examples, and suggestions to help users speak and understand English better. "
        "You are friendly, patient, and encouraging in your responses. Keep your responses very short and sweet and concise. Keep to maximum of 3 lines."
    )

    modified_prompt = persona_intro + "\n" + prompt
    start_time = time.time()

    sequences = llama_pipeline(
        modified_prompt,
        do_sample=True,
        top_k=10,
        num_return_sequences=1,
        max_length=512,
        temperature=0.7,
    )

    end_time = time.time()
    elapsed_time = end_time - start_time  # Calculate elapsed time

    full_response = sequences[0]["generated_text"]

    # Strip persona intro, prompt, and "A: " anywhere in the response
    answer_text = full_response.strip()

    # Replace persona intro anywhere in the response
    answer_text = answer_text.replace(persona_intro, "").strip()

    # Replace prompt anywhere in the response
    answer_text = answer_text.replace(prompt, "").strip()

    # Replace "A: " anywhere in the response
    answer_text = answer_text.replace("A: ", "").strip()

    # Remove emojis from the response
    answer_text = remove_emojis(answer_text)

    return answer_text, elapsed_time

def calculate_similarity(sample_response: str, generated_response: str) -> float:
    """Calculate similarity score between sample response and generated response"""
    sample_embedding = similarity_model.encode(sample_response, convert_to_tensor=True)
    response_embedding = similarity_model.encode(generated_response, convert_to_tensor=True)
    similarity = util.pytorch_cos_sim(sample_embedding, response_embedding)
    return similarity.item()

def main():
    with app.app_context():
        # Connect to MySQL database and fetch entries
        cursor = mysql.connection.cursor()

        cursor.execute("SELECT * FROM evaluation_entries")
        entries = cursor.fetchall()

        for entry in entries:
            prompt = entry[1]  # Adjusted for tuple index
            sample_response = entry[2]  # Adjusted for tuple index

            # Generate response using Llama model
            generated_response, response_time = generate_response(prompt)

            # Calculate similarity score
            similarity_score = calculate_similarity(sample_response, generated_response)

            # Update the database with the generated response, response time, and similarity score
            cursor.execute("""
                UPDATE evaluation_entries
                SET actualResponse = %s, responseTime = %s, similarityScore = %s
                WHERE id = %s
            """, (generated_response, response_time, similarity_score, entry[0]))  # Adjusted for tuple index

            mysql.connection.commit()

        # Close the cursor and connection
        cursor.close()

        # Print the result for verification

if __name__ == "__main__":
    main()
