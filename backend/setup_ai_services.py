# backend/ai_services/setup_ai_services.py
import nltk
import os
import subprocess
import sys

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✓ Installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to install {package}")
        return False

def setup_ai_services():
    """Setup required resources for FREE AI services only"""
    
    print("🔧 Setting up FREE AI services...")
    

    print("📥 Downloading NLTK data...")
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    

    os.makedirs("./chroma_db", exist_ok=True)
    
    print("✓ Basic setup complete!")


    print("\n🆓 FREE AI Enhancement Options:")
    print("1. Google Gemini API (Free tier):")
    print("   pip install google-generativeai")
    print("   Get free API key from: https://aistudio.google.com/")
    
    print("\n2. Local AI with Ollama (Completely free):")
    print("   Install Ollama from: https://ollama.ai/")
    print("   Then run: ollama pull llama3:8b")
    print("   pip install langchain chromadb sentence-transformers")
    
    print("\n3. Enhanced features:")
    print("   pip install langchain chromadb sentence-transformers")
    
    response = input("\nDo you want to install free AI packages now? (y/n): ")
    if response.lower() == 'y':
        print("\n📦 Installing free AI packages...")
        packages = [
            "google-generativeai",
            "langchain",
            "chromadb", 
            "sentence-transformers",
            "requests"
        ]
        for package in packages:
            install_package(package)
        
        print("\n✅ Free AI packages installed!")
        print("\nNext steps:")
        print("1. For Google Gemini: Get free API key from https://aistudio.google.com/")
        print("2. Add to .env: GOOGLE_API_KEY=your_key_here")
        print("3. For local AI: Install Ollama and run: ollama pull llama3:8b")
    else:
        print("\n✅ Basic setup complete! You can add free AI features later.")

if __name__ == "__main__":
    setup_ai_services()