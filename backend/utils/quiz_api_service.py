# backend/utils/quiz_api_service.py
import requests
import json
from typing import Dict, Any, Optional

class QuizApiService:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
    
    def get_server_info(self) -> Dict[str, Any]:
        """Get server information"""
        try:
            response = requests.get(f"{self.base_url}/server-info", timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Server info error: {e}")
            return {"error": str(e)}
    
    def generate_quiz_from_text(self, content: str, num_questions: int = 10, quiz_type: str = "mixed") -> Dict[str, Any]:
        """Generate quiz from text content"""
        try:
            payload = {
                "content": content,
                "options": {
                    "num_questions": num_questions,
                    "quiz_type": quiz_type
                }
            }
            
            response = requests.post(
                f"{self.base_url}/generate-quiz/text",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Quiz generation error: {e}")
            raise Exception(f"Failed to generate quiz: {e}")
    
    def generate_quiz_from_file(self, file, num_questions: int = 10) -> Dict[str, Any]:
        """Generate quiz from uploaded file"""
        try:
            files = {"file": (file.name, file, "text/plain")}
            data = {"num_questions": num_questions}
            
            response = requests.post(
                f"{self.base_url}/generate-quiz/file",
                files=files,
                data=data,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"File quiz generation error: {e}")
            raise Exception(f"Failed to generate quiz from file: {e}")
    
    def analyze_content(self, content: str) -> Dict[str, Any]:
        """Analyze content for quiz generation"""
        try:
            payload = {"content": content}
            
            response = requests.post(
                f"{self.base_url}/analyze-content",
                json=payload,
                timeout=15
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Content analysis error: {e}")
            return {"error": str(e)}
    
    def export_quiz(self, quiz_data: Dict[str, Any], format_type: str = "txt") -> str:
        """Export quiz to specified format"""
        try:
            payload = {
                "quiz_data": quiz_data,
                "format": format_type
            }
            
            response = requests.post(
                f"{self.base_url}/export-quiz",
                json=payload,
                timeout=15
            )
            response.raise_for_status()
            result = response.json()
            return result.get("export_content", "")
            
        except requests.exceptions.RequestException as e:
            print(f"Export error: {e}")
            return f"Export failed: {e}"