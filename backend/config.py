"""
Configuration settings for the Flask application. (Database + TTS model settings)
TODO: Change TTS and model settings based on persona/language
"""
import os

class Config:
    """Base configuration."""
    # MySQL configurations
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'cap123')
    MYSQL_DB = os.getenv('MYSQL_DB', 'capstoneDB')
    MYSQL_CHARSET = 'utf8mb4'
    
    # TTS model settings
    TTS_SPEAKER_PATH = os.getenv('TTS_SPEAKER_PATH', 'inputs/male_formal.wav')
    TTS_OUTPUT_PATH = os.getenv('TTS_OUTPUT_PATH', 'outputs/user_output.wav')
    
    # Llama model settings
    LLAMA_MODEL_ID = os.getenv('LLAMA_MODEL_ID', 'meta-llama/Llama-2-7b-chat-hf')

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False

# Map environment setting to config object
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}