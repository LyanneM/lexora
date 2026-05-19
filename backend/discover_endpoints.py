# backend/discover_endpoints.py
import requests

BASE_URL = "http://localhost:8000"

def discover_endpoints():
    """Discover all available endpoints"""
    print("🔍 Discovering Available Endpoints...")
    
    # Test common endpoints
    endpoints = [
        "/",
        "/health",
        "/server-info",
        "/supported-languages",
        "/graph/examples",
        "/debug-quiz",
        "/test-ai-connection"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            print(f"\n📋 {endpoint}:")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Keys: {list(data.keys())}")
        except Exception as e:
            print(f"   ❌ Error: {e}")

def test_post_endpoints():
    """Test POST endpoints"""
    print("\n\n🧪 Testing POST Endpoints...")
    
    post_endpoints = [
        ("/graph/function", {"function": "x**2", "x_range": [-5, 5]}),
        ("/execute-code-advanced", {"code": "print('test')", "language": "python"}),
        ("/math-notebook/execute", {"code": "print('hello')", "cell_id": "test"}),
        ("/math-notebook/create-session", {}),
        ("/math-notebook/matrix-operations", {"operation": "determinant", "matrix_a": [[1,2],[3,4]]})
    ]
    
    for endpoint, data in post_endpoints:
        try:
            response = requests.post(f"{BASE_URL}{endpoint}", json=data, timeout=10)
            print(f"\n📤 {endpoint}:")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"   Success: {result.get('success', 'unknown')}")
                if 'error' in result:
                    print(f"   Error: {result['error']}")
        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    discover_endpoints()
    test_post_endpoints()