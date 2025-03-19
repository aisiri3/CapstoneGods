#!/usr/bin/env python3
"""
Llama evaluation implementation with persona support.
"""
import sys
import os
import re
import time
import argparse
import mysql.connector
import torch
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Run Llama model evaluation with persona support")
    parser.add_argument('--persona_id', type=str, help='Specific persona ID to use for evaluation')
    return parser.parse_args()

def connect_to_database():
    """Connect to the MySQL database."""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'Password01'),
            database=os.getenv('DB_NAME', 'capstoneDB')
        )
        print("Successfully connected to the database")
        return connection
    except mysql.connector.Error as error:
        print(f"Failed to connect to database: {error}")
        sys.exit(1)

def initialize_llama_pipeline(model_id="meta-llama/Llama-2-7b-chat-hf"):
    """Initialize the Llama pipeline."""
    # Set up the device
    device = 0 if torch.cuda.is_available() else -1
    
    # Set up the Llama pipeline
    try:
        llama_pipeline = pipeline(
            task="text-generation",
            model=model_id,
            torch_dtype=torch.float16,
            device=device
        )
        print(f"Successfully initialized Llama pipeline with model: {model_id}")
        return llama_pipeline
    except Exception as e:
        print(f"Failed to initialize Llama pipeline: {e}")
        sys.exit(1)

def initialize_similarity_model(model_name='all-MiniLM-L6-v2'):
    """Initialize the similarity model."""
    try:
        model = SentenceTransformer(model_name)
        print(f"Successfully initialized similarity model: {model_name}")
        return model
    except Exception as e:
        print(f"Failed to initialize similarity model: {e}")
        sys.exit(1)

def remove_emojis(text):
    """Remove emojis from a string."""
    emoji_pattern = re.compile(
        r"[^\w\s,]"  # Match all non-word characters except whitespace and commas
    )
    return re.sub(emoji_pattern, '', text)

def generate_response(llama_pipeline, prompt, persona_description=None):
    """
    Generate a response using the Llama model.
    
    Args:
        llama_pipeline: The pipeline for text generation
        prompt: The user prompt to respond to
        persona_description: Optional persona description from the database
    """
    # Use provided persona description or fall back to default
    if not persona_description:
        persona_intro = (
            "You are a language learning assistant helping English speakers to learn and improve their English. "
            "You provide explanations, examples, and suggestions to help users speak and understand English better. "
            "You are friendly, patient, and encouraging in your responses. Keep your responses very short and sweet and concise. Keep to maximum of 3 lines."
        )
    else:
        persona_intro = persona_description

    modified_prompt = persona_intro + "\n" + prompt
    start_time = time.time()

    try:
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
    except Exception as e:
        print(f"Error generating response: {e}")
        return f"Error generating response: {e}", 0

def calculate_similarity(similarity_model, sample_response, generated_response):
    """Calculate similarity score between sample response and generated response."""
    try:
        sample_embedding = similarity_model.encode(sample_response, convert_to_tensor=True)
        response_embedding = similarity_model.encode(generated_response, convert_to_tensor=True)
        similarity = util.pytorch_cos_sim(sample_embedding, response_embedding)
        return similarity.item()
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        return 0.0

def main():
    """Main function to run the evaluation."""
    # Parse command line arguments
    args = parse_arguments()
    
    # Connect to the database
    connection = connect_to_database()
    cursor = connection.cursor(dictionary=True)
    
    # Build the SQL query based on arguments
    base_query = """
        SELECT e.id, e.prompt, e.sampleResponse, p.persona_description 
        FROM evaluation_entries e
        LEFT JOIN personas p ON e.persona_id = p.persona_id
        WHERE (e.actualResponse IS NULL OR e.actualResponse = '')
    """
    
    # Add specific persona filter if provided
    if args.persona_id:
        base_query += f" AND e.persona_id = {args.persona_id}"
    
    try:
        # Initialize models
        llama_pipeline = initialize_llama_pipeline()
        similarity_model = initialize_similarity_model()
        
        # Execute the query
        cursor.execute(base_query)
        entries = cursor.fetchall()
        print(f"Retrieved {len(entries)} entries for evaluation")
        
        # Process each entry
        for entry in entries:
            entry_id = entry['id']
            prompt = entry['prompt']
            sample_response = entry['sampleResponse']
            persona_description = entry['persona_description']
            
            print(f"Processing entry {entry_id} with prompt: {prompt[:50]}...")
            
            # Generate response using the persona description
            generated_response, response_time = generate_response(
                llama_pipeline, prompt, persona_description
            )
            
            # Calculate similarity score
            similarity_score = calculate_similarity(
                similarity_model, sample_response, generated_response
            )
            
            print(f"Generated response: {generated_response[:50]}...")
            print(f"Response time: {response_time:.2f}s")
            print(f"Similarity score: {similarity_score:.4f}")
            
            # Update the database
            update_query = """
                UPDATE evaluation_entries
                SET actualResponse = %s, responseTime = %s, similarityScore = %s
                WHERE id = %s
            """
            cursor.execute(update_query, (
                generated_response, 
                response_time * 1000,  # Convert to milliseconds
                similarity_score, 
                entry_id
            ))
            connection.commit()
            
            print(f"Updated entry {entry_id} in database")
            print("-" * 50)
        
        # Close the cursor and connection
        cursor.close()
        connection.close()
        
        print("Evaluation completed successfully")
        
    except Exception as e:
        print(f"Error during evaluation: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()