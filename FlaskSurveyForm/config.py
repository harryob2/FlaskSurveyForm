"""
Configuration settings for the training form application.

This module contains configuration settings for the application,
including database connection details, file upload settings, and other parameters.
"""

import os

# Application settings
DEBUG = os.environ.get("DEBUG", "True").lower() == "true"
SECRET_KEY = os.environ.get("SESSION_SECRET", "dev-secret-key")  # For CSRF protection

# File upload settings
# UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', './uploads')
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "txt"}

# SQLite database settings (for development/testing)
DB_PATH = os.environ.get("DB_PATH", "training_forms.db")

# MariaDB/MySQL database settings (for production)
# These would be used when connecting to the azulimpbi01 server
DB_HOST = os.environ.get("DB_HOST", "azulimpbi01")
DB_PORT = int(os.environ.get("DB_PORT", "3306"))
DB_NAME = os.environ.get("DB_NAME", "analysis")
DB_USER = os.environ.get("DB_USER", "admin")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "Mfg#13579")

# Network file storage settings
# This is the path where invoice attachments would be saved in production
NETWORK_STORAGE_PATH = os.environ.get(
    "NETWORK_STORAGE_PATH",
    "\\\\strykercorp.com\\lim\\Engineering_DOG\\5. Automation & Controls\\01. Projects\\Training Form Invoices",
)

# Determine if we should use SQLite or MariaDB
USE_SQLITE = os.environ.get("USE_SQLITE", "True").lower() == "true"

# Database URL construction
if USE_SQLITE:
    DATABASE_URL = f"sqlite:///{DB_PATH}"
else:
    DATABASE_URL = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

# Flask-WTF settings
WTF_CSRF_ENABLED = True

# Database configuration
DATABASE = "training_forms.db"

# Upload folder configuration
UPLOAD_FOLDER = "uploads"

# Debug mode
DEBUG = True  # Set to False in production

# LDAP Configuration (Based on provided JSON)
LDAP_HOST = "limdc02.strykercorp.com"
LDAP_PORT = 3268
LDAP_BASE_DN = "DC=strykercorp,DC=com"
LDAP_USER_DN = "ou=Users"  # Adjust if users are in a specific OU within the Base DN, otherwise often just Base DN
LDAP_GROUP_DN = (
    "ou=Groups"  # Adjust if groups are in a specific OU, otherwise often just Base DN
)
LDAP_DOMAIN = "strykercorp.com"  # Used for NTLM or Kerberos if needed, or helpful info

# --- User Schema ---
# Attribute for the user ID (e.g., sAMAccountName, uid, userPrincipalName)
LDAP_USER_RDN_ATTR = "cn"  # Often 'cn' or 'uid'
LDAP_USER_LOGIN_ATTR = "userPrincipalName"  # The attribute to match against the login username ('userPrincipalName' for email format)

# --- Group Schema ---
# The attribute on the group object that lists members (e.g., 'member', 'uniqueMember')
LDAP_GROUP_MEMBER_ATTR = "member"
# The filter to find a group object (e.g., '(objectClass=group)')
LDAP_GROUP_OBJECT_FILTER = "(objectClass=group)"
# The attribute on the group object that contains the group's name (e.g., 'cn', 'gidNumber')
LDAP_GROUP_NAME_ATTR = "cn"

# --- Binding ---
# Set these if you need a specific account to bind and search LDAP.
# If None, the user's credentials will be used for the initial bind.
LDAP_BIND_USER_DN = None
LDAP_BIND_USER_PASSWORD = None

# --- Group Membership ---
# Specify the DN of the group users MUST belong to.
# Leave as None or an empty string ('') to disable the group membership check.
LDAP_REQUIRED_GROUP = None  # Example: 'cn=YourAppUsers,ou=Groups,DC=strykercorp,DC=com'. Set to the actual group DN or name if required.

# Use SSL? (ldap:// vs ldaps://) - Your example uses non-SSL (port 3268 is Global Catalog)
LDAP_USE_SSL = False

# User info to retrieve from LDAP upon successful login
# Add more attributes as needed (e.g., 'mail', 'displayName', 'givenName', 'sn')
LDAP_USER_SEARCH_SCOPE = "SUBTREE"  # Usually SUBTREE
LDAP_USER_OBJECT_FILTER = (
    "(&(objectClass=person)(userPrincipalName=%s))"  # Filter to find the user object
)

# Define which attributes to pull from the user's LDAP entry
LDAP_GET_USER_ATTRIBUTES = [
    "displayName",
    "mail",
    "givenName",
    "sn",
    "userPrincipalName",
]
