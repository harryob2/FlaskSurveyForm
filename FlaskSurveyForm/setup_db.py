"""
Database setup script for the training form application.

This script initializes the database by creating the necessary tables.
"""
import os
import sys
import logging
import sqlite3
from models import create_tables

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def setup_database(force_recreate=False):
    """Set up the database and create tables if they don't exist"""
    # Get the database path from config
    db_path = 'training_forms.db'
    
    # If force_recreate is True and the database exists, delete it
    if force_recreate and os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    
    # Create tables
    create_tables()
    print("Database setup complete")

if __name__ == '__main__':
    setup_database(force_recreate=True)