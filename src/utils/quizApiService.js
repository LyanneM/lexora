// frontend/src/utils/quizApiService.js
const DEFAULT_PORTS = [8000, 8001, 8002, 8003, 8004];

export class QuizApiService {
  static currentBaseUrl = null;

  static async detectBackend() {
    console.log("🔍 Auto-detecting backend server...");
    
    for (const port of DEFAULT_PORTS) {
      const baseUrl = `http://localhost:${port}`;
      try {
        console.log(`   Testing ${baseUrl}...`);
        const response = await fetch(`${baseUrl}/health`);
        
        if (response.ok) {
          console.log(`✅ Backend found at ${baseUrl}`);
          this.currentBaseUrl = baseUrl;
          return baseUrl;
        }
      } catch (error) {
        console.log(`   ❌ ${baseUrl} not available`);
      }
    }
    
    const errorMsg = `No backend server found on ports: ${DEFAULT_PORTS.join(', ')}`;
    console.error('❌ ' + errorMsg);
    throw new Error(errorMsg);
  }

  static async getBaseUrl() {
    if (this.currentBaseUrl) {
      return this.currentBaseUrl;
    }
    return await this.detectBackend();
  }

  static async generateQuizFromText(content, options = {}) {
    try {
      const baseUrl = await this.getBaseUrl();
      console.log(`🚀 Sending request to ${baseUrl}/generate-quiz`);
      
      const response = await fetch(`${baseUrl}/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          num_questions: options.numQuestions || 10,
          quiz_type: options.quizType || 'mixed',
          subject: options.subject || null
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      console.log("🔍 RAW BACKEND RESPONSE:", data);
      console.log("📊 Questions array:", data.quiz_data?.questions);
      console.log("🔢 Number of questions:", data.quiz_data?.questions?.length);
      console.log("🎯 Quiz data structure:", data.quiz_data);
      
      console.log(`✅ Generated ${data.quiz_data?.questions?.length || 0} questions`);
      return data;
      
    } catch (error) {
      console.error('❌ Quiz generation failed:', error);
      this.currentBaseUrl = null;
      throw new Error(`Cannot connect to AI server. ${error.message}`);
    }
  }

  static async getServerInfo() {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await fetch(`${baseUrl}/server-info`);
      
      if (!response.ok) {
        throw new Error(`Server info failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Server info error:', error);
      this.currentBaseUrl = null;
      return { 
        mode: 'unknown', 
        error: error.message,
        server: 'Not available'
      };
    }
  }

  static async generateQuizFromFile(file, numQuestions = 10) {
    try {
      const baseUrl = await this.getBaseUrl();
      console.log(`📁 Uploading to ${baseUrl}/generate-quiz-from-upload`);

      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${baseUrl}/generate-quiz-from-upload?num_questions=${numQuestions}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Generated ${data.quiz_data?.questions?.length || 0} questions from file`);
      return data;
    } catch (error) {
      console.error('❌ File upload error:', error);
      this.currentBaseUrl = null;
      throw error;
    }
  }

  static async testConnection() {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await fetch(`${baseUrl}/health`);
      return response.ok;
    } catch (error) {
      this.currentBaseUrl = null;
      return false;
    }
  }

  static async chatWithAI(message, userId, conversationId = null) {
    try {
      const baseUrl = await this.getBaseUrl();
      console.log(`💬 Sending chat message to ${baseUrl}/chat`);
      
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: userId,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI chat failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ AI Response received:", data);
      return data;
      
    } catch (error) {
      console.error('Error chatting with AI:', error);
      this.currentBaseUrl = null;
      
      // Return a fallback response if backend is not available
      if (error.message.includes('Failed to fetch') || error.message.includes('Cannot connect')) {
        return {
          response: "I'm currently having trouble connecting to the server, but I'm still here to help! You can continue working on your notes, and I'll assist as much as possible.",
          conversation_id: conversationId || 'local-fallback',
          success: true
        };
      }
      
      throw error;
    }
  }

  static async exportQuiz(questions, format = 'txt') {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await fetch(`${baseUrl}/export-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: questions,
          format: format
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lexora_quiz_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Export error:', error);
      this.currentBaseUrl = null;
      throw error;
    }
  }

  static async testGenerator() {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await fetch(`${baseUrl}/test-generator`);
      const data = await response.json();
      console.log("🧪 Generator test result:", data);
      return data;
    } catch (error) {
      console.error('❌ Generator test failed:', error);
      this.currentBaseUrl = null;
      throw error;
    }
  }

  static async testAIConnection() {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "test",
          user_id: "test_user",
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('AI connection test failed:', error);
      return false;
    }
  }
}

export default QuizApiService;