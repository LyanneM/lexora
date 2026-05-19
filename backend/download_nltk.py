# backend/download_nltk.py
import nltk

def download_nltk_data():
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('averaged_perceptron_tagger')
    print("✓ NLTK data downloaded successfully")

if __name__ == "__main__":
    download_nltk_data()