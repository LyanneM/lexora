# backend/services/advanced_code_executor.py
import subprocess
import tempfile
import os
import requests
import json
from typing import Dict, Any
import time
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor

class AdvancedCodeExecutor:
    def __init__(self):
        self.supported_languages = {
            'python': {
                'extension': 'py',
                'command': 'python',
                'online_compiler': True,
                'timeout': 5,  # Reduced timeout
                'direct_execution': True  # Enable direct execution
            },
            'javascript': {
                'extension': 'js', 
                'command': 'node',
                'online_compiler': True,
                'timeout': 5,
                'direct_execution': True
            },
            'typescript': {
                'extension': 'ts',
                'command': 'npx ts-node',
                'online_compiler': True,
                'timeout': 8,
                'direct_execution': False
            },
            'java': {
                'extension': 'java',
                'command': 'java',
                'online_compiler': True,
                'timeout': 10,
                'direct_execution': False
            },
            'cpp': {
                'extension': 'cpp',
                'command': 'g++',
                'online_compiler': True,
                'timeout': 8,
                'direct_execution': False
            },
            'c': {
                'extension': 'c',
                'command': 'gcc',
                'online_compiler': True,
                'timeout': 8,
                'direct_execution': False
            },
            'html': {
                'extension': 'html',
                'command': 'browser',
                'online_compiler': False,
                'timeout': 2,
                'direct_execution': True
            },
            'css': {
                'extension': 'css',
                'command': 'browser',
                'online_compiler': False,
                'timeout': 2,
                'direct_execution': True
            }
        }
        
        self.piston_api_url = "https://emkc.org/api/v2/piston/execute"
        self.alternate_api_url = "https://codex-api.herokuapp.com/"
        self.executor = ThreadPoolExecutor(max_workers=4)  # Parallel execution
    
    # ============ ULTRA-FAST EXECUTION METHODS ============
    
    def execute_code_fast(self, code: str, language: str) -> Dict[str, Any]:
        """Ultra-fast code execution with aggressive timeouts"""
        start_time = time.time()
        
        try:
            # For Python and JavaScript, use direct execution (fastest)
            if language in ['python', 'javascript']:
                result = self._execute_direct_fast(code, language)
                if result["success"]:
                    return result
            
            # For other languages, try online with short timeout
            online_result = self._execute_online_fast(code, language)
            if online_result["success"]:
                return online_result
            
            # Final fallback to standard execution
            return self.execute_code_standard(code, language)
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Fast execution failed: {str(e)}"
            }
        finally:
            execution_time = time.time() - start_time
            print(f"⚡ Fast execution completed in {execution_time:.2f}s")
    
    def _execute_direct_fast(self, code: str, language: str) -> Dict[str, Any]:
        """Direct execution for interpreted languages (fastest)"""
        try:
            if language == 'python':
                result = subprocess.run(
                    ['python', '-c', code],
                    capture_output=True,
                    text=True,
                    timeout=3,  # Very short timeout for fast mode
                    encoding='utf-8'
                )
            elif language == 'javascript':
                result = subprocess.run(
                    ['node', '-e', code],
                    capture_output=True,
                    text=True,
                    timeout=3,
                    encoding='utf-8'
                )
            else:
                return {"success": False, "error": "Unsupported language for direct execution"}
            
            return {
                "success": True,
                "output": result.stdout.strip(),
                "error": result.stderr.strip(),
                "return_code": result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Fast execution timeout (3 seconds)"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Fast execution error: {str(e)}"
            }
    
    def _execute_online_fast(self, code: str, language: str) -> Dict[str, Any]:
        """Fast online execution with short timeout"""
        try:
            language_map = {
                'python': 'python',
                'javascript': 'javascript',
                'typescript': 'typescript',
                'cpp': 'c++',
                'java': 'java',
                'c': 'c'
            }
            
            piston_language = language_map.get(language)
            if not piston_language:
                return {"success": False, "error": f"Language {language} not supported"}
            
            payload = {
                "language": piston_language,
                "version": "latest",
                "files": [{"content": code}]
            }
            
            # Very short timeout for fast mode
            response = requests.post(self.piston_api_url, json=payload, timeout=6)
            
            if response.status_code == 200:
                result = response.json()
                run_data = result.get('run', {})
                output = run_data.get('output', '')
                error = run_data.get('stderr', '')
                
                # Fast output cleanup
                if output and output.endswith('\n'):
                    output = output.rstrip('\n')
                
                return {
                    "success": True,
                    "output": output,
                    "error": error,
                    "return_code": 0 if not error else 1
                }
            else:
                return {
                    "success": False,
                    "error": f"Online compiler error: {response.status_code}"
                }
                
        except requests.Timeout:
            return {
                "success": False,
                "error": "Online execution timeout (6 seconds)"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Online execution error: {str(e)}"
            }

    # ============ STANDARD EXECUTION METHODS ============
    
    async def execute_code_online_async(self, code: str, language: str) -> Dict[str, Any]:
        """Async online code execution"""
        try:
            language_map = {
                'python': 'python',
                'javascript': 'javascript',
                'typescript': 'typescript',
                'java': 'java',
                'cpp': 'c++',
                'c': 'c'
            }
            
            piston_language = language_map.get(language)
            if not piston_language:
                return {"success": False, "error": f"Language {language} not supported"}
            
            payload = {
                "language": piston_language,
                "version": "latest",
                "files": [{"content": code}]
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as session:
                try:
                    async with session.post(self.piston_api_url, json=payload) as response:
                        if response.status == 200:
                            result = await response.json()
                            return self._parse_online_result(result)
                except asyncio.TimeoutError:
                    pass
                
                # Try alternate API
                try:
                    async with session.post(self.alternate_api_url, json=payload) as response:
                        if response.status == 200:
                            result = await response.json()
                            return self._parse_online_result(result)
                except asyncio.TimeoutError:
                    return {"success": False, "error": "Online compiler timeout"}
            
            return {"success": False, "error": "All online compilers unavailable"}
                
        except Exception as e:
            return {"success": False, "error": f"Online execution error: {str(e)}"}
    
    def execute_code_online_standard(self, code: str, language: str) -> Dict[str, Any]:
        """Standard synchronous online execution"""
        try:
            language_map = {
                'python': 'python',
                'javascript': 'javascript',
                'typescript': 'typescript',
                'java': 'java',
                'cpp': 'c++',
                'c': 'c'
            }
            
            piston_language = language_map.get(language)
            if not piston_language:
                return {"success": False, "error": f"Language {language} not supported"}
            
            payload = {
                "language": piston_language,
                "version": "latest",
                "files": [{"content": code}]
            }
            
            try:
                response = requests.post(self.piston_api_url, json=payload, timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    return self._parse_online_result(result)
            except (requests.Timeout, requests.ConnectionError):
                pass
            
            return {"success": False, "error": "Online compiler timeout"}
                
        except Exception as e:
            return {"success": False, "error": f"Online execution error: {str(e)}"}
    
    def execute_code_locally_fast(self, code: str, language: str) -> Dict[str, Any]:
        """Optimized local execution with caching and faster methods"""
        try:
            if language not in self.supported_languages:
                return {"success": False, "error": f"Unsupported language: {language}"}
            
            lang_info = self.supported_languages[language]
            
            # Handle web languages instantly
            if language in ['html', 'css']:
                return {
                    "success": True,
                    "output": code,
                    "language": language,
                    "requires_browser": True
                }
            
            # Use direct execution for supported languages (fastest method)
            if lang_info.get('direct_execution', False):
                return self._execute_direct(code, language, lang_info)
            
            # Fallback to file-based execution
            return self._execute_with_file(code, language, lang_info)
                
        except Exception as e:
            return {"success": False, "error": f"Code execution error: {str(e)}"}
    
    def _execute_direct(self, code: str, language: str, lang_info: Dict) -> Dict[str, Any]:
        """Direct execution without creating files"""
        try:
            timeout = lang_info.get('timeout', 5)
            
            if language == 'python':
                result = subprocess.run(
                    ['python', '-c', code],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    encoding='utf-8'
                )
            elif language == 'javascript':
                result = subprocess.run(
                    ['node', '-e', code],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    encoding='utf-8'
                )
            else:
                return self._execute_with_file(code, language, lang_info)
            
            return {
                "success": True,
                "output": result.stdout.strip(),
                "error": result.stderr.strip(),
                "return_code": result.returncode
            }
                
        except subprocess.TimeoutExpired:
            return {"success": False, "error": f"Execution timeout ({timeout} seconds)"}
        except Exception as e:
            return {"success": False, "error": f"Direct execution error: {str(e)}"}
    
    def _execute_with_file(self, code: str, language: str, lang_info: Dict) -> Dict[str, Any]:
        """File-based execution with optimized temp file handling"""
        try:
            with tempfile.NamedTemporaryFile(
                mode='w', 
                suffix=f'.{lang_info["extension"]}',
                delete=False,
                encoding='utf-8'
            ) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                timeout = lang_info.get('timeout', 5)
                
                if language == 'java':
                    return self._execute_java(code, timeout)
                
                result = subprocess.run(
                    lang_info['command'].split() + [temp_file],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    encoding='utf-8'
                )
                
                # Fast cleanup
                try:
                    os.unlink(temp_file)
                except:
                    pass
                
                return {
                    "success": True,
                    "output": result.stdout.strip(),
                    "error": result.stderr.strip(),
                    "return_code": result.returncode
                }
                
            except subprocess.TimeoutExpired:
                try:
                    os.unlink(temp_file)
                except:
                    pass
                return {"success": False, "error": f"Execution timeout ({timeout} seconds)"}
            except Exception as e:
                try:
                    os.unlink(temp_file)
                except:
                    pass
                return {"success": False, "error": f"Execution error: {str(e)}"}
                
        except Exception as e:
            return {"success": False, "error": f"File setup error: {str(e)}"}
    
    def _execute_java(self, code: str, timeout: int) -> Dict[str, Any]:
        """Optimized Java execution"""
        try:
            class_name = "Main"
            temp_dir = tempfile.mkdtemp()
            java_file = os.path.join(temp_dir, f"{class_name}.java")
            
            with open(java_file, 'w', encoding='utf-8') as f:
                f.write(code)
            
            # Compile with optimizations
            compile_result = subprocess.run(
                ['javac', java_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding='utf-8'
            )
            
            if compile_result.returncode != 0:
                # Fast cleanup
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                return {
                    "success": False,
                    "error": f"Compilation error: {compile_result.stderr}",
                    "output": compile_result.stdout
                }
            
            # Run compiled code
            result = subprocess.run(
                ['java', '-cp', temp_dir, class_name],
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding='utf-8'
            )
            
            # Fast cleanup
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
            
            return {
                "success": True,
                "output": result.stdout.strip(),
                "error": result.stderr.strip(),
                "return_code": result.returncode
            }
            
        except Exception as e:
            # Ensure cleanup on any error
            try:
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
            except:
                pass
            return {"success": False, "error": f"Java execution error: {str(e)}"}
    
    def _parse_online_result(self, result: Dict) -> Dict[str, Any]:
        """Parse online compiler result"""
        run_data = result.get('run', {})
        output = run_data.get('output', '')
        error = run_data.get('stderr', '')
        
        # Fast output cleanup
        if output and output.endswith('\n'):
            output = output.rstrip('\n')
        
        return {
            "success": True,
            "output": output,
            "error": error,
            "return_code": 0 if not error else 1
        }
    
    def execute_code_standard(self, code: str, language: str) -> Dict[str, Any]:
        """Standard code execution with fallbacks"""
        start_time = time.time()
        
        try:
            # For quick execution, try local first for supported languages
            quick_languages = ['python', 'javascript']
            
            if language in quick_languages:
                local_result = self.execute_code_locally_fast(code, language)
                if local_result["success"]:
                    return local_result
            
            # Otherwise try online or fallback
            online_result = self.execute_code_online_standard(code, language)
            if online_result["success"]:
                return online_result
            
            # Final fallback to local
            return self.execute_code_locally_fast(code, language)
            
        except Exception as e:
            return {"success": False, "error": f"Execution error: {str(e)}"}
        finally:
            execution_time = time.time() - start_time
            print(f"Standard execution completed in {execution_time:.2f}s")

# Global instance
advanced_code_executor = AdvancedCodeExecutor()