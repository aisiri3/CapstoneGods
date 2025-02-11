# This backend server has MySQL configured for user registration & login, + llama & TTS pipeline
# TODO: Try this on KLASS laptop and see if everything works (rmb to install mysql, bcrypt)

from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from flask_mysqldb import MySQL

import subprocess
import uuid
import bcrypt

from Offline_Coqui_English_python_workflowCoqui_English_python_workflow import init_TTS_model, TTS_workflow, playback_output_speech

app = Flask(__name__)
api = Api(app)

# MySQL configurations
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root' 
app.config['MYSQL_PASSWORD'] = 'Capstone.12345'
app.config['MYSQL_DB'] = 'capstoneDB'

mysql = MySQL(app)

# Disable tqdm output to resolve the handle error
logging.disable_progress_bar()

# Initialize TTS model (LOCAL)
tts_model, tts_config = init_TTS_model()
speaker_path = "inputs/business-ethics.wav"  # Speaker reference
output_path = "outputs/user_output.wav"      # Output audio path

# Llama pipeline initialization
llama_pipeline = None

def get_llama_pipeline():
    global llama_pipeline
    if llama_pipeline is None:
        try:
            print("Initializing Llama pipeline...")
            model = AutoModelForCausalLM.from_pretrained(
                "meta-llama/Llama-2-7b-chat-hf",
                torch_dtype=torch.float16,
                device_map="auto",
            )
            # There is not enough GPU to run llama!
            # model.to("cuda")

            tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-chat-hf")
            llama_pipeline = pipeline(
                task="text-generation",
                model=model,
                tokenizer=tokenizer
            )
            print("Llama pipeline initialized!")
        except Exception as e:
            print(f"Error during Llama pipeline initialization: {e}")
            import traceback
            traceback.print_exc()  # Print detailed stack trace
            raise
    return llama_pipeline

# Initialize Llama pipeline
llama_pipeline = get_llama_pipeline()

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

            # Ensure the model is initialized before processing
            if llama_pipeline is None:
                return {"error": "Llama pipeline is not initialized properly. Please try again later."}, 500

            # Generate response using Llama pipeline
            prompt = input_text + " Keep your answer short and precise."
            full_response = llama_pipeline(prompt)[0]['generated_text']
            print(f"Full response: {full_response}")

            # Extract only the generated text (exclude the input prompt)
            response_text = full_response[len(prompt):].strip()
            print(f"Generated response_text: {response_text}")
            

            # Log conversation
            # TODO: CHANGE THIS TO A CHAT HISTORY DATABASE TABLE
            with open("conversation_input_text.txt", "a", encoding="utf-8") as f:
                f.write(response_text + "\n")

            # Run TTS model
            TTS_workflow(tts_model, tts_config, response_text, speaker_path, output_path)

            return {"response": response_text}, 200

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
        cur.execute("SELECT * FROM Users WHERE Email = %s", (email,))
        user = cur.fetchone()
        cur.close()

        if not user:
            return {"error": "User not found"}, 404

        # Verify password using bcrypt
        stored_hashed_password = user[3]  # Assuming password is the 4th column
        if not bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password.encode('utf-8')):
            return {"error": "Invalid password"}, 401

        return {"message": "Login successful"}, 200


# Register resources
api.add_resource(Speak, "/api/speak")
api.add_resource(PlayAudio, "/api/play_audio")
api.add_resource(Register, "/api/register")
api.add_resource(Login, "/api/login")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888, debug=True, use_reloader=False)