import json
import nltk
import pandas as pd
from rouge_score import rouge_scorer
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import bert_score
import time  # Import time module to measure processing time
import sys
import numpy


def setup_model_and_tokenizer(device):
    """Setup the MaLLaM model and tokenizer with GPU support if available."""
    try:
        # Initialize tokenizer
        tokenizer = AutoTokenizer.from_pretrained("mesolitica/mallam-5B-4096")

        if device == "cuda":
            # Load model and move it to the GPU
            model = AutoModelForCausalLM.from_pretrained(
                "mesolitica/mallam-5B-4096",
                torch_dtype=torch.float16  # Use half-precision for memory efficiency
            ).to(device)
            print("Model loaded on GPU.")
        else:
            # Load model on CPU
            model = AutoModelForCausalLM.from_pretrained(
                "mesolitica/mallam-5B-4096",
                torch_dtype=torch.float32  # Use full precision on CPU
            ).to(device)
            print("GPU not available. Model loaded on CPU.")

        # Create a pipeline for text generation
        generator = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device=0 if device == "cuda" else -1  # Set device index
        )

        return generator, tokenizer

    except Exception as e:
        print(f"Error initializing model and tokenizer: {str(e)}")
        raise

def evaluate_model(generator, tokenizer, device, data_path='test.json'):
    """Evaluate the model using BLEU, ROUGE, and BERTScore, and write outputs to Excel."""
    try:
        # Load dataset
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)["data"]

        # Initialize ROUGE scorer
        rouge = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)

        # Store evaluation results
        results = []

        for idx, item in enumerate(data):
            print(f"Processing item {idx + 1}/{len(data)}")

            # Prepare inputs
            prompt = item['prompt']
            reference_answer = item['answer']

            # Measure processing time
            start_time = time.time()

            # Generate model output
            generated = generator(
                prompt,
                max_length=200,  # Adjust maximum length to reduce memory usage
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                truncation=True  # Explicitly enable truncation
            )[0]['generated_text']

            end_time = time.time()
            processing_time = end_time - start_time  # Time in seconds

            # Calculate BLEU and ROUGE scores
            bleu_score = compute_bleu(reference_answer, generated)
            rouge_scores = rouge.score(reference_answer, generated)

            # Store the results
            results.append({
                "prompt": prompt,
                "reference": reference_answer,
                "generated": generated,
                "processing_time": processing_time,  # Add processing time to results
                "bleu": bleu_score,
                "rouge1": rouge_scores['rouge1'].fmeasure,
                "rouge2": rouge_scores['rouge2'].fmeasure,
                "rougeL": rouge_scores['rougeL'].fmeasure
            })

        # Prepare lists of references and generated texts for BERTScore
        references = [result['reference'] for result in results]
        generated_texts = [result['generated'] for result in results]

        # Calculate BERTScore
        P, R, F1 = bert_score.score(
            generated_texts,
            references,
            model_type='bert-base-multilingual-cased',  # Suitable for multiple languages including Malay
            device=device,
            lang=None,
            rescale_with_baseline=False
        )

        # Add BERTScore to results
        for idx, result in enumerate(results):
            result["bertscore"] = F1[idx].item()

        # Write results to Excel file
        df = pd.DataFrame(results)
        df.to_excel('mallam_results.xlsx', index=False)

        return results

    except Exception as e:
        print(f"Error during evaluation: {str(e)}")
        raise

def compute_bleu(reference, hypothesis):
    """Compute BLEU score between reference and hypothesis."""
    try:
        reference = [reference.split()]
        hypothesis = hypothesis.split()
        return nltk.translate.bleu_score.sentence_bleu(reference, hypothesis)
    except Exception as e:
        print(f"Error computing BLEU score: {str(e)}")
        return 0.0

def main():

    print("Script Python executable:", sys.executable)
    # Ensure NLTK tokenizer is available
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')

    # Check if GPU is available
    if torch.cuda.is_available():
        device = 'cuda'
        print("GPU is available. Utilizing GPU for computations.")
    else:
        device = 'cpu'
        print("GPU not available. Falling back to CPU.")

    # Initialize model and tokenizer
    generator, tokenizer = setup_model_and_tokenizer(device)

    # Run evaluation
    results = evaluate_model(generator, tokenizer, device=device)

    # Results are saved to 'mallam_results.xlsx'
    print("Evaluation complete. Results saved to 'mallam_results.xlsx'.")

if __name__ == "__main__":
    main()
