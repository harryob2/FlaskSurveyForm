"""
Authentication module for the training form application.

This module handles user authentication via LDAP and Flask-Login integration.
"""

import logging
import os
import functools
from flask import flash
from flask_login import LoginManager, UserMixin
from flask_ldap3_login import LDAP3LoginManager
import hashlib
from models import db_session, get_admin_by_email

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize login manager
login_manager = LoginManager()
ldap_manager = LDAP3LoginManager()

# Admin user configuration
ADMIN_BYPASS_USERS = {
    "harry@test.com": hashlib.sha256("cork4liam".encode()).hexdigest(),
    "user@test.com": hashlib.sha256("cork4liam".encode()).hexdigest(),
}


def is_admin_email(email):
    return email and get_admin_by_email(email) is not None


class User(UserMixin):
    """User class for Flask-Login."""

    def __init__(
        self,
        username,
        dn=None,
        display_name=None,
        email=None,
        first_name=None,
        last_name=None,
        groups=None,
        is_admin=False,
    ):
        self.id = username  # For Flask-Login, id is required
        self.username = username
        self.dn = dn
        self.display_name = display_name or username.split("@")[0]
        self.email = email or username
        self.first_name = first_name
        self.last_name = last_name
        self.groups = groups or []
        self.is_admin = is_admin

    @staticmethod
    def get(username):
        """Get user by username."""
        is_admin = is_admin_email(username)
        display_name = "Administrator" if is_admin else username.split("@")[0]
        return User(
            username=username,
            display_name=display_name,
            email=username,
            first_name="Admin" if is_admin else None,
            last_name="User" if is_admin else None,
            is_admin=is_admin,
        )


def init_auth(app):
    """Initialize authentication with the Flask app."""
    # Initialize Flask-Login
    login_manager.init_app(app)
    login_manager.login_view = "login"
    login_manager.login_message = "Please log in to access this page."
    login_manager.login_message_category = "info"

    # Initialize Flask-LDAP3-Login
    ldap_manager.init_app(app)

    # Register user loader callback
    @login_manager.user_loader
    def load_user(user_id):
        return User.get(user_id)

    # Hook up savable data from LDAP to User model
    @ldap_manager.save_user
    def save_user(dn, username, data, memberships):
        # Check if the required group is specified
        required_group = app.config.get("LDAP_REQUIRED_GROUP")

        # If a required group is specified, check if the user is a member
        if required_group:
            logger.info(
                f"Checking if user {username} is in required group: {required_group}"
            )
            # Flask-LDAP3-Login will pass memberships as a list of group DNs
            if not memberships or required_group not in [
                group.split(",")[0].split("=")[1] for group in memberships
            ]:
                logger.warning(
                    f"User {username} is not in required group {required_group}"
                )
                return None
            logger.info(f"User {username} is in required group {required_group}")

        # Create and return user with LDAP attributes
        user = User(
            username=username,
            dn=dn,
            display_name=data.get("displayName", [None])[0],
            email=data.get("mail", [username])[0],
            first_name=data.get("givenName", [None])[0],
            last_name=data.get("sn", [None])[0],
            groups=memberships,
        )
        logger.info(f"User created: {user.username}, Name: {user.display_name}")
        return user


def authenticate_user(username, password):
    """Authenticate a user with LDAP or bypass credentials."""
    username_lc = username.lower()
    if username_lc in ADMIN_BYPASS_USERS:
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if password_hash == ADMIN_BYPASS_USERS[username_lc]:
            logger.info(f"Bypass user {username} authenticated successfully")
            return User.get(username)
        else:
            logger.warning(f"Failed bypass login attempt for {username}")
            flash("Invalid password.", "danger")
            return None

    # If not admin, try LDAP authentication
    try:
        logger.info(f"Attempting LDAP authentication for {username}")
        result = ldap_manager.authenticate(username, password)
        if result.status:  # If authentication was successful, status will be True
            # The save_user function will be called by the LDAP manager
            # and we can retrieve the user by username
            return User.get(username)
        else:
            # Authentication failed
            logger.warning(f"Invalid credentials for {username}")
            flash("Invalid username or password.", "danger")
            return None
    except Exception as e:
        logger.exception(f"Exception during authentication for {username}: {str(e)}")
        flash("Authentication error. Please contact support.", "danger")
        return None
