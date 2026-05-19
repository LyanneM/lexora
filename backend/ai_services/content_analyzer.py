# backend/ai_services/content_analyzer.py
import re
import nltk
from typing import List, Dict, Tuple
import random

class ContentAnalyzer:
    def __init__(self):
        self.subject_keywords = {
            'Mathematics': ['calculate', 'solve', 'equation', 'formula', 'algebra', 'calculus', 'geometry', 'trigonometry'],
            'Science': ['physics', 'chemistry', 'biology', 'experiment', 'theory', 'scientific', 'hypothesis'],
            'Business': ['management', 'marketing', 'finance', 'entrepreneurship', 'business', 'corporate', 'strategy'],
            'Technology': ['computer', 'software', 'programming', 'digital', 'technology', 'code', 'algorithm'],
            'Literature': ['literature', 'poem', 'novel', 'author', 'writing', 'narrative', 'theme'],
            'History': ['history', 'historical', 'ancient', 'century', 'war', 'civilization', 'empire']
        }
    
    def analyze_content(self, content: str) -> Dict:
        """Comprehensive content analysis for quiz generation"""
        if not content:
            return {}
        
        print("🔍 Analyzing content for quiz generation...")
        
        # Clean content
        clean_content = self.clean_content(content)
        
        # Extract key information
        subject = self.detect_subject(clean_content)
        key_concepts = self.extract_key_concepts(clean_content)
        complexity = self.assess_complexity(clean_content)
        
        analysis = {
            'subject': subject,
            'key_concepts': key_concepts,
            'complexity_level': complexity,
            'content_length': len(clean_content),
            'sentence_count': len(re.split(r'[.!?]+', clean_content)),
            'recommended_questions': min(max(len(key_concepts), 5), 20)
        }
        
        print(f"📊 Analysis complete: {subject}, {len(key_concepts)} concepts, {complexity} level")
        return analysis
    
    def clean_content(self, content: str) -> str:
        """Remove formatting and extract meaningful text"""
        # Remove slide numbers, headers, etc.
        content = re.sub(r'\(Slides?\s*\d+\s*[–-]\s*\d+\s*of\s*\d+\)', '', content)
        content = re.sub(r'Slide\s*\d+\s*of\s*\d+', '', content)
        content = re.sub(r'[–-]\s*Continued', '', content)
        content = re.sub(r'-{3,}', '', content)
        
        # Extract sentences
        sentences = re.split(r'[.!?]+', content)
        meaningful_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if (len(sentence) > 20 and 
                len(sentence.split()) >= 4 and
                not sentence.startswith(('http', 'www', 'Figure', 'Table'))):
                meaningful_sentences.append(sentence)
        
        return '. '.join(meaningful_sentences)
    
    def detect_subject(self, content: str) -> str:
        """Detect the main subject with high accuracy"""
        content_lower = content.lower()
        
        subject_scores = {}
        for subject, keywords in self.subject_keywords.items():
            score = sum(1 for keyword in keywords if keyword in content_lower)
            subject_scores[subject] = score
        
        # Return subject with highest score
        best_subject = max(subject_scores, key=subject_scores.get)
        return best_subject if subject_scores[best_subject] > 0 else 'General'
    
    def extract_key_concepts(self, content: str) -> List[str]:
        """Extract meaningful concepts for quiz generation"""
        concepts = []
        sentences = re.split(r'[.!?]+', content)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 25:
                continue
            
            # Extract defined terms
            defined_terms = self.extract_defined_terms(sentence)
            concepts.extend(defined_terms)
            
            # Extract capitalized terms
            capitalized_terms = self.extract_capitalized_terms(sentence)
            concepts.extend(capitalized_terms)
        
        # Remove duplicates and return top concepts
        unique_concepts = list(dict.fromkeys(concepts))
        return [c for c in unique_concepts if len(c) > 3][:15]
    
    def extract_defined_terms(self, sentence: str) -> List[str]:
        """Extract terms that are being defined"""
        patterns = [
            r'(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|are|means|refers to|defined as)\s+',
            r'(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+involves\s+',
            r'The\s+(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+',
            r'(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+process',
            r'(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+principle'
        ]
        
        terms = []
        for pattern in patterns:
            matches = re.findall(pattern, sentence, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                if len(match) > 4 and match not in terms:
                    terms.append(match)
        
        return terms
    
    def extract_capitalized_terms(self, sentence: str) -> List[str]:
        """Extract meaningful capitalized terms"""
        words = sentence.split()
        terms = []
        
        for word in words:
            clean_word = re.sub(r'[^\w\s]', '', word)
            if (len(clean_word) >= 5 and 
                clean_word[0].isupper() and
                clean_word not in ['The', 'This', 'That', 'These', 'Those', 'However', 'Therefore'] and
                not clean_word.isupper()):
                terms.append(clean_word)
        
        return terms
    
    def assess_complexity(self, content: str) -> str:
        """Assess content complexity for question difficulty"""
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        
        if len(sentences) == 0:
            return "Beginner"
        
        avg_sentence_length = len(words) / len(sentences)
        long_words = sum(1 for word in words if len(word) > 6)
        complexity_score = (avg_sentence_length * 0.5) + (long_words / len(words) * 100 * 0.5)
        
        if complexity_score < 15:
            return "Beginner"
        elif complexity_score < 25:
            return "Intermediate"
        else:
            return "Advanced"