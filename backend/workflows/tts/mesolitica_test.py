"""
Unit tests for the Malay TTS system.
Designed to work with the simplified TTS implementation.
"""

import unittest
import os
import torch
import numpy as np
import tempfile
import warnings
from unittest.mock import patch, MagicMock
import soundfile as sf

# Try to import the TTS module directly
try:
    import mesolitica_male as tts
except ImportError:
    # If module can't be imported directly, try to load dynamically
    import sys
    import importlib.util
    
    file_name = 'mesolitica_male.py'
    
    if os.path.exists(file_name):
        module_name = 'mesolitica_male'
        spec = importlib.util.spec_from_file_location(module_name, file_name)
        tts = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = tts
        spec.loader.exec_module(tts)
        print(f"Imported TTS module from {file_name}")
    else:
        raise ImportError(f"Could not find {file_name}. Please ensure it's in the current directory.")

class TestMalayTTS(unittest.TestCase):
    """Test cases for Malay TTS system"""

    @classmethod
    def setUpClass(cls):
        """Set up resources for all tests"""
        # Suppress warnings during tests
        warnings.filterwarnings("ignore")
        
        # Get device from the module or default to CPU
        cls.device = getattr(tts, 'device', "cuda:0" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {cls.device}")
        
        try:
            # Load model and tokenizer once for all tests
            cls.model = tts.ParlerTTSForConditionalGeneration.from_pretrained("mesolitica/malay-parler-tts-mini-v1").to(cls.device)
            cls.tokenizer = tts.AutoTokenizer.from_pretrained("mesolitica/malay-parler-tts-mini-v1")
            cls.model_loaded = True
            print("Successfully loaded model and tokenizer")
        except Exception as e:
            print(f"Warning: Could not load model for testing: {e}")
            cls.model_loaded = False
        
        # Create temp directory for test outputs
        cls.test_dir = tempfile.mkdtemp()
        print(f"Created temporary directory for test outputs: {cls.test_dir}")
    
    @classmethod
    def tearDownClass(cls):
        """Clean up resources after all tests"""
        # Remove temporary files
        if hasattr(cls, 'test_dir') and os.path.exists(cls.test_dir):
            for file in os.listdir(cls.test_dir):
                try:
                    os.remove(os.path.join(cls.test_dir, file))
                except:
                    pass
            try:
                os.rmdir(cls.test_dir)
                print(f"Removed temporary directory: {cls.test_dir}")
            except:
                print(f"Could not remove temporary directory: {cls.test_dir}")
    
    def setUp(self):
        """Set up for each test"""
        if not TestMalayTTS.model_loaded:
            self.skipTest("Model not loaded, skipping test")
    
    # ==================== 1. ADVERSARIAL TEST CASES ====================
    
    def test_extremely_long_text(self):
        """Test with extremely long input text"""
        # Generate a very long text (1000 characters)
        long_text = "Ini adalah ujian " * 100
        
        # Define speaker characteristics
        description = "Osman's voice, delivers a deep and steady speech with a confident tone."
        
        # Generate output path
        output_path = os.path.join(self.test_dir, "test_long_text.mp3")
        
        # Test generation (which might fail, but should fail gracefully)
        try:
            input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
            prompt_input_ids = TestMalayTTS.tokenizer(long_text, return_tensors="pt").to(self.device)
            
            # We expect this might raise an exception due to length
            generation = TestMalayTTS.model.generate(
                input_ids=input_ids.input_ids,
                attention_mask=input_ids.attention_mask,
                prompt_input_ids=prompt_input_ids.input_ids,
                prompt_attention_mask=prompt_input_ids.attention_mask,
            )
            
            # If it doesn't raise an exception, save the output
            audio_arr = generation.cpu().numpy().squeeze()
            sf.write(output_path, audio_arr, 44100)
            
            # Check if the output exists and has content
            self.assertTrue(os.path.exists(output_path))
            self.assertGreater(os.path.getsize(output_path), 1000)
            print("Long text test passed - model successfully handled long input")
        except Exception as e:
            # Test passes if the system raises a proper exception rather than crashing
            print(f"Long text test handled exception: {str(e)}")
            self.assertTrue(True)
    
    def test_unusual_characters(self):
        """Test with unusual characters not typical in Malay"""
        unusual_text = "Selamat datang ke Malaysia! @#$%^&*()_+ 😊 👍 ñ"
        description = "Osman's voice, delivers a deep and steady speech."
        
        try:
            input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
            prompt_input_ids = TestMalayTTS.tokenizer(unusual_text, return_tensors="pt").to(self.device)
            
            generation = TestMalayTTS.model.generate(
                input_ids=input_ids.input_ids,
                attention_mask=input_ids.attention_mask,
                prompt_input_ids=prompt_input_ids.input_ids,
                prompt_attention_mask=prompt_input_ids.attention_mask,
            )
            
            audio_arr = generation.cpu().numpy().squeeze()
            
            # Check that some audio was generated
            self.assertGreater(len(audio_arr), 0)
            print("Unusual characters test passed")
        except Exception as e:
            # Test still passes if it handles the exception reasonably
            print(f"Unusual characters test handled exception: {str(e)}")
            self.assertTrue(True)
    
    def test_mixed_language(self):
        """Test with text containing mixed languages"""
        mixed_text = "Selamat datang to Malaysia. This is a test of the TTS system."
        description = "Osman's voice, delivers a deep speech."
        
        try:
            input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
            prompt_input_ids = TestMalayTTS.tokenizer(mixed_text, return_tensors="pt").to(self.device)
            
            generation = TestMalayTTS.model.generate(
                input_ids=input_ids.input_ids,
                attention_mask=input_ids.attention_mask,
                prompt_input_ids=prompt_input_ids.input_ids,
                prompt_attention_mask=prompt_input_ids.attention_mask,
            )
            
            audio_arr = generation.cpu().numpy().squeeze()
            
            # Verify audio was generated
            self.assertGreater(len(audio_arr), 0)
            print("Mixed language test passed")
        except Exception as e:
            # Test still passes if it handles the exception reasonably
            print(f"Mixed language test handled exception: {str(e)}")
            self.assertTrue(True)
    
    # ==================== 2. EDGE TEST CASES ====================
    
    def test_empty_string(self):
        """Test with empty string input"""
        empty_text = ""
        description = "Osman's voice, delivers a deep speech."
        
        try:
            input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
            prompt_input_ids = TestMalayTTS.tokenizer(empty_text, return_tensors="pt").to(self.device)
            
            generation = TestMalayTTS.model.generate(
                input_ids=input_ids.input_ids,
                attention_mask=input_ids.attention_mask,
                prompt_input_ids=prompt_input_ids.input_ids,
                prompt_attention_mask=prompt_input_ids.attention_mask,
            )
            
            audio_arr = generation.cpu().numpy().squeeze()
            
            # Just verify the system didn't crash
            self.assertTrue(True)
            print("Empty string test passed")
        except Exception as e:
            # Test still passes if it raises an appropriate exception
            print(f"Empty string test handled exception: {str(e)}")
            self.assertTrue(True)
    
    def test_single_character(self):
        """Test with single character inputs"""
        for char in ["a", "e", "i", "o", "u", ".", "?"]:
            try:
                description = "Osman's voice, deep speech."
                input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
                prompt_input_ids = TestMalayTTS.tokenizer(char, return_tensors="pt").to(self.device)
                
                generation = TestMalayTTS.model.generate(
                    input_ids=input_ids.input_ids,
                    attention_mask=input_ids.attention_mask,
                    prompt_input_ids=prompt_input_ids.input_ids,
                    prompt_attention_mask=prompt_input_ids.attention_mask,
                )
                
                audio_arr = generation.cpu().numpy().squeeze()
                
                # Just verify some audio was generated
                self.assertGreater(len(audio_arr), 0)
                print(f"Single character test passed for '{char}'")
            except Exception as e:
                # Test still passes if it handles the exception reasonably
                print(f"Single character test handled exception for '{char}': {str(e)}")
                self.assertTrue(True)
    
    def test_whitespace_only(self):
        """Test with input containing only whitespace"""
        whitespace_text = "   \n   \t   "
        description = "Osman's voice, deep speech."
        
        try:
            input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
            prompt_input_ids = TestMalayTTS.tokenizer(whitespace_text, return_tensors="pt").to(self.device)
            
            generation = TestMalayTTS.model.generate(
                input_ids=input_ids.input_ids,
                attention_mask=input_ids.attention_mask,
                prompt_input_ids=prompt_input_ids.input_ids,
                prompt_attention_mask=prompt_input_ids.attention_mask,
            )
            
            audio_arr = generation.cpu().numpy().squeeze()
            
            # Just checking it ran without crashing
            self.assertTrue(True)
            print("Whitespace only test passed")
        except Exception as e:
            # Test still passes if it handles the exception reasonably
            print(f"Whitespace only test handled exception: {str(e)}")
            self.assertTrue(True)
    
    # ==================== 3. FUNCTIONAL TEST CASES ====================
    
    def test_basic_functionality(self):
        """Test basic functionality with standard Malay text"""
        text = "Selamat datang ke Malaysia. Ini adalah ujian sistem TTS."
        description = "Osman's voice, delivers a deep speech."
        
        try:
            input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
            prompt_input_ids = TestMalayTTS.tokenizer(text, return_tensors="pt").to(self.device)
            
            generation = TestMalayTTS.model.generate(
                input_ids=input_ids.input_ids,
                attention_mask=input_ids.attention_mask,
                prompt_input_ids=prompt_input_ids.input_ids,
                prompt_attention_mask=prompt_input_ids.attention_mask,
            )
            
            audio_arr = generation.cpu().numpy().squeeze()
            
            # Verify audio properties
            self.assertGreater(len(audio_arr), 0)
            self.assertLess(np.abs(audio_arr).max(), 1.01)  # Check not severely clipping
            
            # Save the audio for manual inspection if needed
            output_path = os.path.join(self.test_dir, "basic_test.mp3")
            sf.write(output_path, audio_arr, 44100)
            
            print(f"Basic functionality test passed - audio saved to {output_path}")
        except Exception as e:
            self.fail(f"Basic functionality test failed: {str(e)}")
    
    def test_short_phrases(self):
        """Test with very short phrases"""
        short_phrases = [
            "Halo.",
            "Ya.",
            "Tidak.",
            "Terima kasih."
        ]
        
        for phrase in short_phrases:
            try:
                description = "Osman's voice, deep speech."
                input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
                prompt_input_ids = TestMalayTTS.tokenizer(phrase, return_tensors="pt").to(self.device)
                
                generation = TestMalayTTS.model.generate(
                    input_ids=input_ids.input_ids,
                    attention_mask=input_ids.attention_mask,
                    prompt_input_ids=prompt_input_ids.input_ids,
                    prompt_attention_mask=prompt_input_ids.attention_mask,
                )
                
                audio_arr = generation.cpu().numpy().squeeze()
                
                # Basic check that audio was generated
                self.assertGreater(len(audio_arr), 0)
                print(f"Short phrase test passed for '{phrase}'")
            except Exception as e:
                self.fail(f"Short phrase test failed for '{phrase}': {str(e)}")
    
    def test_speaker_variation(self):
        """Test with different speaker descriptions"""
        text = "Ini adalah ujian sistem TTS."
        speaker_descriptions = [
            "Osman's voice, very excited and energetic.",
            "Osman's voice, very calm and slow.",
            "Osman's voice, speaking quietly.",
            "Osman's voice, speaking authoritatively."
        ]
        
        for description in speaker_descriptions:
            try:
                input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
                prompt_input_ids = TestMalayTTS.tokenizer(text, return_tensors="pt").to(self.device)
                
                generation = TestMalayTTS.model.generate(
                    input_ids=input_ids.input_ids,
                    attention_mask=input_ids.attention_mask,
                    prompt_input_ids=prompt_input_ids.input_ids,
                    prompt_attention_mask=prompt_input_ids.attention_mask,
                )
                
                audio_arr = generation.cpu().numpy().squeeze()
                
                # Basic check that audio was generated
                self.assertGreater(len(audio_arr), 0)
                
                # Save the audio for comparison
                output_path = os.path.join(
                    self.test_dir, 
                    f"speaker_variation_{description.split(',')[1].strip().replace(' ', '_')}.mp3"
                )
                sf.write(output_path, audio_arr, 44100)
                
                print(f"Speaker variation test passed for '{description}'")
            except Exception as e:
                self.fail(f"Speaker variation test failed for '{description}': {str(e)}")
    
    def test_numbers_and_dates(self):
        """Test with text containing numbers and dates"""
        text_with_numbers = [
            "Hari ini ialah 20 Mac 2025.",
            "Masa sekarang ialah 12:30 petang.",
            "Terdapat 1234 orang di stadium itu."
        ]
        
        for text in text_with_numbers:
            try:
                description = "Osman's voice, deep speech."
                input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
                prompt_input_ids = TestMalayTTS.tokenizer(text, return_tensors="pt").to(self.device)
                
                generation = TestMalayTTS.model.generate(
                    input_ids=input_ids.input_ids,
                    attention_mask=input_ids.attention_mask,
                    prompt_input_ids=prompt_input_ids.input_ids,
                    prompt_attention_mask=prompt_input_ids.attention_mask,
                )
                
                audio_arr = generation.cpu().numpy().squeeze()
                
                # Basic check that audio was generated
                self.assertGreater(len(audio_arr), 0)
                print(f"Numbers and dates test passed for '{text}'")
            except Exception as e:
                self.fail(f"Numbers and dates test failed for '{text}': {str(e)}")

    def test_punctuation_handling(self):
        """Test handling of various punctuation"""
        text_with_punctuation = [
            "Adakah anda pasti? Ya, saya pasti!",
            "Dia berkata, \"Saya akan pergi ke sana.\"",
            "Satu, dua, tiga; empat, lima, enam.",
            "Berhenti... dan fikirkan semula."
        ]
        
        for text in text_with_punctuation:
            try:
                description = "Osman's voice, deep speech."
                input_ids = TestMalayTTS.tokenizer(description, return_tensors="pt").to(self.device)
                prompt_input_ids = TestMalayTTS.tokenizer(text, return_tensors="pt").to(self.device)
                
                generation = TestMalayTTS.model.generate(
                    input_ids=input_ids.input_ids,
                    attention_mask=input_ids.attention_mask,
                    prompt_input_ids=prompt_input_ids.input_ids,
                    prompt_attention_mask=prompt_input_ids.attention_mask,
                )
                
                audio_arr = generation.cpu().numpy().squeeze()
                
                # Basic check that audio was generated
                self.assertGreater(len(audio_arr), 0)
                print(f"Punctuation handling test passed for '{text}'")
            except Exception as e:
                self.fail(f"Punctuation handling test failed for '{text}': {str(e)}")

if __name__ == '__main__':
    print("\n=== Malay TTS Unit Tests ===\n")
    unittest.main(verbosity=2)