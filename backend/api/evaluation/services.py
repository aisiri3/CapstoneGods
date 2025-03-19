"""
Evaluation services.
"""
import os
import subprocess
import sys
import platform
from flask import current_app

def start_evaluation_process():
    """Start the evaluation process as a separate Python process."""
    print('Starting Python script...')
    
    try:
        # Determine the Python executable to use based on the platform
        if platform.system() == 'Windows':
            # On Windows, try to use the virtual environment's Python
            venv_python = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                                    'venv', 'Scripts', 'python.exe')
            # Check if the file exists
            if not os.path.exists(venv_python):
                print(f"Virtual env Python not found at {venv_python}, using system Python")
                venv_python = 'python'  # Fall back to system Python
        else:
            # On Linux/Mac, use python3
            venv_python = 'python3'
        
        print(f"Using Python executable: {venv_python}")
        
        # Get database configuration
        db_config = {
            'host': current_app.config.get('MYSQL_HOST', 'localhost'),
            'user': current_app.config.get('MYSQL_USER', 'root'),
            'password': current_app.config.get('MYSQL_PASSWORD', 'Capstone.12345'),
            'database': current_app.config.get('MYSQL_DB', 'capstoneDB')
        }
        
        # Set environment variables for the subprocess
        env = os.environ.copy()
        env.update({
            'DB_HOST': db_config['host'],
            'DB_USER': db_config['user'],
            'DB_PASSWORD': db_config['password'],
            'DB_NAME': db_config['database'],
            'PYTHONPATH': os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        })

        # Run the evaluation script
        script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                                  'workflows', 'chat_evaluation', 'evaluation.py')
        
        # Log the command we're about to run
        print(f"Executing: {venv_python} {script_path}")
        
        process = subprocess.Popen(
            [venv_python, script_path], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True,
            env=env
        )
        
        output, error = process.communicate()
        
        if error:
            print(f"Error from subprocess: {error}")
        if output:
            print(f"Output from subprocess: {output[:200]}...")  # Print first 200 chars of output
            
        return output, error

    except Exception as e:
        print(f"Error in evaluation process: {e}")
        import traceback
        traceback.print_exc()  # Print the full stack trace for better debugging
        return None, str(e)