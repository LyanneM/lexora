# backend/start_server.py
import uvicorn
import sys
import os

if __name__ == "__main__":
    print("🚀 Starting Lexora AI Backend Server...")
    print("📊 Available endpoints:")
    print("   - POST /calculate-math")
    print("   - POST /plot-graph") 
    print("   - POST /execute-code")
    print("   - POST /math-notebook/execute")
    print("   - POST /matrix-operations")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )