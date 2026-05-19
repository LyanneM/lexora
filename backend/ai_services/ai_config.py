import os
from dotenv import load_dotenv

load_dotenv()

class AIConfig:
    DEFAULT_PROVIDER = os.getenv('AI_PROVIDER', 'local')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')
    LOCAL_MODEL = "llama3:8b"
    CHROMA_PERSIST_DIR = "./chroma_db"

    
    @classmethod
    def validate_config(cls):
        """Validate that we have the necessary configuration"""
        if cls.DEFAULT_PROVIDER == "google" and not cls.GOOGLE_API_KEY:
            print("⚠ WARNING: GOOGLE_API_KEY not found in environment variables")
            print("💡 Get a FREE key from: https://aistudio.google.com/")
            return False
        return True
    
    @classmethod 
    def get_available_providers(cls):
        """Get list of available AI providers"""
        providers = []
        if cls.GOOGLE_API_KEY:
            providers.append("google")
        providers.append("local")  
        return providers