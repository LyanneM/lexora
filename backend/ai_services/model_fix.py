import google.generativeai as genai
import os

class ModelFixer:
    def __init__(self):
        self.available_models = [
            "gemini-1.5-flash",
            "gemini-1.5-pro", 
            "gemini-1.0-pro"
        ]
        self.default_model = "gemini-1.5-flash"
    
    def get_valid_model(self, requested_model=None):
        """Return a valid Gemini model name"""
        if requested_model and any(available in requested_model for available in ['gemini-1.5', 'gemini-1.0']):
            # Extract base model name
            for model in self.available_models:
                if model in requested_model:
                    return model
        
        return self.default_model
    
    def test_models(self):
        """Test which models are available"""
        working_models = []
        for model_name in self.available_models:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Test")
                working_models.append(model_name)
                print(f"✅ {model_name} is working")
            except Exception as e:
                print(f"❌ {model_name} failed: {e}")
        
        return working_models

# Global fixer instance
model_fixer = ModelFixer()