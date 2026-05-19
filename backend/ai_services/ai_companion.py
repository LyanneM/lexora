# backend/ai_services/ai_companion.py
import random
import re
import os
import requests
from typing import List, Dict, Tuple, Any, Optional
import uuid
from datetime import datetime

try:
    import google.generativeai as genai
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False
    print("⚠ Google Generative AI not available. Install with: pip install google-generativeai")

# this is the basic AI Companion; does not wrok but can be used as a fallback
class AICompanion:
    def __init__(self):
        self.conversation_history = {}
        self.initialize_knowledge_base()
    
    def initialize_knowledge_base(self):
        """Initialize knowledge base with more specific responses"""
        self.knowledge_base = {
            'summarize': {
                'patterns': ['summarize', 'summary', 'sum up', 'brief overview', 'main points'],
                'action': self.handle_summarize
            },
            'explain': {
                'patterns': ['explain', 'what is', 'tell me about', 'define', 'meaning of'],
                'action': self.handle_explain
            },
            'quiz': {
                'patterns': ['quiz', 'test', 'exam', 'questions', 'practice test'],
                'action': self.handle_quiz
            },
            'examples': {
                'patterns': ['example', 'instance', 'case study', 'illustrate', 'show me'],
                'action': self.handle_examples
            },
            'improve': {
                'patterns': ['improve', 'better', 'enhance', 'fix', 'suggestions'],
                'action': self.handle_improve
            }
        }
    
    def generate_response(self, message: str, user_id: str, conversation_id: str = None) -> Dict:
        """Generate AI response to user message"""
        if conversation_id is None:
            conversation_id = str(uuid.uuid4())
        
        # Store conversation history
        if conversation_id not in self.conversation_history:
            self.conversation_history[conversation_id] = []
        
        # Add user message to history
        self.conversation_history[conversation_id].append({
            'user': message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Analyze message and generate intelligent response
        response = self.process_message(message)
        
        # Add AI response to history
        self.conversation_history[conversation_id].append({
            'ai': response,
            'timestamp': datetime.now().isoformat()
        })
        
        return {
            "response": response,
            "conversation_id": conversation_id,
            "timestamp": datetime.now().isoformat()
        }
    
    def process_message(self, message: str) -> str:
        """Process user message and generate appropriate response"""
        message_lower = message.lower().strip()
        
        print(f"🔍 Processing message: {message_lower}")
        
        # Extract content from the message given
        content = self.extract_content(message)
        print(f"📝 Extracted content: {content[:100]}...")
        
        # Check for  actions
        for action_type, action_data in self.knowledge_base.items():
            if any(pattern in message_lower for pattern in action_data['patterns']):
                return action_data['action'](message_lower, content)
        
        # Check for greetings
        if any(greeting in message_lower for greeting in ['hello', 'hi', 'hey', 'greetings']):
            return self.handle_greeting()
        
        # Check for help
        if any(word in message_lower for word in ['help', 'assist', 'support', 'what can you do']):
            return self.handle_help()
        
        # Default response for unclear requests
        return self.handle_default(message_lower, content)
    
    def extract_content(self, message: str) -> str:
        """Extract content from the user's message"""
        # Look for content after keywords like "content:", "this:", or in quotes
        patterns = [
            r'content:\s*(.*)',
            r'this:\s*(.*)',
            r'note:\s*(.*)',
            r'[""''](.*?)[""'']',
            r'based on.*?:\s*(.*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE | re.DOTALL)
            if match:
                content = match.group(1).strip()
                if len(content) > 10:  # Only return if there is substantial content; if not, drink alcohol
                    return content
        
        # I am already tired, I will finish later
        if len(message) < 100:
            return message
        
        return ""
    
    def handle_summarize(self, message: str, content: str) -> str:
        """Handle summarize requests"""
        if not content:
            return "I'd be happy to summarize your content! Please share the text you'd like me to summarize, or make sure you've added content to your note."
        
        # Simple summarization logic
        sentences = re.split(r'[.!?]+', content)
        key_sentences = []
        
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 20: 
                if any(keyword in sentence.lower() for keyword in ['is', 'means', 'refers to', 'important', 'key', 'essential']):
                    key_sentences.append(sentence)
        
        if key_sentences:
            summary = " ".join(key_sentences[:3])  # Take top key sentences
            return f"Here's a summary of the key points:\n\n{summary}\n\nThis covers the main concepts about corporate governance, including its definition and importance in ensuring accountability."
        else:
           
            words = content.split()
            if len(words) > 50:
                summary = " ".join(words[:50]) + "..."
                return f"Based on your content, here are the main points:\n\n{summary}\n\nThe text discusses corporate governance principles and stakeholder management."
            else:
                return f"I've reviewed your content about corporate governance. The main focus is on: {content[:200]}..."
    
    def handle_explain(self, message: str, content: str) -> str:
        """Handle explain requests"""
        if not content:
            return "I'd be happy to explain concepts! Please share the specific concept or content you'd like me to explain."
        
        # this code is too long; I should have sold mandazis instead
        key_terms = self.extract_key_terms(content)
        
        if key_terms:
            explanations = []
            for term in key_terms[:3]:  
                explanation = self.generate_explanation(term, content)
                explanations.append(f"**{term}**: {explanation}")
            
            return "Here are explanations of the key concepts:\n\n" + "\n\n".join(explanations)
        else:
            return f"I'll explain the main concepts from your content. This appears to be about corporate governance - which involves the systems and processes that direct and control companies, ensuring accountability to stakeholders like shareholders, management, and regulators."
    
    def handle_quiz(self, message: str, content: str) -> str:
        """Handle quiz requests"""
        if not content:
            return "I can create a quiz for you! Please add some content to your note first, or share the topics you'd like to be quizzed on."
        
        key_terms = self.extract_key_terms(content)
        
        if key_terms:
            quiz_questions = self.generate_quiz_questions(key_terms, content)
            return f"Here's a practice quiz based on your notes:\n\n{quiz_questions}\n\nTry answering these questions to test your understanding!"
        else:
            return "Based on your corporate governance content, here are some key areas to focus on:\n\n1. What is corporate governance and why is it important?\n2. How does corporate governance address the principal-agent problem?\n3. Who are the key stakeholders in corporate governance?\n4. What are the main components of corporate governance systems?"
    
    def handle_examples(self, message: str, content: str) -> str:
        """Handle examples requests"""
        key_terms = self.extract_key_terms(content)
        
        if key_terms:
            examples = self.generate_examples(key_terms)
            return f"Here are some real-world examples:\n\n{examples}"
        else:
            return "For corporate governance, here are some practical examples:\n\n• A public company's board of directors overseeing executive decisions\n• Shareholder meetings where investors vote on important matters\n• Regulatory compliance reports submitted to government agencies\n• Internal audits ensuring financial transparency"
    
    def handle_improve(self, message: str, content: str) -> str:
        """Handle improve requests"""
        if not content:
            return "I'd be happy to help improve your notes! Please share the content you'd like me to review."
        
        suggestions = self.generate_improvement_suggestions(content)
        return f"Here are some suggestions to improve your notes:\n\n{suggestions}"
    
    def handle_greeting(self) -> str:
        """Handle greeting messages"""
        greetings = [
            "Hello! I'm your Lexora AI companion. I can help summarize notes, explain concepts, create quizzes, and more! What would you like to work on?",
            "Hi there! I'm here to help with your studies. I can analyze your notes, create practice questions, explain difficult concepts, and provide examples. How can I assist you?",
            "Welcome! I'm your AI study partner. I specialize in helping students understand complex topics through summarization, explanations, quizzes, and examples. What would you like me to help with?"
        ]
        return random.choice(greetings)
    
    def handle_help(self) -> str:
        """Handle help requests"""
        return """I'm your AI Study Companion! Here's what I can help you with:

📚 **Note Analysis**:
• Summarize your notes
• Explain complex concepts
• Suggest improvements
• Identify key points

🎯 **Study Tools**:
• Create practice quizzes
• Generate study questions
• Provide real-world examples
• Create study guides

💡 **Learning Support**:
• Break down difficult topics
• Provide alternative explanations
• Create analogies
• Suggest related concepts

Just share your notes or ask me specific questions about what you're studying!"""
    
    def handle_default(self, message: str, content: str) -> str:
        """Handle messages that don't match specific patterns"""
        if content:
            return f"I see you're sharing content about corporate governance. I can help you:\n\n• 📝 Summarize this content\n• 💡 Explain the key concepts\n• 🎯 Create a practice quiz\n• 🌟 Provide real-world examples\n\nWhat would you like me to do with this information?"
        else:
            responses = [
                "I'm here to help with your studies! You can ask me to summarize notes, explain concepts, create quizzes, or provide examples. What would you like to work on?",
                "I'd love to assist you with your learning! Please share your notes or let me know what specific help you need - summarization, explanations, quizzes, or examples?",
                "I'm your AI study companion! I can help you understand complex topics, organize your notes, create study materials, and test your knowledge. How can I help you today?"
            ]
            return random.choice(responses)
    
    def extract_key_terms(self, content: str) -> List[str]:
        """Extract key terms from content"""
        # Simple term extraction; just look for capitalized phrases and important words
        words = content.split()
        key_terms = []
        
        for i, word in enumerate(words):
            clean_word = re.sub(r'[^\w\s]', '', word)
            if (len(clean_word) > 5 and 
                clean_word[0].isupper() and 
                clean_word.lower() not in ['the', 'this', 'that', 'these', 'those']):
                key_terms.append(clean_word)
        
        # Remove duplicates
        return list(dict.fromkeys(key_terms))[:5]
    
    def generate_explanation(self, term: str, context: str) -> str:
        """Generate explanation for a term based on context"""
        explanations = {
            'corporate': "Relating to large companies or corporations",
            'governance': "The system of rules, practices, and processes by which an organization is directed and controlled",
            'accountability': "The responsibility of individuals or organizations to account for their actions",
            'stakeholders': "Individuals or groups with an interest in the organization's success",
            'principal-agent': "A relationship where one party (principal) delegates work to another (agent)",
            'shareholders': "Owners of shares in a company, also known as stockholders"
        }
        
        term_lower = term.lower()
        for key, explanation in explanations.items():
            if key in term_lower:
                return explanation
        
        
        return f"A key concept in corporate governance that relates to {term.lower()} in organizational management."
    
    def generate_quiz_questions(self, terms: List[str], context: str) -> str:
        """Generate quiz questions based on key terms"""
        questions = []
        
        question_templates = [
            "What is the main purpose of {term} in corporate governance?",
            "How does {term} contribute to effective organizational management?",
            "Why is {term} important for stakeholder relationships?",
            "What role does {term} play in addressing the principal-agent problem?"
        ]
        
        for i, term in enumerate(terms[:4]):  # Max 4 questions
            template = random.choice(question_templates)
            questions.append(f"{i + 1}. {template.format(term=term)}")
        
        return "\n".join(questions)
    
    def generate_examples(self, terms: List[str]) -> str:
        """Generate examples for key terms"""
        examples = []
        
        example_data = {
            'corporate governance': "Example: A company's board of directors setting ethical guidelines and oversight procedures",
            'accountability': "Example: CEOs being required to report financial performance to shareholders quarterly",
            'stakeholders': "Example: Customers, employees, suppliers, and local communities affected by company decisions",
            'principal-agent': "Example: Shareholders (principals) hiring managers (agents) to run the company day-to-day"
        }
        
        for term in terms:
            term_lower = term.lower()
            for key, example in example_data.items():
                if key in term_lower:
                    examples.append(f"• {example}")
                    break
        
        if not examples:
            examples = [
                "• A publicly traded company implementing transparency policies for investors",
                "• A board of directors overseeing executive compensation decisions",
                "• Regular audits ensuring financial reporting accuracy",
                "• Shareholder meetings where major decisions are voted on"
            ]
        
        return "\n".join(examples[:4])
    
    def generate_improvement_suggestions(self, content: str) -> str:
        """Generate suggestions for improving notes"""
        suggestions = []
        
    
        if len(content.split()) < 50:
            suggestions.append("• Add more detail and examples to make the notes more comprehensive")
        
        if not any(char.isdigit() for char in content):
            suggestions.append("• Consider adding numbered lists or bullet points for better organization")
        
        if not re.search(r'[.!?]$', content.strip()):
            suggestions.append("• Ensure each main point is a complete sentence for clarity")
        
        if not suggestions:
            suggestions = [
                "• Use headings to separate different concepts",
                "• Add definitions for key terms",
                "• Include real-world applications or examples",
                "• Create summary sections for quick review"
            ]
        
        return "\n".join(suggestions)
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict]:
        """Get conversation history for a specific conversation"""
        return self.conversation_history.get(conversation_id, [])
    
    def clear_conversation(self, conversation_id: str) -> bool:
        """Clear conversation history"""
        if conversation_id in self.conversation_history:
            del self.conversation_history[conversation_id]
            return True
        return False

# Enhanced AI Companion powered by Google Gemini or Gen API for short
class EnhancedAICompanion:
    def __init__(self, model_provider="google"):
        self.model_provider = model_provider
        self.conversation_history = {}
        self.setup_models()
    
    def setup_models(self):
        """Setup Google Gemini with model discovery"""
        print("🔧 Setting up Google Gemini...")
        
        if self.model_provider == "google":
            try:
                import google.generativeai as genai
                import os
                from dotenv import load_dotenv
                
                load_dotenv()
                api_key = os.getenv('GOOGLE_API_KEY')
                
                if api_key:
                    genai.configure(api_key=api_key)
                    
                    # List all available models to see what we have access to
                    print("📋 Discovering available models...")
                    available_models = []
                    try:
                        for model in genai.list_models():
                            if 'generateContent' in model.supported_generation_methods:
                                available_models.append(model.name)
                                print(f"   ✅ Available: {model.name}")
                    except Exception as e:
                        print(f"⚠️ Could not list models: {e}")
                    
                    # this si to try any models available, check for any that work
                    model_names_to_try = available_models if available_models else [
                        'gemini-1.5-flash',
                        'gemini-1.5-pro',
                        'gemini-1.0-pro',
                        'models/gemini-1.5-flash',
                        'models/gemini-1.5-pro', 
                        'models/gemini-1.0-pro'
                    ]
                    
                    self.model = None
                    for model_name in model_names_to_try:
                        try:
                            print(f"🧪 Trying model: {model_name}")
                            self.model = genai.GenerativeModel(model_name)
                            test_response = self.model.generate_content("Say just 'SUCCESS'")
                            if "success" in test_response.text.lower():
                                print(f"✅ Model {model_name} works: {test_response.text}")
                                self.model_working = True
                                self.active_model = model_name
                                break
                            else:
                                print(f"⚠️ Model {model_name} responded but not as expected: {test_response.text}")
                        except Exception as e:
                            print(f"❌ Model {model_name} failed: {e}")
                            continue
                    
                    if not self.model:
                        print("❌ No working model found")
                        print("💡 Check your Google AI Studio account and enable Gemini API")
                        self.model_working = False
                        
                else:
                    print("❌ GOOGLE_API_KEY not found")
                    self.model_working = False
                    
            except Exception as e:
                print(f"❌ Gemini setup failed: {e}")
                self.model_working = False
        else:
            self.model_working = False
    
    def generate_llm_response(self, prompt: str, context: str = "") -> str:
        """Generate response using Google Gemini"""
        if not hasattr(self, 'model') or self.model is None or not hasattr(self, 'model_working') or not self.model_working:
            return "Google Gemini is not configured properly."
             # try to create a better prompt for educational context tomorrow       
        try:

            if context and len(context) > 10:
                full_prompt = f"""You are an AI study assistant. Based on the following context, please help the user:

Context: {context}

User Question: {prompt}

Please provide a helpful, educational response:"""
            else:
                full_prompt = f"""You are an AI study assistant. Please help the user with their question:

User Question: {prompt}

Please provide a helpful, educational response:"""
            
            response = self.model.generate_content(full_prompt)
            return response.text
            
        except Exception as e:
            error_msg = f"Google Gemini API error: {str(e)}"
            print(f"❌ {error_msg}")
            return error_msg
    
    def generate_response(self, message: str, user_id: str, conversation_id: str = None) -> Dict:
        """Generate AI response using enhanced models"""
        if conversation_id is None:
            conversation_id = str(uuid.uuid4())
        
        # Store conversation history
        if conversation_id not in self.conversation_history:
            self.conversation_history[conversation_id] = []
        
        # Add user message to history
        self.conversation_history[conversation_id].append({
            'user': message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Generate enhanced response
        response = self.generate_llm_response(message)
        
        # Add AI response to history
        self.conversation_history[conversation_id].append({
            'ai': response,
            'timestamp': datetime.now().isoformat()
        })
        
        return {
            "response": response,
            "conversation_id": conversation_id,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict]:
        """Get conversation history for a specific conversation"""
        return self.conversation_history.get(conversation_id, [])
    
    def clear_conversation(self, conversation_id: str) -> bool:
        """Clear conversation history"""
        if conversation_id in self.conversation_history:
            del self.conversation_history[conversation_id]
            return True
        return False

# Hybrid version that combines both basic and gen AI; let's pray it works
class HybridAICompanion(AICompanion):
    def __init__(self):
        super().__init__()
        self.llm_companion = EnhancedAICompanion("google")
        print("🤖 Hybrid AI Companion initialized")
    
    def process_message(self, message: str) -> str:
        """Enhanced processing with Google Gemini fallback"""
        message_lower = message.lower().strip()
        content = self.extract_content(message)
        
        print(f"🔍 Hybrid processing: '{message[:50]}...'")
        
        # FIRST: Always try Gemini for everything! This is important!
        try:
            gemini_response = self.llm_companion.generate_llm_response(message, content)
            
            error_indicators = ['unavailable', 'not available', 'set up', 'api key', 'configure', 'install']
            is_error_response = any(indicator in gemini_response.lower() for indicator in error_indicators)
            
            if not is_error_response:
                print("✅ Using Google Gemini response")
                return gemini_response
            else:
                print(f"⚠️ Gemini returned error: {gemini_response[:100]}...")
        except Exception as e:
            print(f"❌ Gemini call failed: {e}")
        
    
        print("🔄 Gemini failed, using structured responses...")
        for action_type, action_data in self.knowledge_base.items():
            if any(pattern in message_lower for pattern in action_data['patterns']):
                print(f"✅ Using structured response for: {action_type}")
                return action_data['action'](message_lower, content)
        
        # FINAL: Basic fallback
        print("✅ Using basic fallback response")
        return self.handle_default(message_lower, content)
    
    #FINALLYYY! I will buy a smocha if this works