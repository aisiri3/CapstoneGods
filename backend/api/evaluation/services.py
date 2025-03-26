"""
Evaluation services.
"""
import os
import subprocess
import sys
from flask import current_app

def start_evaluation_process():
    """Start the evaluation process as a separate Python process."""
    print('Starting Python script...')
    
    try:
        # Get the path to the virtual environment's Python interpreter
        venv_python = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                                'venv', 'Scripts', 'python.exe')
        
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
                                  'workflows', 'llama', 'evaluation.py')
        
        process = subprocess.Popen(
            [venv_python, script_path], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True,
            env=env
        )
        
        output, error = process.communicate()
        
        return output, error

    except Exception as e:
        print(f"Error in evaluation process: {e}")
        return None, str(e)