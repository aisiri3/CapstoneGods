import unittest
from unittest.mock import patch, MagicMock
import torch
import platform
import time
import sys
import os

# Import the module to test
# Make sure malay.py is in the same directory or in your Python path
import malay

class TestMalayModule(unittest.TestCase):
    """Test cases for the Malay LLM module."""
    
    def setUp(self):
        """Set up test environment before each test."""
        # Reset the global pipeline before each test
        malay.mallam_pipeline = None
    
    @patch('malay.login')
    def test_login_huggingface(self, mock_login):
        """Test Hugging Face login functionality."""
        test_token = "hf_test_token"
        malay.login_huggingface(test_token)
        mock_login.assert_called_once_with(test_token)
    
    @patch('malay.AutoTokenizer.from_pretrained')
    @patch('malay.pipeline')
    @patch('nltk.download')
    @patch('nltk.data.find')
    def test_init_model(self, mock_find, mock_download, mock_pipeline, mock_tokenizer):
        """Test model initialization."""
        # Configure mocks
        mock_find.side_effect = LookupError()  # Force NLTK download
        mock_pipeline.return_value = MagicMock()
        
        # Call the function
        pipeline_result = malay.init_model()
        
        # Verify NLTK tokenizer was checked and downloaded
        mock_find.assert_called_once()
        mock_download.assert_called_once_with('punkt')
        
        # Verify tokenizer initialization
        mock_tokenizer.assert_called_once_with("mesolitica/mallam-5B-4096")
        
        # Verify pipeline creation
        mock_pipeline.assert_called_once()
        self.assertEqual(pipeline_result, mock_pipeline.return_value)
    
    def test_get_response_answer_format(self):
        """Test response extraction when 'Answer:' is present."""
        # Create a mock pipeline that returns a predetermined response
        mock_pipeline = MagicMock()
        mock_pipeline.return_value = [{
            "generated_text": "Question: What day is it today?\nAnswer: Today is Monday."
        }]
        
        # Test the function
        prompt = "What day is it today?"
        answer, elapsed = malay.get_response(mock_pipeline, prompt)
        
        # Verify correct answer extraction
        self.assertEqual(answer, "Today is Monday.")
        
        # Verify pipeline was called with correct parameters
        mock_pipeline.assert_called_once()
        call_args = mock_pipeline.call_args[1]
        self.assertEqual(call_args["do_sample"], True)
        self.assertEqual(call_args["max_length"], 200)
    
    def test_get_response_no_answer_marker(self):
        """Test response extraction when 'Answer:' is not present."""
        # Mock pipeline with a response without the Answer: marker
        mock_pipeline = MagicMock()
        prompt = "Translate to Malay: Hello"
        mock_pipeline.return_value = [{
            "generated_text": prompt + " Halo"
        }]
        
        # Test the function
        answer, elapsed = malay.get_response(mock_pipeline, prompt)
        
        # Verify correct answer extraction
        self.assertEqual(answer, "Halo")
    
    @patch('malay.get_model')
    def test_generate_mallam_response_normal(self, mock_get_model):
        """Test the main response generation function with normal input."""
        # Configure mock
        mock_pipeline = MagicMock()
        mock_pipeline.return_value = [{
            "generated_text": "hari ini hari apa? Hari ini adalah hari Selasa."
        }]
        mock_get_model.return_value = mock_pipeline
        
        # Test function
        text = "hari ini hari apa?"
        response = malay.generate_mallam_response(text)
        
        # Verify response
        self.assertEqual(response, "Hari ini adalah hari Selasa.")
        
        # Verify model was called with correct parameters
        mock_pipeline.assert_called_once()
        call_args = mock_pipeline.call_args[1]
        self.assertEqual(call_args["do_sample"], True)
        self.assertEqual(call_args["temperature"], 0.7)
    
    @patch('malay.get_model')
    def test_generate_mallam_response_exception(self, mock_get_model):
        """Test error handling in response generation."""
        # Configure mock to raise an exception
        mock_get_model.side_effect = Exception("Test exception")
        
        # Test function with exception
        text = "test prompt"
        response = malay.generate_mallam_response(text)
        
        # Verify fallback response
        self.assertTrue(text in response)
        self.assertTrue("Saya tidak dapat memproses" in response)
    
    @patch('platform.system')
    @patch('malay.AutoModelForCausalLM.from_pretrained')
    @patch('malay.AutoTokenizer.from_pretrained')
    @patch('malay.pipeline')
    def test_get_model_windows(self, mock_pipeline, mock_tokenizer, mock_model, mock_platform):
        """Test model loading on Windows platform."""
        # Configure mocks
        mock_platform.return_value = "Windows"
        mock_model.return_value = MagicMock()
        mock_tokenizer.return_value = MagicMock()
        mock_pipeline.return_value = MagicMock()
        
        # Call the function
        result = malay.get_model()
        
        # Verify Windows-specific loading was used
        mock_model.assert_called_once()
        call_kwargs = mock_model.call_args[1]
        self.assertEqual(call_kwargs["device_map"], "auto")
        self.assertEqual(call_kwargs["torch_dtype"], torch.float16)
        self.assertEqual(call_kwargs["low_cpu_mem_usage"], True)
        
        # BitsAndBytes should NOT be used on Windows
        self.assertNotIn("quantization_config", call_kwargs)
        
        # Verify pipeline was created
        mock_pipeline.assert_called_once()
        self.assertIsNotNone(result)
        self.assertEqual(malay.mallam_pipeline, mock_pipeline.return_value)
    
    @patch('platform.system')
    @patch('malay.BitsAndBytesConfig', create=True)  # create=True allows mocking a potentially non-existent attribute
    @patch('malay.AutoModelForCausalLM.from_pretrained')
    @patch('malay.AutoTokenizer.from_pretrained')
    @patch('malay.pipeline')
    def test_get_model_linux(self, mock_pipeline, mock_tokenizer, mock_model, mock_bnb, mock_platform):
        """Test model loading on Linux platform with BitsAndBytes."""
        # Configure mocks
        mock_platform.return_value = "Linux"
        mock_bnb.return_value = "mock_quantization_config"
        mock_model.return_value = MagicMock()
        mock_tokenizer.return_value = MagicMock()
        mock_pipeline.return_value = MagicMock()
        
        # Call the function
        result = malay.get_model()
        
        # Verify Linux-specific loading with BitsAndBytes
        mock_model.assert_called_once()
        call_kwargs = mock_model.call_args[1]
        self.assertEqual(call_kwargs["device_map"], "auto")
        self.assertEqual(call_kwargs["quantization_config"], "mock_quantization_config")
        self.assertEqual(call_kwargs["offload_folder"], "offload_malay")
        
        # Verify pipeline was created
        mock_pipeline.assert_called_once()
        self.assertIsNotNone(result)
    
    @patch('platform.system')
    @patch('malay.AutoModelForCausalLM.from_pretrained')
    @patch('malay.pipeline')
    def test_get_model_fallback(self, mock_pipeline, mock_model, mock_platform):
        """Test fallback initialization when primary method fails."""
        # Configure primary method to fail
        mock_platform.return_value = "Windows"
        mock_model.side_effect = Exception("Primary initialization failed")
        
        # Configure fallback to succeed
        mock_pipeline.return_value = MagicMock()
        
        # Call the function
        result = malay.get_model()
        
        # Verify fallback pipeline was created
        self.assertEqual(mock_pipeline.call_count, 1)
        call_args = mock_pipeline.call_args[0]
        self.assertEqual(call_args[0], "text-generation")
        self.assertEqual(call_args[1]["model"], "mesolitica/mallam-5B-4096")
        
        # Verify result
        self.assertIsNotNone(result)
        self.assertEqual(malay.mallam_pipeline, mock_pipeline.return_value)
    
    @patch('platform.system')
    @patch('malay.AutoModelForCausalLM.from_pretrained')
    @patch('malay.pipeline')
    def test_get_model_double_failure(self, mock_pipeline, mock_model, mock_platform):
        """Test behavior when both primary and fallback methods fail."""
        # Make both attempts fail
        mock_platform.return_value = "Windows"
        mock_model.side_effect = Exception("Primary initialization failed")
        mock_pipeline.side_effect = Exception("Fallback initialization failed")
        
        # Call the function and expect exception
        with self.assertRaises(Exception):
            malay.get_model()
    
    def test_module_import(self):
        """Test that the module can be imported correctly."""
        self.assertIsNotNone(malay)
        self.assertTrue(hasattr(malay, 'get_model'))
        self.assertTrue(hasattr(malay, 'generate_mallam_response'))


