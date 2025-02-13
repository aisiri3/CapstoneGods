## Integrated chatbot evaluation routes

from flask import Flask, request, jsonify
from flask_restful import Api, Resource
import subprocess
import bcrypt

from Coqui_English_python_workflow import init_TTS_model, TTS_workflow, playback_output_speech
from db.config import init_db

app = Flask(__name__)
api = Api(app)

# MySQL configurations
mysql = init_db(app)

# Initialize TTS model
tts_model = init_TTS_model()
speaker_path = "inputs/business-ethics.wav"  # Speaker reference
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

            input_text = data["text"]
            print(f"Received input_text: {input_text}")

            # Log conversation
            # TODO: CHANGE THIS TO A DATABASE
            with open("conversation_input_text.txt", "a", encoding="utf-8") as f:
                f.write(input_text + "\n")

            # Run TTS model
            TTS_workflow(tts_model, input_text, speaker_path, output_path)

            return {"response": input_text}, 200

        except Exception as e:
            print(f"Exception: {e}")
            return {"error": str(e)}, 500

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
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')  # Replace with actual hashing (if any lol)

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
        """Trigger Python script for evaluation."""
        try:
            print("Starting Python script for evaluation...")
            process = subprocess.Popen(['python3', 'llamaEvaluation.py'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = process.communicate()

            if process.returncode == 0:
                return {"message": "Evaluation completed successfully", "data": stdout.decode()}, 200
            else:
                return {"error": f"Evaluation failed: {stderr.decode()}"}, 500

        except Exception as e:
            return {"error": str(e)}, 500


# Register resources
api.add_resource(Speak, "/api/speak")
api.add_resource(PlayAudio, "/api/play_audio")
api.add_resource(Register, "/api/register")
api.add_resource(Login, "/api/login")
api.add_resource(Entries, "/api/entries")
api.add_resource(StartEvaluation, "/api/start-evaluation")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888, debug=True, use_reloader=False)