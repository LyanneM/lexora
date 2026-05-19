# backend/services/code_executor.py
import subprocess
import tempfile
import os
import uuid
from typing import Dict, Any

class CodeExecutor:
    def __init__(self):
        self.supported_languages = {
            'python': {'extension': 'py', 'command': 'python'},
            'javascript': {'extension': 'js', 'command': 'node'},
            'cpp': {'extension': 'cpp', 'command': 'g++'},
            'java': {'extension': 'java', 'command': 'java'},
            'html': {'extension': 'html', 'command': 'browser'}
        }
    
    def execute_code(self, code: str, language: str) -> Dict[str, Any]:
        """Execute code in various programming languages"""
        try:
            if language not in self.supported_languages:
                return {
                    "success": False,
                    "error": f"Unsupported language: {language}. Supported: {list(self.supported_languages.keys())}"
                }
            
            if language == 'html':
                # For HTML, return the code for browser execution
                return {
                    "success": True,
                    "output": code,
                    "language": "html",
                    "requires_browser": True
                }
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(
                mode='w', 
                suffix=f'.{self.supported_languages[language]["extension"]}',
                delete=False
            ) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                # Execute based on language
                if language == 'python':
                    result = subprocess.run(
                        ['python', temp_file],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                elif language == 'javascript':
                    result = subprocess.run(
                        ['node', temp_file],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                elif language == 'cpp':
                    # Compile first
                    exec_file = temp_file + '.out'
                    compile_result = subprocess.run(
                        ['g++', temp_file, '-o', exec_file],
                        capture_output=True,
                        text=True
                    )
                    if compile_result.returncode != 0:
                        return {
                            "success": False,
                            "error": f"Compilation error: {compile_result.stderr}",
                            "output": compile_result.stdout
                        }
                    
                    # Run compiled program
                    result = subprocess.run(
                        [exec_file],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    os.remove(exec_file)
                elif language == 'java':
                    # Java requires special handling for class name
                    result = subprocess.run(
                        ['java', temp_file],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                
                # Clean up
                os.remove(temp_file)
                
                return {
                    "success": True,
                    "output": result.stdout,
                    "error": result.stderr,
                    "return_code": result.returncode
                }
                
            except subprocess.TimeoutExpired:
                os.remove(temp_file)
                return {
                    "success": False,
                    "error": "Execution timeout (30 seconds exceeded)"
                }
            except Exception as e:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                return {
                    "success": False,
                    "error": f"Execution error: {str(e)}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Code execution setup error: {str(e)}"
            }