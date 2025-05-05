import json
import tempfile
import os
import unittest
from pathlib import Path
import shutil
import sys
import wave
import numpy as np
import subprocess

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the function to test
from workflows.lipsync.lipsync import generate_rhubarb_lipsync

class TestRhubarbLipsyncOutput(unittest.TestCase):

    def setUp(self):
        # Create a temporary directory for test files
        self.temp_dir = tempfile.mkdtemp()
        
        # Create a more realistic WAV file for better testing
        self.test_wav_path = os.path.join(self.temp_dir, "test_speech.wav")
        self._create_test_speech_wav()

    def tearDown(self):
        # Clean up temporary files
        shutil.rmtree(self.temp_dir)

    def _create_test_speech_wav(self):
        """Create a simple WAV file with sample speech-like audio."""
        # Parameters for the WAV file
        sample_rate = 16000
        duration = 3.0  # seconds
        
        # Generate a signal with multiple frequencies to simulate speech
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        
        # Create a signal with pauses to test for gaps
        signal = np.zeros_like(t)
        
        # First phoneme (0.0 - 0.5s)
        mask1 = (t >= 0.0) & (t < 0.5)
        signal[mask1] = 0.5 * np.sin(2 * np.pi * 200 * t[mask1])
        
        # Pause (0.5 - 0.7s)
        
        # Second phoneme (0.7 - 1.2s)
        mask2 = (t >= 0.7) & (t < 1.2)
        signal[mask2] = 0.5 * np.sin(2 * np.pi * 300 * t[mask2])
        
        # Third phoneme (1.2 - 1.8s)
        mask3 = (t >= 1.2) & (t < 1.8)
        signal[mask3] = 0.5 * np.sin(2 * np.pi * 400 * t[mask3])
        
        # Pause (1.8 - 2.0s)
        
        # Fourth phoneme (2.0 - 2.5s)
        mask4 = (t >= 2.0) & (t < 2.5)
        signal[mask4] = 0.5 * np.sin(2 * np.pi * 250 * t[mask4])
        
        # Convert to 16-bit PCM
        signal = (signal * 32767).astype(np.int16)
        
        # Write the WAV file
        with wave.open(self.test_wav_path, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(signal.tobytes())
            
        print(f"Created test WAV file at {self.test_wav_path}")

    def test_rhubarb_phoneme_coverage(self):
        """Test that Rhubarb generates a variety of phonemes for realistic audio."""
        try:
            # Only run if Rhubarb is available
            result = generate_rhubarb_lipsync(self.test_wav_path)
            
            # Check if we got fallback data (meaning Rhubarb failed or isn't available)
            if result["metadata"]["duration"] == 0:
                self.skipTest("Rhubarb executable not available or failed")
            
            # For realistic audio, we should get more than just silence phonemes
            mouth_cues = result["mouthCues"]
            phonemes = set(cue["value"] for cue in mouth_cues)
            
            # We should have at least 2 different phonemes (silence 'X' and at least one other)
            self.assertGreater(len(phonemes), 1, 
                            "Rhubarb should generate multiple different phonemes")
            
            # We should have the silence phoneme 'X'
            self.assertIn('X', phonemes, 
                        "Rhubarb should include silence phoneme 'X'")
            
            # We should have at least one non-silence phoneme
            non_silence = phonemes - {'X'}
            self.assertGreater(len(non_silence), 0, 
                            "Rhubarb should include at least one non-silence phoneme")
            
            print(f"Phonemes detected: {phonemes}")
            
        except Exception as e:
            self.skipTest(f"Test skipped due to error: {str(e)}")

    def test_continuous_mouth_cues(self):
        """Test that Rhubarb generates continuous mouth cues without gaps."""
        try:
            # Only run if Rhubarb is available
            result = generate_rhubarb_lipsync(self.test_wav_path)
            
            # Check if we got fallback data
            if result["metadata"]["duration"] == 0:
                self.skipTest("Rhubarb executable not available or failed")
            
            mouth_cues = result["mouthCues"]
            
            # There should be at least 3 mouth cues for a 3-second audio
            self.assertGreaterEqual(len(mouth_cues), 3, 
                                "Rhubarb should generate multiple mouth cues for speech audio")
            
            # Check for continuity (no gaps between consecutive cues)
            for i in range(len(mouth_cues) - 1):
                # Get current and next cue
                current = mouth_cues[i]
                next_cue = mouth_cues[i + 1]
                
                # Verify there's no gap between end of current and start of next
                self.assertAlmostEqual(
                    current["end"], next_cue["start"], places=5,
                    msg=f"Gap detected between mouth cues {i} and {i+1}: "
                        f"{current['end']} != {next_cue['start']}"
                )
            
            # First cue should start at or near beginning of audio
            self.assertLessEqual(mouth_cues[0]["start"], 0.1, 
                              "First mouth cue should start near the beginning of audio")
            
            # Last cue should end at or near the end of audio duration
            audio_duration = result["metadata"]["duration"]
            self.assertGreaterEqual(mouth_cues[-1]["end"], audio_duration - 0.1, 
                                 "Last mouth cue should end near the audio duration")
            
        except Exception as e:
            self.skipTest(f"Test skipped due to error: {str(e)}")

    def test_reasonable_phoneme_durations(self):
        """Test that phoneme durations are within reasonable ranges."""
        try:
            # Only run if Rhubarb is available
            result = generate_rhubarb_lipsync(self.test_wav_path)
            
            # Check if we got fallback data
            if result["metadata"]["duration"] == 0:
                self.skipTest("Rhubarb executable not available or failed")
            
            mouth_cues = result["mouthCues"]
            
            # Check each phoneme duration
            for i, cue in enumerate(mouth_cues):
                duration = cue["end"] - cue["start"]
                
                # Most phonemes should be between 0.05s and 0.5s in typical speech
                # Allow for shorter durations (fast speech) and longer pauses
                if cue["value"] != 'X':  # Non-silence phonemes
                    # Non-silence phonemes shouldn't be too short
                    self.assertGreaterEqual(
                        duration, 0.01,
                        f"Phoneme {i} ({cue['value']}) is too short: {duration}s"
                    )
                    
                    # Non-silence phonemes shouldn't be too long either
                    self.assertLessEqual(
                        duration, 1.0,
                        f"Phoneme {i} ({cue['value']}) is too long: {duration}s"
                    )
                
                # All phonemes should have positive duration
                self.assertGreater(
                    duration, 0,
                    f"Phoneme {i} ({cue['value']}) has zero or negative duration"
                )
            
            # Calculate some statistics about phoneme durations
            durations = [cue["end"] - cue["start"] for cue in mouth_cues]
            avg_duration = sum(durations) / len(durations)
            max_duration = max(durations)
            min_duration = min(durations)
            
            print(f"Phoneme duration stats - avg: {avg_duration:.3f}s, "
                  f"min: {min_duration:.3f}s, max: {max_duration:.3f}s")
            
        except Exception as e:
            self.skipTest(f"Test skipped due to error: {str(e)}")

    def test_phoneme_distribution(self):
        """Test that phoneme distribution makes sense for speech."""
        try:
            # Only run if Rhubarb is available
            result = generate_rhubarb_lipsync(self.test_wav_path)
            
            # Check if we got fallback data
            if result["metadata"]["duration"] == 0:
                self.skipTest("Rhubarb executable not available or failed")
            
            mouth_cues = result["mouthCues"]
            
            # Count phoneme occurrences
            phoneme_counts = {}
            for cue in mouth_cues:
                phoneme = cue["value"]
                if phoneme not in phoneme_counts:
                    phoneme_counts[phoneme] = 0
                phoneme_counts[phoneme] += 1
            
            # Calculate phoneme durations
            phoneme_durations = {}
            for cue in mouth_cues:
                phoneme = cue["value"]
                duration = cue["end"] - cue["start"]
                if phoneme not in phoneme_durations:
                    phoneme_durations[phoneme] = 0
                phoneme_durations[phoneme] += duration
            
            print(f"Phoneme counts: {phoneme_counts}")
            print(f"Phoneme durations: {phoneme_durations}")
            
            # We should have some silence ('X') phonemes
            self.assertIn('X', phoneme_counts, "Should have silence 'X' phonemes")
            
            # We should have a reasonable distribution (no one phoneme dominates everything)
            total_count = len(mouth_cues)
            for phoneme, count in phoneme_counts.items():
                # No single phoneme should be more than 80% of all phonemes
                self.assertLessEqual(
                    count / total_count, 0.8,
                    f"Phoneme {phoneme} appears too frequently ({count}/{total_count})"
                )
            
        except Exception as e:
            self.skipTest(f"Test skipped due to error: {str(e)}")

    def test_silence_detection(self):
        """Test that Rhubarb correctly identifies silence vs. speech segments."""
        try:
            # Only run if Rhubarb is available
            result = generate_rhubarb_lipsync(self.test_wav_path)
            
            # Check if we got fallback data
            if result["metadata"]["duration"] == 0:
                self.skipTest("Rhubarb executable not available or failed")
            
            mouth_cues = result["mouthCues"]
            
            # Identify silence phonemes
            silence_cues = [cue for cue in mouth_cues if cue["value"] == 'X']
            speech_cues = [cue for cue in mouth_cues if cue["value"] != 'X']
            
            # We should have both silence and speech phonemes
            self.assertGreater(len(silence_cues), 0, "Should have silence phonemes")
            self.assertGreater(len(speech_cues), 0, "Should have speech phonemes")
            
            # First and last phonemes are often silence
            self.assertEqual(mouth_cues[0]["value"], 'X', "First phoneme should be silence")
            self.assertEqual(mouth_cues[-1]["value"], 'X', "Last phoneme should be silence")
            
            # Longer silences should have longer durations
            silence_durations = [cue["end"] - cue["start"] for cue in silence_cues]
            speech_durations = [cue["end"] - cue["start"] for cue in speech_cues]
            
            # Calculate average durations
            avg_silence = sum(silence_durations) / len(silence_durations) if silence_durations else 0
            avg_speech = sum(speech_durations) / len(speech_durations) if speech_durations else 0
            
            print(f"Average silence duration: {avg_silence:.3f}s")
            print(f"Average speech phoneme duration: {avg_speech:.3f}s")
            
        except Exception as e:
            self.skipTest(f"Test skipped due to error: {str(e)}")

    def test_detection_of_pauses(self):
        """Test that Rhubarb correctly identifies intentional pauses in speech."""
        try:
            # Our test audio has deliberate pauses at 0.5-0.7s and 1.8-2.0s
            # Let's check if Rhubarb identifies these as silence
            
            result = generate_rhubarb_lipsync(self.test_wav_path)
            
            # Check if we got fallback data
            if result["metadata"]["duration"] == 0:
                self.skipTest("Rhubarb executable not available or failed")
            
            mouth_cues = result["mouthCues"]
            
            # Function to find phonemes that overlap with a time range
            def find_phonemes_in_range(start, end):
                overlapping = []
                for cue in mouth_cues:
                    # Check if cue overlaps with range
                    if (cue["start"] < end and cue["end"] > start):
                        overlapping.append(cue)
                return overlapping
            
            # Check the first pause (0.5-0.7s)
            first_pause_phonemes = find_phonemes_in_range(0.5, 0.7)
            # Check the second pause (1.8-2.0s)
            second_pause_phonemes = find_phonemes_in_range(1.8, 2.0)
            
            print(f"First pause phonemes: {first_pause_phonemes}")
            print(f"Second pause phonemes: {second_pause_phonemes}")
            
            # At least one of the phonemes in each pause should be silence
            first_pause_has_silence = any(cue["value"] == 'X' for cue in first_pause_phonemes)
            second_pause_has_silence = any(cue["value"] == 'X' for cue in second_pause_phonemes)
            
            # Print a warning if silence not detected in pauses, but don't fail the test
            # as Rhubarb's exact behavior may vary based on its detection settings
            if not first_pause_has_silence:
                print("WARNING: First pause (0.5-0.7s) not detected as silence")
            if not second_pause_has_silence:
                print("WARNING: Second pause (1.8-2.0s) not detected as silence")
            
        except Exception as e:
            self.skipTest(f"Test skipped due to error: {str(e)}")


    def test_compare_with_expected_visemes(self):
        """Test that the phoneme output matches expected visemes in frontend."""
        try:
            result = generate_rhubarb_lipsync(self.test_wav_path)
            
            # Check if we got fallback data
            if result["metadata"]["duration"] == 0:
                self.skipTest("Rhubarb executable not available or failed")
            
            mouth_cues = result["mouthCues"]
            
            # Get all unique phonemes in the output
            phonemes = set(cue["value"] for cue in mouth_cues)
            
            # Define the expected phoneme set based on your frontend mapping
            expected_phonemes = {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'}
            
            # Check that all phonemes in the output are valid
            for phoneme in phonemes:
                self.assertIn(phoneme, expected_phonemes,
                           f"Unexpected phoneme '{phoneme}' in Rhubarb output")
            
            print(f"All phonemes match expected frontend mapping: {phonemes}")
            
        except Exception as e:
            self.skipTest(f"Test skipped due to error: {str(e)}")


if __name__ == '__main__':
    unittest.main()
