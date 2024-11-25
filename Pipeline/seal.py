import json
import pandas as pd
from rouge_score import rouge_scorer
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import nltk
import bert_score
import time
import sys


def setup_model_and_tokenizer(device):
    """Setup the SeaLLMs model and tokenizer with GPU support if available."""
    try:
        # Initialize tokenizer
        tokenizer = AutoTokenizer.from_pretrained("SeaLLMs/SeaLLMs-v3-7B-Chat", trust_remote_code=True)

        # Load model and move it to the appropriate device
        model = AutoModelForCausalLM.from_pretrained(
            "SeaLLMs/SeaLLMs-v3-7B-Chat",
            trust_remote_code=True,
            torch_dtype=torch.bfloat16 if device == "cuda" else torch.float32,
            device_map="auto"  # Automatically map to GPU or CPU
        )

        print(f"Model loaded on {device.upper()}.")

        return model, tokenizer

    except Exception as e:
        print(f"Error initializing model and tokenizer: {e}")
        raise


def compute_bleu(reference, hypothesis):
    """Compute BLEU score between reference and hypothesis."""
    try:
        reference = [reference.split()]
        hypothesis = hypothesis.split()
        return nltk.translate.bleu_score.sentence_bleu(reference, hypothesis)
    except Exception as e:
        print(f"Error computing BLEU score: {e}")
        return 0.0


def evaluate_model(model, tokenizer, device, data_path='grammer.json'):
    """Evaluate the model using BLEU, ROUGE, and BERTScore, and write outputs to an Excel file."""
    try:
        # Load dataset
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)["data"]

        # Initialize ROUGE scorer
        rouge = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)

        # Ensure NLTK is ready for BLEU computation
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')

        # Store evaluation results
        results = []

        for idx, item in enumerate(data):
            print(f"Processing item {idx + 1}/{len(data)}")

            # Prepare inputs
            prompt = item['prompt']
            reference_answer = item['answer']
            messages = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ]

            try:
                # Format input and send to model
                text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                model_inputs = tokenizer([text], return_tensors="pt").to(device)

                # Measure processing time
                start_time = time.time()
                generated_ids = model.generate(
                    model_inputs.input_ids,
                    max_new_tokens=128,  # Adjust maximum token length
                    do_sample=True,
                    temperature=0.7,  # Use a stable temperature
                    top_k=50,  # Top-k sampling
                    top_p=0.9  # Nucleus sampling
                )
                end_time = time.time()
                processing_time = end_time - start_time

                # Decode response
                generated_ids = [
                    output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
                ]
                generated_text = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]

                # Compute evaluation metrics
                bleu_score = compute_bleu(reference_answer, generated_text)
                rouge_scores = rouge.score(reference_answer, generated_text)

                # Append results
                results.append({
                    "prompt": prompt,
                    "reference": reference_answer,
                    "generated": generated_text,
                    "processing_time": processing_time,
                    "bleu": bleu_score,
                    "rouge1": rouge_scores['rouge1'].fmeasure,
                    "rouge2": rouge_scores['rouge2'].fmeasure,
                    "rougeL": rouge_scores['rougeL'].fmeasure
                })

            except Exception as gen_error:
                print(f"Error generating output for item {idx + 1}: {gen_error}")
                results.append({
                    "prompt": prompt,
                    "reference": reference_answer,
                    "generated": "",
                    "processing_time": 0,
                    "bleu": 0,
                    "rouge1": 0,
                    "rouge2": 0,
                    "rougeL": 0
                })

        # Prepare lists of references and generated texts for BERTScore
        references = [result['reference'] for result in results]
        generated_texts = [result['generated'] for result in results]

        # Calculate BERTScore
        try:
            if any(generated_texts):
                P, R, F1 = bert_score.score(
                    generated_texts,
                    references,
                    model_type='bert-base-multilingual-cased',  # Suitable for multiple languages
                    device=device
                )
                for idx, result in enumerate(results):
                    result["bertscore"] = F1[idx].item() if result["generated"] else 0.0
            else:
                print("No valid generated texts for BERTScore.")
        except Exception as bert_error:
            print(f"Error calculating BERTScore: {bert_error}")
            for result in results:
                result["bertscore"] = 0.0

        # Write results to Excel
        df = pd.DataFrame(results)
        df.to_excel('seal_results.xlsx', index=False)

        print("Evaluation complete. Results saved to 'seal_results.xlsx'.")

    except Exception as e:
        print(f"Error during evaluation: {e}")
        raise


def main():
    print("Script Python executable:", sys.executable)

    # Check if GPU is available
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")

    # Initialize model and tokenizer
    model, tokenizer = setup_model_and_tokenizer(device)

    # Run evaluation
    evaluate_model(model, tokenizer, device=device)


if __name__ == "__main__":
    main()
