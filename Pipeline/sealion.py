import json
import nltk
from rouge_score import rouge_scorer
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline


def setup_model_and_tokenizer():
    """Setup the MaLLaM model and tokenizer with memory optimizations."""
    try:
        # Initialize tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            "mesolitica/mallam-5B-4096"
        )

        # Load model with quantization and offloading for memory efficiency
        model = AutoModelForCausalLM.from_pretrained(
            "mesolitica/mallam-5B-4096",
            torch_dtype="auto",
            device_map="auto"  # Use Accelerate for efficient device placement
        )

        # Create a pipeline for text generation
        generator = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device_map="auto"  # Automatic device handling
        )

        return generator, tokenizer

    except Exception as e:
        print(f"Error initializing model and tokenizer: {str(e)}")
        raise


def evaluate_model(generator, tokenizer, data_path='test.json'):
    """Evaluate the model using BLEU and ROUGE scores."""
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

            # Generate model output
            generated = generator(
                prompt,
                max_length=40,  # Adjust maximum length to reduce memory usage
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                truncation=True  # Explicitly enable truncation
            )[0]['generated_text']

            # Calculate BLEU and ROUGE scores
            bleu_score = compute_bleu(reference_answer, generated)
            rouge_scores = rouge.score(reference_answer, generated)

            # Store the results
            results.append({
                "prompt": prompt,
                "reference": reference_answer,
                "generated": generated,
                "bleu": bleu_score,
                "rouge1": rouge_scores['rouge1'].fmeasure,
                "rouge2": rouge_scores['rouge2'].fmeasure,
                "rougeL": rouge_scores['rougeL'].fmeasure
            })

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
    # Ensure NLTK tokenizer is available
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')

    # Initialize model and tokenizer
    generator, tokenizer = setup_model_and_tokenizer()

    # Run evaluation
    results = evaluate_model(generator, tokenizer)

    # Print results
    print("\nEvaluation Results:")
    for idx, result in enumerate(results, 1):
        print(f"\nResult {idx}:")
        print(f"Prompt: {result['prompt']}")
        print(f"Reference: {result['reference']}")
        print(f"Generated: {result['generated']}")
        print(f"BLEU: {result['bleu']:.4f}")
        print(f"ROUGE-1: {result['rouge1']:.4f}")
        print(f"ROUGE-2: {result['rouge2']:.4f}")
        print(f"ROUGE-L: {result['rougeL']:.4f}")


if __name__ == "__main__":
    main()
