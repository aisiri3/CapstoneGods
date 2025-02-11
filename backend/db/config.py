from flask_mysqldb import MySQL

def init_db(app):
    """Initialize the database connection with Flask app."""
    app.config['MYSQL_HOST'] = 'localhost'
    app.config['MYSQL_USER'] = 'root'
    app.config['MYSQL_PASSWORD'] = 'Capstone.12345'
    app.config['MYSQL_DB'] = 'capstoneDB'
    
    mysql = MySQL(app)
    return mysql
