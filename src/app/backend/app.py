from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

# Initialize Flask App
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configure Database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'project.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Database Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

# --- API Routes ---
@app.route("/api")
def index():
    return jsonify({"message": "Python Flask backend with SQLite is running."})

# Example route to get users (for future use)
@app.route("/api/users")
def get_users():
    try:
        users = User.query.all()
        return jsonify([{"id": user.id, "username": user.username, "email": user.email} for user in users])
    except Exception as e:
        # This can happen if the table doesn't exist yet
        return jsonify({"error": "Could not query users. Have you created the database tables?", "details": str(e)}), 500

# --- App Context ---
with app.app_context():
    # This will create the database file and tables if they don't exist
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
