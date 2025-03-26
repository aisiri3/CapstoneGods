"""
Authentication utilities.
"""

def validate_email(email):
    """Simple email validation."""
    return '@' in email

def validate_password(password):
    """Validate password meets minimum requirements."""
    return len(password) >= 8