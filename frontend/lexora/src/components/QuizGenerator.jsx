// src/components/QuizGenerator.jsx
import { useState } from 'react';
import { quizApiService } from '../utils/quizApiService';

function QuizGenerator({ noteContent = '' }) {
  const [content, setContent] = useState(noteContent);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateQuiz = async () => {
    if (!content.trim()) {
      setError('Please enter some educational content');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const quizData = await quizApiService.generateQuiz(content, 5, 'multiple_choice');
      setQuiz(quizData);
    } catch (err) {
      setError('Failed to generate quiz. Please try again.');
      console.error('Generation error:', err);
    }
    
    setLoading(false);
  };

  return (
    <div className="quiz-generator">
      <h3>Generate Quiz from Content</h3>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste educational content or notes here..."
        rows={8}
        className="content-textarea"
      />
      
      <div className="generator-controls">
        <button 
          onClick={generateQuiz} 
          disabled={loading || !content.trim()}
          className="generate-btn"
        >
          {loading ? 'Generating Quiz...' : 'Generate Quiz'}
        </button>
        
        {error && <div className="error-message">{error}</div>}
      </div>
      
      {quiz && (
        <div className="generated-quiz">
          <h4>{quiz.quiz_title} - {quiz.total_questions} Questions</h4>
          
          {quiz.questions.map((question, index) => (
            <div key={index} className="quiz-question">
              <h5>Q{index + 1}: {question.question}</h5>
              
              {question.options && (
                <div className="options-list">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="option">
                      <label>
                        <input 
                          type="radio" 
                          name={`question-${index}`} 
                          value={option}
                        />
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="answer-section">
                <strong>Answer:</strong> {question.correct_answer}
                {question.explanation && (
                  <div className="explanation">{question.explanation}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuizGenerator;