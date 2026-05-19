# backend/ai_services/quiz_generator.py
import json
from typing import Dict, Any, List
from datetime import datetime
import random
import re
import pandas as pd
import numpy as np
from transformers import pipeline
import torch

class QuizGenerator:
    def __init__(self):
        self.gemini_configured = False
        self.question_dataset = None
        self.transformer_models = {}
        self.load_question_dataset()
        self.setup_gemini()
        self.setup_transformer_models()
        print(f"✅ Quiz Generator initialized - Gemini: {self.gemini_configured}, Transformers: {len(self.transformer_models)} models")
    
    def load_question_dataset(self):
        """Load the question dataset for reference"""
        try:
            self.question_dataset = pd.read_csv('data/clean_question_dataset.csv')
            print(f"✅ Loaded question dataset with {len(self.question_dataset)} questions")
        except Exception as e:
            print(f"⚠️ Could not load question dataset: {e}")
            self.question_dataset = None
    
    def setup_gemini(self):
        """Setup Google Gemini for quiz generation"""
        try:
            import google.generativeai as genai
            import os
            from dotenv import load_dotenv
            
            load_dotenv()
            api_key = os.getenv('GOOGLE_API_KEY')
            
            if api_key:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('models/gemini-2.5-flash')
                self.gemini_configured = True
                print("✅ Quiz Generator: Google Gemini configured successfully")
            else:
                print("❌ Quiz Generator: GOOGLE_API_KEY not found")
                self.gemini_configured = False
                
        except Exception as e:
            print(f"❌ Quiz Generator: Gemini setup failed: {e}")
            self.gemini_configured = False
    
    def setup_transformer_models(self):
        """Setup transformer models for question generation"""
        try:
            # Pre-trained question generation model
            self.transformer_models['question_generation'] = pipeline(
                "text2text-generation", 
                model="mrm8488/t5-base-finetuned-question-generation",
                max_length=128,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            
            # Multiple choice generator
            self.transformer_models['multiple_choice'] = pipeline(
                "text-generation",
                model="gpt2",  # Using GPT-2 as base, you can replace with better models
                max_length=200,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            
            print("✅ Transformer models loaded successfully")
            
        except Exception as e:
            print(f"⚠️ Transformer models setup failed: {e}")
            print("✅ Falling back to template-based generation")
            self.transformer_models = {}
    
    def generate_from_text(self, content: str, options: Dict = None) -> Dict:
        """Generate quiz questions using multiple methods with fallback"""
        if options is None:
            options = {}
        
        num_questions = options.get('num_questions', 5)
        quiz_type = options.get('quiz_type', 'mixed')
        question_formats = options.get('question_formats', ['multiple_choice', 'fill_blank', 'true_false', 'open_ended'])
        subject = options.get('subject', 'General')
        level = options.get('level', 'High School')
        
        print(f"🎯 Generating {num_questions} {quiz_type} questions for {subject}...")
        
        # Method 1: Try Google Gemini first (highest quality)
        if self.gemini_configured:
            try:
                gemini_quiz = self._generate_with_gemini(
                    content, num_questions, quiz_type, question_formats, subject
                )
                if gemini_quiz and len(gemini_quiz.get("questions", [])) > 0:
                    print("✅ Using Google Gemini quiz generation")
                    return gemini_quiz
            except Exception as e:
                print(f"⚠️ Gemini quiz generation failed: {e}")
        
        # Method 2: Try Transformer models
        try:
            transformer_quiz = self._generate_with_transformers(
                content, num_questions, quiz_type, question_formats, subject, level
            )
            if transformer_quiz and len(transformer_quiz.get("questions", [])) > 0:
                print("✅ Using Transformer model quiz generation")
                return transformer_quiz
        except Exception as e:
            print(f"⚠️ Transformer generation failed: {e}")
        
        # Method 3: Template-based generation (fallback)
        print("✅ Using template-based quiz generation")
        return self._generate_with_templates(content, num_questions, quiz_type, question_formats, subject, level)
    
    def _generate_with_gemini(self, content: str, num_questions: int, quiz_type: str, 
                            question_formats: List[str], subject: str) -> Dict:
        """Generate quiz using Google Gemini with multiple question formats"""
        try:
            similar_questions_prompt = self._get_similar_questions_prompt(subject)
            
            format_descriptions = {
                'multiple_choice': 'multiple choice questions with 4 options and one correct answer',
                'fill_blank': 'fill in the blank questions where a key word/phrase is missing',
                'true_false': 'true/false questions with clear factual statements',
                'open_ended': 'open-ended questions requiring short written answers',
                'essay': 'essay questions requiring longer written responses',
                'structured': 'structured questions with specific answer requirements'
            }
            
            selected_formats = [format_descriptions.get(f, f) for f in question_formats]
            formats_text = ', '.join(selected_formats)
            
            prompt = f"""
            Based on this educational content: "{content[:1500]}"
            
            {similar_questions_prompt}
            
            Create {num_questions} educational questions in these formats: {formats_text}.
            
            Distribute the question types appropriately across the formats.
            
            Return ONLY valid JSON format (no other text):
            {{
                "questions": [
                    {{
                        "question": "clear question text",
                        "type": "question_type",
                        "options": ["option1", "option2", "option3", "option4"],  // only for multiple_choice
                        "correct_answer": "exact correct answer",
                        "explanation": "brief educational explanation",
                        "difficulty": "easy|medium|hard"
                    }}
                ]
            }}
            
            Guidelines for each question type:
            - Multiple choice: 4 plausible options, one clearly correct
            - Fill in blank: Clear blank indicated with _____
            - True/false: Unambiguous factual statements
            - Open ended: Require 1-2 sentence answers
            - Essay: Require paragraph-length responses
            - Structured: Step-by-step problem solving
            
            Make questions educational, varied, and based on the content.
            """
            
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            print(f"🔍 Gemini raw response: {response_text[:200]}...")
            
            cleaned_response = self._clean_json_response(response_text)
            quiz_data = json.loads(cleaned_response)
            
            if "questions" in quiz_data and isinstance(quiz_data["questions"], list):
                return {
                    "subject": subject,
                    "total_questions": len(quiz_data["questions"]),
                    "questions": quiz_data["questions"],
                    "generated_at": datetime.now().isoformat(),
                    "quiz_type": quiz_type,
                    "question_formats": question_formats,
                    "enhanced_features": True,
                    "method": "gemini"
                }
            else:
                print("❌ Gemini response missing 'questions' array")
                return None
                
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse Gemini JSON response: {e}")
            print(f"Raw response: {response_text[:500]}")
            return None
        except Exception as e:
            print(f"❌ Gemini quiz generation error: {e}")
            return None
    
    def _generate_with_transformers(self, content: str, num_questions: int, quiz_type: str,
                                  question_formats: List[str], subject: str, level: str) -> Dict:
        """Generate questions using transformer models with proper fallback"""
        try:
            # If transformers not available, use template fallback
            if not self.transformer_models or len(self.transformer_models) == 0:
                print("⚠️ Transformers not available, using template fallback")
                return self._generate_with_templates(content, num_questions, quiz_type, question_formats, subject, level)
            
            questions = []
            format_cycle = self._cycle_question_formats(question_formats, num_questions)
            
            for i, q_format in enumerate(format_cycle):
                question_data = self._generate_question_with_transformer(
                    content, q_format, subject, level, i
                )
                if question_data:
                    questions.append(question_data)
            
            if questions:
                return {
                    "subject": subject,
                    "total_questions": len(questions),
                    "questions": questions,
                    "generated_at": datetime.now().isoformat(),
                    "quiz_type": quiz_type,
                    "question_formats": question_formats,
                    "enhanced_features": True,
                    "method": "transformer"
                }
            else:
                print("⚠️ Transformer generation produced no questions, using template fallback")
                return self._generate_with_templates(content, num_questions, quiz_type, question_formats, subject, level)
                
        except Exception as e:
            print(f"⚠️ Transformer generation failed, using template fallback: {e}")
            return self._generate_with_templates(content, num_questions, quiz_type, question_formats, subject, level)
    
    def _generate_question_with_transformer(self, content: str, q_type: str, subject: str, level: str, index: int) -> Dict:
        """Generate a single question using transformer models with fallback"""
        try:
            # Check if transformer models are available
            if not self.transformer_models or len(self.transformer_models) == 0:
                return None
                
            if q_type == 'multiple_choice' and 'multiple_choice' in self.transformer_models:
                prompt = f"Generate a multiple choice question about: {content[:500]}"
                result = self.transformer_models['multiple_choice'](
                    prompt, 
                    max_length=150, 
                    num_return_sequences=1,
                    temperature=0.8
                )
                question_text = result[0]['generated_text'].strip()
            elif 'question_generation' in self.transformer_models:
                # Use question generation model
                prompt = f"generate {q_type} question: {content[:500]}"
                result = self.transformer_models['question_generation'](
                    prompt,
                    max_length=100,
                    num_return_sequences=1,
                    temperature=0.7
                )
                question_text = result[0]['generated_text'].strip()
            else:
                # No suitable transformer model available
                return None
            
            # Create question data structure
            base_data = {
                "question": f"Q{index + 1}: {question_text}",
                "type": q_type,
                "correct_answer": self._generate_correct_answer(question_text, q_type),
                "explanation": f"This question tests understanding of {subject} concepts",
                "difficulty": random.choice(["easy", "medium", "hard"])
            }
            
            if q_type == 'multiple_choice':
                base_data["options"] = self._generate_options(base_data["correct_answer"])
            
            return base_data
            
        except Exception as e:
            print(f"⚠️ Transformer question generation failed: {e}")
            return None
    
    def _generate_with_templates(self, content: str, num_questions: int, quiz_type: str,
                               question_formats: List[str], subject: str, level: str) -> Dict:
        """Generate questions using template-based approach"""
        template_gen = TemplateBasedGenerator()
        questions = []
        
        format_cycle = self._cycle_question_formats(question_formats, num_questions)
        
        for i, q_format in enumerate(format_cycle):
            template_questions = template_gen.generate_from_template(
                content, q_format, 1
            )
            
            if template_questions:
                question_data = {
                    "question": f"Q{i + 1}: {template_questions[0]}",
                    "type": q_format,
                    "correct_answer": self._generate_correct_answer(template_questions[0], q_format),
                    "explanation": f"This question assesses knowledge of {subject}",
                    "difficulty": random.choice(["easy", "medium", "hard"])
                }
                
                if q_format == 'multiple_choice':
                    question_data["options"] = self._generate_options(question_data["correct_answer"])
                
                questions.append(question_data)
        
        return {
            "subject": subject,
            "total_questions": len(questions),
            "questions": questions,
            "generated_at": datetime.now().isoformat(),
            "quiz_type": quiz_type,
            "question_formats": question_formats,
            "enhanced_features": True,
            "method": "template"
        }
    
    def _generate_correct_answer(self, question: str, q_type: str) -> str:
        """Generate a plausible correct answer based on question type"""
        if q_type == 'multiple_choice':
            return "The correct option based on the content"
        elif q_type == 'true_false':
            return random.choice(["True", "False"])
        elif q_type in ['fill_blank', 'open_ended']:
            return "Key concept from the educational content"
        elif q_type == 'essay':
            return "Comprehensive explanation covering main points"
        else:
            return "Appropriate answer based on the question"
    
    def _generate_options(self, correct_answer: str) -> List[str]:
        """Generate multiple choice options"""
        options = [correct_answer]
        # Add plausible distractors
        distractors = [
            "Common misconception related to the topic",
            "Unrelated but plausible concept",
            "Opposite of the correct answer",
            "Overly simplified version"
        ]
        options.extend(distractors[:3])  # Add 3 distractors
        random.shuffle(options)
        return options
    
    def _get_similar_questions_prompt(self, subject: str) -> str:
        """Get similar questions from dataset to guide generation"""
        if self.question_dataset is None:
            return ""
        
        try:
            subject_questions = self.question_dataset[
                self.question_dataset['Subject'].str.contains(subject, case=False, na=False)
            ]
            
            if len(subject_questions) > 0:
                sample_questions = subject_questions.head(5)
                prompt_lines = ["Here are examples of similar questions from this subject:"]
                
                for _, row in sample_questions.iterrows():
                    prompt_lines.append(f"- Type: {row['Type']}, Style: {row['Style']}, Question: {row['Question']}")
                
                return "\n".join(prompt_lines)
            else:
                styles = self.question_dataset['Style'].unique()
                types = self.question_dataset['Type'].unique()
                return f"Use common question styles like: {', '.join(styles)} and types like: {', '.join(types)}"
                
        except Exception as e:
            print(f"⚠️ Error getting similar questions: {e}")
            return ""
    
    def _cycle_question_formats(self, formats: List[str], total: int) -> List[str]:
        """Cycle through question formats to distribute them evenly"""
        if not formats:
            return ['multiple_choice'] * total
        
        cycle = []
        while len(cycle) < total:
            for fmt in formats:
                if len(cycle) < total:
                    cycle.append(fmt)
        return cycle
    
    def _clean_json_response(self, response_text: str) -> str:
        """Clean and extract JSON from response"""
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
   
        start_idx = response_text.find('{')
        if start_idx != -1:
            response_text = response_text[start_idx:]
        
        end_idx = response_text.rfind('}')
        if end_idx != -1:
            response_text = response_text[:end_idx + 1]
        
        return response_text.strip()


class TemplateBasedGenerator:
    """Template-based question generator as fallback"""
    def __init__(self):
        self.templates = {
            "multiple_choice": [
                "Which of the following best describes {concept}?",
                "What is the primary function of {concept}?",
                "Which statement about {concept} is correct?",
                "The main purpose of {concept} is to:"
            ],
            "fill_blank": [
                "The process of {concept} involves ______.",
                "______ is responsible for {function}.",
                "The main component of {system} is ______."
            ],
            "true_false": [
                "{concept} is always true in all circumstances.",
                "The statement about {concept} is accurate.",
                "{concept} can be verified through experimentation."
            ],
            "open_ended": [
                "Explain the significance of {concept}.",
                "Describe how {concept} works.",
                "What are the main characteristics of {concept}?"
            ],
            "essay": [
                "Discuss the importance of {concept} in {context}.",
                "Explain how {concept} works and its significance.",
                "Analyze the relationship between {concept1} and {concept2}."
            ],
            "structured": [
                "Outline the steps involved in {process}.",
                "Compare and contrast {concept1} with {concept2}.",
                "Analyze the key factors affecting {phenomenon}."
            ]
        }
    
    def extract_concepts(self, text):
        """Extract key concepts from text"""
        words = re.findall(r'\b[A-Z][a-z]+\b', text)
        concepts = list(set([word for word in words if len(word) > 5]))
        return concepts[:5] if concepts else ["the main topic"]
    
    
    def generate_from_template(self, text, question_type="multiple_choice", num_questions=3):
        """Generate questions using templates"""
        concepts = self.extract_concepts(text)
        questions = []
        
        templates = self.templates.get(question_type, self.templates["multiple_choice"])
        
        for i in range(num_questions):
            if concepts:
                concept = random.choice(concepts)
                template = random.choice(templates)
                
                # Handle different template placeholders
                if "{concept1}" in template and "{concept2}" in template:
                    if len(concepts) >= 2:
                        question = template.format(concept1=concepts[0], concept2=concepts[1])
                    else:
                        question = template.format(concept1=concept, concept2="related concept")
                elif "{function}" in template:
                    question = template.format(function=f"the {concept} process")
                elif "{system}" in template:
                    question = template.format(system=concept)
                elif "{process}" in template:
                    question = template.format(process=concept)
                elif "{phenomenon}" in template:
                    question = template.format(phenomenon=concept)
                elif "{context}" in template:
                    question = template.format(concept=concept, context="its field")
                else:
                    question = template.format(concept=concept)
                
                questions.append(question)
            else:
                questions.append(f"Explain the key points about: {text[:100]}...")
        
        return questions