


import mysql.connector
import time
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch
from sentence_transformers import SentenceTransformer, util
import torch

# Ensure that you're using the GPU if available
device = 0 if torch.cuda.is_available() else -1

# Connect to the MySQL database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="cap123",
    database="chatbot_eval"
)

cursor = db.cursor(dictionary=True)

# Load Llama model and tokenizer
model_id = "meta-llama/Llama-2-7b-chat-hf"
tokenizer = AutoTokenizer.from_pretrained(model_id)

# Set up the Llama pipeline
llama_pipeline = pipeline(
    task="text-generation",
    model=model_id,
    torch_dtype=torch.float16,  # Use float16 for memory efficiency on GPU
    device=device  # Set device to 0 for GPU or -1 for CPU
)

# Load the sentence transformer model for similarity calculation
similarity_model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_response(prompt: str) -> str:
    """Generate a response using the Llama model"""
    persona_intro = (
        "You are a language learning assistant helping English speakers to learn and improve their English. "
        "You provide explanations, examples, and suggestions to help users speak and understand English better. "
        "You are friendly, patient, and encouraging in your responses. Keep your responses very short and sweet and concise.Keep to maximum of 3 lines."
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

    return answer_text, elapsed_time



def calculate_similarity(sample_response: str, generated_response: str) -> float:
    """Calculate similarity score between sample response and generated response"""
    sample_embedding = similarity_model.encode(sample_response, convert_to_tensor=True)
    response_embedding = similarity_model.encode(generated_response, convert_to_tensor=True)
    similarity = util.pytorch_cos_sim(sample_embedding, response_embedding)
    return similarity.item()

# Fetch all entries from the database
cursor.execute("SELECT * FROM evaluation_entries")
entries = cursor.fetchall()

for entry in entries:
    prompt = entry['prompt']
    sample_response = entry['sampleResponse']

    # Generate response using Llama model
    generated_response, response_time = generate_response(prompt)

    # Calculate similarity score
    similarity_score = calculate_similarity(sample_response, generated_response)

    # Update the database with the generated response, response time, and similarity score
    cursor.execute("""
        UPDATE evaluation_entries
        SET actualResponse = %s, responseTime = %s, similarityScore = %s
        WHERE id = %s
    """, (generated_response, response_time, similarity_score, entry['id']))

    db.commit()

# Close the database connection
cursor.close()
db.close()
