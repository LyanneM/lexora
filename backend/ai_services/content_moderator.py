# backend/ai_services/content_moderator.py
import re
from typing import Tuple, List

class ContentModerator:
    def __init__(self):
        #list of inappropriate patterns
        self.bad_patterns = [
            # Profanity
            r"\b(shit|fuck|asshole|bitch|bastard|cunt|piss|damn|dick|whore|slut)\b",
            r"\b(kill|murder|harm|hurt|violence|attack|fight|shoot|stab|bomb)\b",
            # Drugs
            r"\b(drugs|heroin|cocaine|meth|weed|marijuana|opium|lsd|ecstasy)\b",
            # Explicit content
            r"\b(sex|porn|nude|naked|erotic|xxx|adult|fetish|orgy)\b",
            # Hate speech
            r"\b(hate|racist|sexist|homophobic|nazi|kkk|terrorist|isis)\b",
            # Self-harm
            r"\b(suicide|self\.harm|cutting|depression|anxiety)\b"
        ]
        
        self.patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.bad_patterns]
    
    def moderate_content(self, content: str, threshold: float = 0.7) -> Tuple[bool, float]:
        """Check if content is appropriate using simple pattern matching"""
        content_lower = content.lower()
        
        # Check for inappropriate patterns
        pattern_matches = any(pattern.search(content_lower) for pattern in self.patterns)
        
        # Simple scoring - if any pattern matches, content is inappropriate, place a warning
        score = 1.0 if pattern_matches else 0.0
        
        return score < threshold, score
    
    def filter_content(self, content: str) -> str:
        """Filter out inappropriate content"""
        for pattern in self.patterns:
            content = pattern.sub('****', content)
        
        return content