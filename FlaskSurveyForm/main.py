"""
Entry point for the training form application.

This module imports the Flask application and starts the server.
"""

from app import app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
