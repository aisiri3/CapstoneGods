# Using Rhubarb (must be downlaoded in the folder) to generate lipsync

import subprocess
import json
import os
from pathlib import Path

def generate_rhubarb_lipsync(audio_path):
    """
    Generate lip sync data from audio file using Rhubarb Lip Sync.
    
    Args:
        audio_path (str): Path to the input audio WAV file
        
    Returns:
        dict: JSON data containing metadata and mouth cues
    """
    try:
        # Get the absolute path to the Rhubarb executable
        base_dir = Path(__file__).resolve().parents[1]  # Go up 2 levels from current file
        rhubarb_path = base_dir / "Rhubarb-Lip-Sync-1.13.0" / "rhubarb"
        
        # Create output JSON path in the same directory as audio
        audio_dir = Path(audio_path).parent
        json_filename = f"{Path(audio_path).stem}_lipsync.json"
        json_path = audio_dir / json_filename

        # Ensure Rhubarb executable has correct permissions
        if os.name != 'nt':  # Not Windows
            rhubarb_path.chmod(0o755)

        # Build the command
        command = [
            str(rhubarb_path),
            "-f", "json",  # Output format
            str(audio_path),  # Input audio path
            "-o", str(json_path)  # Output JSON path
        ]

        # Run Rhubarb
        print(f"Running Rhubarb command: {' '.join(command)}")
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for the process to complete
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"Rhubarb stderr: {stderr}")
            raise Exception(f"Rhubarb failed with return code {process.returncode}")

        # Read the generated JSON file
        with open(json_path, 'r') as f:
            lipsync_data = json.load(f)

        # Clean up the temporary JSON file
        # os.remove(json_path)

        return lipsync_data

    except Exception as e:
        print(f"Error generating lip sync: {str(e)}")
        # Return a minimal default lip sync data in case of error
        return {
            "metadata": {
                "soundFile": audio_path,
                "duration": 0
            },
            "mouthCues": [
                {"start": 0.00, "end": 0.1, "value": "X"}
            ]
        }