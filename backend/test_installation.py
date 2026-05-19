#!/usr/bin/env python3

try:
    import torch
    print(f"✓ PyTorch installed: {torch.__version__}")
    print(f"✓ CUDA available: {torch.cuda.is_available()}")
    
    import transformers
    print(f"✓ Transformers installed: {transformers.__version__}")
    
    import sentence_transformers
    print(f"✓ Sentence Transformers installed")
    
    import nltk
    print(f"✓ NLTK installed: {nltk.__version__}")
    
    print("All dependencies installed successfully!")
    
except ImportError as e:
    print(f"✗ Import error: {e}")
except Exception as e:
    print(f"✗ Error: {e}")