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
            output, error = start_evaluation_process()
            
            if error:
                return jsonify({"error": "Evaluation failed", "details": error}), 500
            
            return jsonify({"message": "Evaluation completed successfully!", "data": output})
            
        except Exception as e:
            return jsonify({"error": "Server error", "details": str(e)}), 500

def register_routes(api):
    """Register the evaluation routes with the API."""
    api.add_resource(Entries, '/entries')
    api.add_resource(StartEvaluation, '/start-evaluation')