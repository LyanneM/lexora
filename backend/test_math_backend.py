# backend/test_math_backend.py
import requests
import json

BASE_URL = "http://localhost:8000"

def test_math_endpoints():
    plot_data = {
        "function": "x**2",
        "type": "function",
        "x_range": [-5, 5],
        "y_range": [-2, 10]
    }
    response = requests.post(f"{BASE_URL}/math-notebook/plot-function", json=plot_data)
    print("Plot Function:", response.json()["success"])
    
    # Test matrix operations
    matrix_data = {
        "operation": "determinant",
        "matrix_a": [[1, 2], [3, 4]]
    }
    response = requests.post(f"{BASE_URL}/math-notebook/matrix-operations", json=matrix_data)
    print("Matrix Determinant:", response.json())
    
    # Test code execution
    code_data = {
        "code": "print('Hello from Python!')\nfor i in range(3): print(i)",
        "language": "python"
    }
    response = requests.post(f"{BASE_URL}/execute-code", json=code_data)
    print("Code Execution:", response.json()["success"])

if __name__ == "__main__":
    test_math_endpoints()