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
            return {"error": "Missing required fields"}, 400

        try:
            # Check if persona with same name already exists
            cur = mysql.connection.cursor()
            cur.execute("SELECT * FROM personas WHERE name = %s", (data["name"],))
            existing_persona = cur.fetchone()
            
            if existing_persona:
                cur.close()
                return {"error": "Persona with this name already exists"}, 409
            
            # Insert the new persona into the database
            query = """
                INSERT INTO personas (name, persona_description)
                VALUES (%s, %s)
            """
            cur.execute(query, (data["name"], data["persona_description"]))
            persona_id = cur.lastrowid
            mysql.connection.commit()
            
            # Fetch the newly created persona
            cur.execute("SELECT * FROM personas WHERE persona_id = %s", (persona_id,))
            new_persona = cur.fetchone()
            columns = [col[0] for col in cur.description]
            cur.close()
            
            # Return the data as a dictionary, not as a jsonify response
            result = dict(zip(columns, new_persona))
            return result, 201

        except Exception as e:
            # Return a dictionary, not a jsonify response
            return {"error": str(e)}, 500

def register_routes(api):
    """Register the personas routes with the API."""
    api.add_resource(Personas, '/personas')