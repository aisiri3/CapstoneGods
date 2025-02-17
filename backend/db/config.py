from flask_mysqldb import MySQL

def init_db(app):
    """Initialize the database connection with Flask app."""
    app.config['MYSQL_HOST'] = 'localhost'
    app.config['MYSQL_USER'] = 'root'
    app.config['MYSQL_PASSWORD'] = 'cap123'
    app.config['MYSQL_DB'] = 'chatbot_eval'
    
    mysql = MySQL(app)
    return mysql