class TestIntegration(unittest.TestCase):
    """Integration tests with actual model.
    
    These tests are marked with @unittest.skip by default as they require
    the actual model and can be slow. Remove the skip decorator to run them.
    """
    
    @unittest.skip("Requires actual model - remove this decorator to run")
    def test_actual_model_response(self):
        """Test with the actual model to verify real responses.
        
        This test requires internet access and the actual model.
        """
        # Reset the pipeline
        malay.mallam_pipeline = None
        
        # Generate an actual response
        prompt = "Translate to Malay: The weather is nice today"
        response = malay.generate_mallam_response(prompt)
        
        # Verify response contains expected Malay words
        expected_words = ["cuaca", "hari", "baik", "ini"]
        self.assertTrue(
            any(word in response.lower() for word in expected_words),
            f"Response doesn't contain expected Malay words: {response}"
        )
    
    @unittest.skip("Performance test - only run manually")
    def test_performance(self):
        """Test model performance with various inputs.
        
        This test is resource-intensive and should be run manually.
        """
        # Reset the pipeline
        malay.mallam_pipeline = None
        
        # Test cases with increasing complexity
        test_cases = [
            "Hello",  # Very short
            "Translate this sentence to Malay",  # Short
            "Explain the concept of artificial intelligence in simple terms" * 3  # Long
        ]
        
        # Get the model once
        model = malay.get_model()
        
        results = []
        for prompt in test_cases:
            start_time = time.time()
            response = malay.generate_mallam_response(prompt)
            end_time = time.time()
            
            results.append({
                "prompt_length": len(prompt),
                "response_length": len(response),
                "time_taken": end_time - start_time
            })
        
        # Print performance results
        print("\nPerformance Test Results:")
        for i, result in enumerate(results):
            print(f"Test {i+1}: Prompt length: {result['prompt_length']}, "
                  f"Response length: {result['response_length']}, "
                  f"Time: {result['time_taken']:.2f}s")


if __name__ == '__main__':
    unittest.main()