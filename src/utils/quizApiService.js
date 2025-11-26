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

  static async generateQuizWithFallback(content, options = {}) {
    try {
      return await this.generateQuizFromText(content, options);
    } catch (error) {
      console.log("AI generation failed, using template fallback:", error);
      return await this.generateTemplateQuiz(content, options);
    }
  }

  static async generateTemplateQuiz(content, options = {}) {
    const concepts = this.extractKeyConcepts(content);
    const numQuestions = options.numQuestions || 10;
    
    const templateQuiz = {
      quiz_data: {
        title: `Quiz: ${options.subject || 'Generated Quiz'}`,
        questions: this.createTemplateQuestions(concepts, numQuestions),
        metadata: {
          generated_by: 'template_fallback',
          source: 'content_based',
          concept_count: concepts.length
        }
      }
    };
    
    console.log(`✅ Generated ${templateQuiz.quiz_data.questions.length} template questions`);
    return templateQuiz;
  }

  static extractKeyConcepts(content) {
    // Simple concept extraction - you can enhance this
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = content.toLowerCase().split(/\s+/);
    
    // Filter for potential key terms (longer words, capitalized phrases)
    const keyTerms = words.filter(word => 
      word.length > 5 && 
      !['the', 'and', 'for', 'with', 'this', 'that'].includes(word)
    ).slice(0, 15);
    
    return {
      sentences: sentences.slice(0, 10),
      keyTerms: [...new Set(keyTerms)].slice(0, 10)
    };
  }

  static createTemplateQuestions(concepts, numQuestions) {
    const questions = [];
    const questionTypes = ['multiple_choice', 'true_false', 'short_answer'];
    
    for (let i = 0; i < numQuestions; i++) {
      const type = questionTypes[i % questionTypes.length];
      const question = this.createQuestionByType(type, concepts, i);
      questions.push(question);
    }
    
    return questions;
  }

  static createQuestionByType(type, concepts, index) {
    const baseQuestion = {
      id: `template_${Date.now()}_${index}`,
      question: '',
      type: type,
      points: 1
    };

    switch (type) {
      case 'multiple_choice':
        return {
          ...baseQuestion,
          question: `What is the main concept related to "${concepts.keyTerms[index % concepts.keyTerms.length]}"?`,
          options: [
            "Primary definition",
            "Secondary aspect", 
            "Related concept",
            "Opposite meaning"
          ],
          correct_answer: "Primary definition",
          explanation: "This represents the core understanding of the concept."
        };
        
      case 'true_false':
        return {
          ...baseQuestion,
          question: `"${concepts.sentences[index % concepts.sentences.length]}" - Is this statement accurate?`,
          options: ["True", "False"],
          correct_answer: "True",
          explanation: "This statement appears to be factually correct based on the content."
        };
        
      case 'short_answer':
        return {
          ...baseQuestion,
          question: `Explain the significance of "${concepts.keyTerms[index % concepts.keyTerms.length]}" in your own words.`,
          correct_answer: "Student should provide a reasonable explanation based on the content.",
          explanation: "This tests understanding of key concepts from the material."
        };
        
      default:
        return baseQuestion;
    }
  }

  // Export quiz results to PDF
  static async exportQuizToPDF(quizData, results = null) {
    try {
      const baseUrl = await this.getBaseUrl();
      console.log(`📄 Exporting to PDF via ${baseUrl}/export/pdf`);
      
      const response = await fetch(`${baseUrl}/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_data: quizData,
          results: results,
          export_format: 'pdf'
        })
      });

      if (!response.ok) {
        throw new Error(`PDF export failed: ${response.statusText}`);
      }

      // Handle the PDF blob response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ PDF export completed successfully');
      return true;
    } catch (error) {
      console.error('❌ PDF export error:', error);
      // Fallback to client-side export
      console.log('🔄 Attempting client-side export as fallback...');
      return await this.exportQuizClientSide(quizData, results, 'txt');
    }
  }

  // Export quiz results to CSV
  static async exportQuizToCSV(quizData, results = null) {
    try {
      const baseUrl = await this.getBaseUrl();
      console.log(`📊 Exporting to CSV via ${baseUrl}/export/csv`);
      
      const response = await fetch(`${baseUrl}/export/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_data: quizData,
          results: results,
          export_format: 'csv'
        })
      });

      if (!response.ok) {
        throw new Error(`CSV export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ CSV export completed successfully');
      return true;
    } catch (error) {
      console.error('❌ CSV export error:', error);
      // Fallback to client-side export
      console.log('🔄 Attempting client-side CSV export...');
      return await this.exportQuizClientSide(quizData, results, 'csv');
    }
  }

  // Client-side export as fallback
  static async exportQuizClientSide(quizData, results = null, format = 'csv') {
    return new Promise((resolve, reject) => {
      try {
        let content = '';
        let filename = '';
        let mimeType = '';

        if (format === 'csv') {
          content = this.generateCSV(quizData, results);
          filename = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
        } else if (format === 'json') {
          content = this.generateJSON(quizData, results);
          filename = `quiz-results-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
        } else if (format === 'txt') {
          content = this.generateText(quizData, results);
          filename = `quiz-results-${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
        } else {
          throw new Error(`Unsupported format: ${format}`);
        }

        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log(`✅ Client-side ${format.toUpperCase()} export completed`);
        resolve(true);
      } catch (error) {
        console.error(`❌ Client-side ${format.toUpperCase()} export failed:`, error);
        reject(error);
      }
    });
  }

  // Generate CSV content
  static generateCSV(quizData, results) {
    const questions = quizData.questions || quizData.quiz_data?.questions || [];
    let csv = 'Question,Your Answer,Correct Answer,Result,Explanation\n';

    questions.forEach((q, index) => {
      const userAnswer = results?.answers?.[index] || results?.textAnswers?.[index] || 'Not answered';
      const correctAnswer = q.correct_answer || 'Not provided';
      const isCorrect = userAnswer.toString().toLowerCase() === correctAnswer.toString().toLowerCase();
      const result = isCorrect ? 'Correct' : 'Incorrect';
      const explanation = q.explanation || 'No explanation provided';
      
      // Escape CSV special characters
      const escapeCSV = (str) => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      csv += `${escapeCSV(q.question)},${escapeCSV(userAnswer)},${escapeCSV(correctAnswer)},${result},${escapeCSV(explanation)}\n`;
    });

    // Add summary
    if (results?.score) {
      csv += `\nSummary\n`;
      csv += `Total Questions,${questions.length}\n`;
      csv += `Score,${results.score}%\n`;
      csv += `Correct Answers,${Math.round((results.score / 100) * questions.length)}\n`;
      csv += `Date,${new Date().toLocaleDateString()}\n`;
    }

    return csv;
  }

  // Generate JSON content
  static generateJSON(quizData, results) {
    const exportData = {
      quizTitle: quizData.quizTitle || 'Quiz Results',
      source: quizData.sourceName || 'Unknown',
      date: new Date().toISOString(),
      score: results?.score || 0,
      totalQuestions: quizData.questions?.length || quizData.quiz_data?.questions?.length || 0,
      questions: (quizData.questions || quizData.quiz_data?.questions || []).map((q, index) => ({
        question: q.question,
        type: q.type,
        userAnswer: results?.answers?.[index] || results?.textAnswers?.[index] || 'Not answered',
        correctAnswer: q.correct_answer || 'Not provided',
        isCorrect: (results?.answers?.[index] || results?.textAnswers?.[index] || '').toString().toLowerCase() === (q.correct_answer || '').toString().toLowerCase(),
        explanation: q.explanation || 'No explanation provided',
        options: q.options || []
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Generate text content
  static generateText(quizData, results) {
    const questions = quizData.questions || quizData.quiz_data?.questions || [];
    let text = 'QUIZ RESULTS\n';
    text += '='.repeat(50) + '\n\n';
    
    if (results?.score) {
      text += `Score: ${results.score}%\n`;
      text += `Correct: ${Math.round((results.score / 100) * questions.length)}/${questions.length}\n`;
    }
    
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `Source: ${quizData.sourceName || 'Unknown'}\n\n`;
    text += 'QUESTIONS AND ANSWERS\n';
    text += '-'.repeat(50) + '\n\n';

    questions.forEach((q, index) => {
      const userAnswer = results?.answers?.[index] || results?.textAnswers?.[index] || 'Not answered';
      const correctAnswer = q.correct_answer || 'Not provided';
      const isCorrect = userAnswer.toString().toLowerCase() === correctAnswer.toString().toLowerCase();
      
      text += `Question ${index + 1} (${q.type || 'multiple_choice'}):\n`;
      text += `${q.question}\n\n`;
      text += `Your Answer: ${userAnswer}\n`;
      text += `Correct Answer: ${correctAnswer}\n`;
      text += `Result: ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}\n`;
      
      if (q.explanation && q.explanation !== 'No explanation provided') {
        text += `Explanation: ${q.explanation}\n`;
      }
      
      if (q.options && q.options.length > 0) {
        text += `Options:\n`;
        q.options.forEach((option, optIndex) => {
          text += `  ${String.fromCharCode(65 + optIndex)}. ${option}\n`;
        });
      }
      
      text += '\n' + '-'.repeat(50) + '\n\n';
    });

    return text;
  }
}

export default QuizApiService;