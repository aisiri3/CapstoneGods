from flask import request, jsonify
from flask_restful import Resource
from extensions import mysql

class Personas(Resource):
    def get(self):
        """Fetch all personas."""
        try:
            # Create a cursor to interact with the MySQL database
            cur = mysql.connection.cursor()

            # Execute a query to fetch all personas
            cur.execute("SELECT * FROM personas")
            personas = cur.fetchall()

            # Extract column names from the cursor description
            columns = [col[0] for col in cur.description]
            cur.close()

            # Convert the fetched data into a list of dictionaries
            results = [dict(zip(columns, persona)) for persona in personas]

            # Return the personas in JSON format
            return jsonify(results)

        except Exception as e:
            # Handle exceptions and return an error message
            return jsonify({"error": str(e)}), 500

    def post(self):
        """Insert a new persona."""
        data = request.get_json()
        required_fields = ["name", "persona_description"]

        # Check if required fields are present in the incoming data
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        try:
            # Insert the new persona into the database
            cur = mysql.connection.cursor()
            query = """
                INSERT INTO personas (name, persona_description)
                VALUES (%s, %s)
            """
            cur.execute(query, (data["name"], data["persona_description"]))
            mysql.connection.commit()
            cur.close()

            # Return a success message after insertion
            return jsonify({"message": "Persona added successfully"}), 201

        except Exception as e:
            # Handle exceptions and return an error message
            return jsonify({"error": str(e)}), 500

def register_routes(api):
    """Register the personas routes with the API."""
    api.add_resource(Personas, '/personas')
