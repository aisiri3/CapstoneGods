"""
Evaluation routes (for developer page).
"""
from flask import request, jsonify
from flask_restful import Resource
import os
import subprocess

from extensions import mysql
from api.evaluation.services import start_evaluation_process

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
        """Start the evaluation process."""
        try:
            print("Starting evaluation process...")
            
            # Get the request data (if any)
            request_data = request.get_json(silent=True) or {}
            persona_id = request_data.get('personaId')
            
            if persona_id:
                print(f"Received persona ID: {persona_id}")
            
            # Call the evaluation service
            output, error = start_evaluation_process()
            
            # Check for errors in the evaluation process
            if error:
                print(f"Evaluation failed: {error}")
                return {
                    "success": False,
                    "message": "Evaluation failed",
                    "error": str(error)
                }, 500
            
            print("Evaluation completed successfully")
            return {
                "success": True,
                "message": "Evaluation completed successfully"
            }
            
        except Exception as e:
            import traceback
            print(f"Server error in StartEvaluation: {str(e)}")
            print(traceback.format_exc())
            return {
                "success": False,
                "message": "Server error",
                "error": str(e)
            }, 500

def register_routes(api):
    """Register the evaluation routes with the API."""
    api.add_resource(Entries, '/entries')
    api.add_resource(StartEvaluation, '/start-evaluation')