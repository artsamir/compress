import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    UPLOAD_FOLDER = '/tmp/uploads/'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    
    # Flask-Mail
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'smartsamir0205@gmail.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME', 'smartsamir0205@gmail.com')
    
    # Chatbot/Ollama
    OLLAMA_API_URL = os.getenv('OLLAMA_API_URL', 'http://localhost:11434/api/generate')
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'mistral')
    CHATBOT_ENABLED = os.getenv('CHATBOT_ENABLED', 'true').lower() == 'true'

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration - optimized for Contabo"""
    DEBUG = False
    TESTING = False
    
    # Performance optimizations
    PROPAGATE_EXCEPTIONS = True
    PRESERVE_CONTEXT_ON_EXCEPTION = False
    
    # JSON optimizations
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = False
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    WTF_CSRF_ENABLED = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

def get_config():
    """Get appropriate configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development').lower()
    
    if env == 'production':
        return ProductionConfig()
    elif env == 'testing':
        return TestingConfig()
    else:
        return DevelopmentConfig()
