## Integrated lipsync
## Integrated chatbot evaluation routes

from flask import Flask, request, jsonify, send_file
from flask_restful import Api, Resource
import subprocess
import bcrypt
import time
import torch
import os
import base64

print("imported till torch...")
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
print("from transformers")
from sentence_transformers import SentenceTransformer, util
print("from sentence_transformers ")

from workflows.Coqui_English_python_workflow import init_TTS_model, TTS_workflow, playback_output_speech
print("from Coqui_English_python_workflow ")

from workflows.lipsyncGeneration import generate_rhubarb_lipsync
print("from lipsyncGeneration")

from db.config import init_db
print("from db.config ")

app = Flask(__name__)
api = Api(app)

# MySQL configurations
mysql = init_db(app)

# Initialize TTS model
tts_model = init_TTS_model()
speaker_path = "inputs/male_formal.wav"  # Speaker reference
output_path = "outputs/user_output.wav"      # Output audio path

class Speak(Resource):
    def post(self):
        # Ensure request is JSON
        if not request.is_json:
            return {"error": "Invalid JSON request"}, 400

        try:
            data = request.get_json()
            if not data or "text" not in data:
                return {"error": "Missing 'text' field"}, 400

            # 0. Receive input text from frontend
            input_text = data["text"]
            print(f"Received input_text: {input_text}")

            # 1. Generate response text using Llama (for now, echo the input)
            response_text = input_text

            # 2. Generate audio using TTS
            TTS_workflow(tts_model, response_text, speaker_path, output_path)
            
            # 3. Generate lipsync with Rhubarb
            lipsync_data = generate_rhubarb_lipsync(output_path)
            
            print("Response text:", response_text)
            print("Lipsync data:", lipsync_data)
            
            # 4. Read the generated audio file and encode it as base64 wrapped in a data URI
            with open(output_path, "rb") as audio_file:
                encoded_audio = base64.b64encode(audio_file.read()).decode('utf-8')
            audio_data_uri = "data:audio/wav;base64," + encoded_audio

            # 5. Return everything together to the frontend!
            return jsonify({
                "response": response_text,
                "lipSync": lipsync_data.get("mouthCues"),
                "audio": audio_data_uri
            })

        except Exception as e:
            print(f"Exception: {e}")
            return jsonify({
                "error": str(e),
                "response": "",
                "lipSync": [],
                "audio": ""
            }), 500

class PlayAudio(Resource):
    def post(self):
        # Play the generated audio file
        playback_output_speech(output_path)
        return {"status": "audio_played"}, 200
    
class Register(Resource):
    def post(self):
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return {"error": "Missing fields"}, 400

        # Validate email and password
        if not self.validate_email(email):
            return {"error": "Invalid email"}, 400
        if not self.validate_password(password):
            return {"error": "Password must be at least 8 characters"}, 400

        # Hash the password!
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # insert into database
        cur = mysql.connection.cursor()
        # cur.execute("INSERT INTO Users (UserID, Username, Email, Password) VALUES (%s, %s, %s, %s)", (user_id , username, email, hashed_password))
        cur.execute("INSERT INTO Users (Username, Email, Password) VALUES (%s, %s, %s)", (username, email, hashed_password))
        mysql.connection.commit()
        cur.close()

        return {"message": "User registered successfully"}, 201

    def validate_email(self, email):
        # Simple email validation
        return '@' in email

    def validate_password(self, password):
        return len(password) >= 8

class Login(Resource):
    def post(self):
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return {"error": "Missing fields"}, 400

        # Fetch user from database
        cur = mysql.connection.cursor()
        cur.execute("SELECT UserID, Username, Email, Password FROM Users WHERE Email = %s", (email,))
        user = cur.fetchone()
        cur.close()

        if not user:
            return {"error": "User not found"}, 404

        # Verify password using bcrypt
        stored_hashed_password = user[3]
        if not bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password.encode('utf-8')):
            return {"error": "Invalid password"}, 401

        # Return user info (excluding password)
        return {
            "message": "Login successful",
            "user": {
                "user_id": user[0],
                "username": user[1],
                "email": user[2]
            }
        }, 200

## Classes for the llama evaluation ##
class Entries(Resource):
    def get(self):
        """Fetch all evaluation entries."""
        try:
            cur = mysql.connection.cursor()
            cur.execute("SELECT * FROM evaluation_entries")
            entries = cur.fetchall()

            # Convert to list of dicts
            columns = [col[0] for col in cur.description]
            cur.close()
            
            results = [dict(zip(columns, entry)) for entry in entries]
            return jsonify(results)

        except Exception as e:
            return {"error": str(e)}, 500

    def post(self):
        """Insert a new evaluation entry."""
        data = request.get_json()
        required_fields = ["prompt", "sampleResponse", "actualResponse", "responseTime", "similarityScore"]

        if not all(field in data for field in required_fields):
            return {"error": "Missing required fields"}, 400

        try:
            cur = mysql.connection.cursor()
            query = """
                INSERT INTO evaluation_entries (prompt, sampleResponse, actualResponse, responseTime, similarityScore)
                VALUES (%s, %s, %s, %s, %s)
            """
            cur.execute(query, (data["prompt"], data["sampleResponse"], data["actualResponse"],
                                data["responseTime"], data["similarityScore"]))
            mysql.connection.commit()
            cur.close()

            return {"message": "Entry added successfully"}, 201

        except Exception as e:
            return {"error": str(e)}, 500


class StartEvaluation(Resource):
    def post(self):
        print('Starting Python script...')
        
        try:
            # Get the path to the virtual environment's Python interpreter
            venv_python = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                     'venv', 'Scripts', 'python.exe')
            
            # Set environment variables
            db_config = {
                'host': os.getenv('DB_HOST', 'localhost'),
                'user': os.getenv('DB_USER', 'root'),
                'password': os.getenv('DB_PASSWORD', 'cap123'),
                'database': os.getenv('DB_NAME', 'chatbot_eval')
            }
            
            env = os.environ.copy()
            env.update({
                'DB_HOST': db_config['host'],
                'DB_USER': db_config['user'],
                'DB_PASSWORD': db_config['password'],
                'DB_NAME': db_config['database'],
                'PYTHONPATH': os.path.dirname(os.path.abspath(__file__))
            })

            process = subprocess.Popen(
                [venv_python, 'llamaEvaluation.py'], 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE, 
                text=True,
                env=env
            )
            output, error = process.communicate()

            if process.returncode == 0:
                print(f'Received data: {output}')
                return jsonify({"message": "Evaluation completed successfully!", "data": output})
            else:
                print(f'stderr: {error}')
                return jsonify({"error": "Evaluation failed", "details": error}), 500

        except Exception as e:
            return jsonify({"error": "Server error", "details": str(e)}), 500


# Register resources
api.add_resource(Speak, "/api/speak")
api.add_resource(PlayAudio, "/api/play_audio")
api.add_resource(Register, "/api/register")
api.add_resource(Login, "/api/login")
api.add_resource(Entries, "/api/entries")
api.add_resource(StartEvaluation, "/api/start-evaluation")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888, debug=True, use_reloader=False)