// src/utils/quizApiService.js
const QUIZ_API_URL = 'https://colab.research.google.com/drive/1x9jgHC5sT6p7RIgplyk8fR_yXRC7nF1U?usp=sharing'; 
export const quizApiService = {
  generateQuiz: async (content, numQuestions = 5, questionType = 'multiple_choice') => {
    try {
      const response = await fetch(`${QUIZ_API_URL}/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          num_questions: numQuestions,
          question_type: questionType
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Quiz API Error:', error);
      throw error;
    }
  },
  
  checkHealth: async () => {
    try {
      const response = await fetch(`${QUIZ_API_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};