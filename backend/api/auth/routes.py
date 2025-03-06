"""
Authentication routes (Register and Login) for the API.
"""
from flask import request, jsonify
from flask_restful import Resource
import bcrypt

from extensions import mysql
from api.auth.utils import validate_email, validate_password

class Register(Resource):
    def post(self):
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return {"error": "Missing fields"}, 400

        # Validate email and password
        if not validate_email(email):
            return {"error": "Invalid email"}, 400
        if not validate_password(password):
            return {"error": "Password must be at least 8 characters"}, 400

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert into database
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO Users (Username, Email, Password) VALUES (%s, %s, %s)", 
                   (username, email, hashed_password))
        mysql.connection.commit()
        cur.close()

        return {"message": "User registered successfully"}, 201

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

def register_routes(api):
    """Register the authentication routes with the API."""
    api.add_resource(Register, '/register')
    api.add_resource(Login, '/login')