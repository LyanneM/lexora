# backend/test_comprehensive_fixed.py
import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def check_server_health():
    """Check if the server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            return True, "Server is running"
        else:
            return False, f"Server responded with status {response.status_code}"
    except requests.exceptions.ConnectionError:
        return False, "Server is not running. Please start the backend with: python main.py"
    except Exception as e:
        return False, f"Error checking server: {str(e)}"

def test_all_features():
    print("🧪 Testing All Features...")
    
    # First, check if server is running
    is_healthy, message = check_server_health()
    if not is_healthy:
        print(f"❌ {message}")
        return
    
    # Test basic endpoints
    print("\n🔍 Testing Basic Endpoints...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        health_data = response.json()
        print(f"Health Check: {health_data.get('status', 'unknown')}")
        
        response = requests.get(f"{BASE_URL}/")
        root_data = response.json()
        print(f"Root Endpoint: {root_data.get('message', 'unknown')}")
    except Exception as e:
        print(f"❌ Basic endpoints failed: {e}")
        return
    
    # Test graphing
    print("\n📈 Testing Graphing...")
    try:
        graph_data = {
            "function": "x**2",
            "x_range": [-5, 5],
            "y_range": [-2, 10]
        }
        response = requests.post(f"{BASE_URL}/graph/function", json=graph_data, timeout=30)
        result = response.json()
        if result.get("success"):
            print("✅ Graph Function: SUCCESS")
            print(f"   Generated plot with function: {result.get('function', 'unknown')}")
        else:
            print(f"❌ Graph Function: FAILED - {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Graph Function: ERROR - {e}")
    
    # Test code execution
    print("\n💻 Testing Code Execution...")
    try:
        # Test Python
        code_data = {
            "code": "print('Hello from Python!')\nfor i in range(3): print(f'Number: {i}')",
            "language": "python"
        }
        response = requests.post(f"{BASE_URL}/execute-code-advanced", json=code_data, timeout=30)
        result = response.json()
        if result.get("success"):
            print("✅ Python Execution: SUCCESS")
            if result.get("output"):
                output_preview = result['output'][:100].replace('\n', ' ')
                print(f"   Output: {output_preview}...")
        else:
            print(f"❌ Python Execution: FAILED - {result.get('error', 'Unknown error')}")
        
        # Test JavaScript
        js_code = {
            "code": "for (let i = 0; i < 3; i++) { console.log(`JS Number: ${i}`); }",
            "language": "javascript"
        }
        response = requests.post(f"{BASE_URL}/execute-code-advanced", json=js_code, timeout=30)
        result = response.json()
        if result.get("success"):
            print("✅ JavaScript Execution: SUCCESS")
        else:
            print(f"❌ JavaScript Execution: FAILED - {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Code Execution: ERROR - {e}")
    
    # Test supported languages - FIXED VERSION
    print("\n🌐 Testing Supported Languages...")
    try:
        response = requests.get(f"{BASE_URL}/supported-languages", timeout=10)
        result = response.json()
        print("✅ Supported Languages Endpoint: RESPONSE RECEIVED")
        print(f"   Response keys: {list(result.keys())}")
        
        if "languages" in result:
            languages = result["languages"]
            print(f"   Found {len(languages)} languages:")
            for lang in languages[:10]:  # Show first 10
                lang_name = lang.get('name', 'unknown')
                print(f"     - {lang_name}")
        else:
            print(f"   Full response: {result}")
            
    except Exception as e:
        print(f"❌ Supported Languages: ERROR - {e}")
    
    # Test math notebook
    print("\n🐍 Testing Math Notebook...")
    try:
        math_cell = {
            "code": "import numpy as np\nresult = np.sqrt(16)\nprint(f'Square root of 16 is: {result}')",
            "cell_id": "test_cell_1"
        }
        response = requests.post(f"{BASE_URL}/math-notebook/execute", json=math_cell, timeout=30)
        result = response.json()
        if result.get("success"):
            print("✅ Math Notebook Execution: SUCCESS")
            if result.get("result"):
                output_type = result["result"].get("type", "unknown")
                print(f"   Output type: {output_type}")
        else:
            print(f"❌ Math Notebook Execution: FAILED - {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Math Notebook Execution: ERROR - {e}")
    
    # Test matrix operations
    print("\n🧮 Testing Matrix Operations...")
    try:
        matrix_data = {
            "operation": "determinant",
            "matrix_a": [[1, 2], [3, 4]]
        }
        response = requests.post(f"{BASE_URL}/math-notebook/matrix-operations", json=matrix_data, timeout=30)
        result = response.json()
        if result.get("success"):
            print("✅ Matrix Determinant: SUCCESS")
            print(f"   Result: {result.get('result', 'unknown')}")
        else:
            print(f"❌ Matrix Determinant: FAILED - {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Matrix Operations: ERROR - {e}")
    
    print("\n" + "="*50)
    print("🎉 Testing completed! Check results above.")
    print("="*50)

if __name__ == "__main__":
    test_all_features()