"""
Authentication routes (Register, Login, and Change Password) for the API.
"""
from flask import request, jsonify
from flask_restful import Resource
import bcrypt
import jwt
from datetime import datetime, timedelta
import os

from extensions import mysql
from api.auth.utils import validate_email, validate_password

# Secret key for JWT - in production, store this in environment variables
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-for-development')

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

        # Generate JWT token
        token_payload = {
            'user_id': user[0],
            'email': user[2],
            'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
        }
        token = jwt.encode(token_payload, SECRET_KEY, algorithm='HS256')

        # Return user info and token
        return {
            "message": "Login successful",
            "user": {
                "user_id": user[0],
                "username": user[1],
                "email": user[2]
            },
            "token": token
        }, 200
        
class ChangePassword(Resource):
    def post(self):
        data = request.get_json()
        user_id = data.get('user_id')
        new_password = data.get('new_password')
        
        # Extract token from authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return {"error": "Authorization token is missing"}, 401
            
        token = auth_header.split(' ')[1]
        
        # Verify token
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            # Check if token user_id matches the requested user_id
            if payload['user_id'] != user_id:
                return {"error": "Unauthorized access"}, 403
        except jwt.ExpiredSignatureError:
            return {"error": "Token has expired"}, 401
        except jwt.InvalidTokenError:
            return {"error": "Invalid token"}, 401
        
        if not user_id or not new_password:
            return {"error": "Missing fields"}, 400
            
        # Validate password
        if not validate_password(new_password):
            return {"error": "Password must be at least 8 characters"}, 400
            
        try:
            # First, retrieve the current password
            cur = mysql.connection.cursor()
            cur.execute("SELECT Password FROM Users WHERE UserID = %s", (user_id,))
            user = cur.fetchone()
            
            if not user:
                cur.close()
                return {"error": "User not found"}, 404
                
            current_hashed_password = user[0]
            
            # Check if new password matches the old password
            if bcrypt.checkpw(new_password.encode('utf-8'), current_hashed_password.encode('utf-8')):
                cur.close()
                return {"error": "New password cannot be the same as the current password"}, 400
                
            # Hash the new password
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update password in database
            cur.execute("UPDATE Users SET Password = %s WHERE UserID = %s", 
                      (hashed_password, user_id))
            
            # Check if the update was successful
            if cur.rowcount == 0:
                mysql.connection.rollback()
                cur.close()
                return {"error": "User not found"}, 404
                
            mysql.connection.commit()
            cur.close()
            
            return {"message": "Password updated successfully"}, 200
            
        except Exception as e:
            mysql.connection.rollback()
            return {"error": f"Database error: {str(e)}"}, 500

def register_routes(api):
    """Register the authentication routes with the API."""
    api.add_resource(Register, '/register')
    api.add_resource(Login, '/login')
    api.add_resource(ChangePassword, '/change-password')