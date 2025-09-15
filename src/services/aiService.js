import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const aiService = {
  // Chat with AI companion
  chatWithAI: async (message, userId, conversationId = null) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message,
        user_id: userId,
        conversation_id: conversationId
      });
      return response.data;
    } catch (error) {
      console.error('Error chatting with AI:', error);
      throw error;
    }
  },

  // Generate quiz from text content
  generateQuiz: async (content, numQuestions = 5, quizType = 'multiple_choice', subject = null) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-quiz`, {
        content,
        num_questions: numQuestions,
        quiz_type: quizType,
        subject
      });
      return response.data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  },

  // Generate quiz from uploaded file
  generateQuizFromFile: async (file, numQuestions = 5) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API_BASE_URL}/generate-quiz-from-upload?num_questions=${numQuestions}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating quiz from file:', error);
      throw error;
    }
  }
};

export default aiService;