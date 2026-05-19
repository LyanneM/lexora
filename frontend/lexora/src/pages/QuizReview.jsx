// src/pages/QuizReview.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quizzesService } from '../services/firebaseService';
import '../styles/quiz-review.css';

function QuizReview() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await quizzesService.getQuizResult(quizId);
        if (quizData && quizData.userId === currentUser.uid) {
          setQuiz(quizData);
        } else {
          setError('Quiz not found or access denied');
        }
      } catch (err) {
        setError('Failed to load quiz');
        console.error('Error loading quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && quizId) {
      loadQuiz();
    }
  }, [quizId, currentUser]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="quiz-review-container">
        <div className="loading">Loading quiz results...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="quiz-review-container error">
        <h2>Error</h2>
        <p>{error || 'Quiz not found'}</p>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-review-container">
      <div className="review-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>Quiz Review</h1>
        <div className="quiz-meta">
          <p><strong>Source:</strong> {quiz.sourceName}</p>
          <p><strong>Mode:</strong> {quiz.mode}</p>
          <p><strong>Completed:</strong> {formatDate(quiz.completedAt)}</p>
          {quiz.timeSpent && <p><strong>Time Spent:</strong> {formatTime(quiz.timeSpent)}</p>}
        </div>
      </div>

      <div className="score-summary">
        <div className="score-circle">
          <span className="score-percent">{quiz.score}%</span>
          <span className="score-text">Score</span>
        </div>
        <div className="score-details">
          <p><strong>Correct:</strong> {quiz.correctAnswers} / {quiz.totalQuestions}</p>
          <p><strong>Performance:</strong> 
            <span className={`performance ${quiz.score >= 80 ? 'excellent' : quiz.score >= 60 ? 'good' : 'needs-improvement'}`}>
              {quiz.score >= 80 ? 'Excellent' : quiz.score >= 60 ? 'Good' : 'Needs Improvement'}
            </span>
          </p>
        </div>
      </div>

      <div className="questions-review">
        <h2>Question Breakdown</h2>
        {quiz.questions.map((q, index) => (
          <div key={index} className={`question-review ${q.isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="question-header">
              <span className="question-number">Q{index + 1}</span>
              <span className="question-type">{q.type}</span>
              <span className={`result-badge ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            </div>
            
            <div className="question-text">
              <strong>Question:</strong> {q.question}
            </div>

            <div className="answer-comparison">
              <div className="answer-section">
                <strong>Your Answer:</strong>
                <div className={`user-answer ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                  {q.userAnswer || 'Not answered'}
                </div>
              </div>

              {!q.isCorrect && (
                <div className="answer-section">
                  <strong>Correct Answer:</strong>
                  <div className="correct-answer">
                    {q.correctAnswer}
                  </div>
                </div>
              )}
            </div>

            {q.explanation && q.explanation !== 'No explanation provided' && (
              <div className="explanation">
                <strong>Explanation:</strong>
                <p>{q.explanation}</p>
              </div>
            )}

            {q.options && q.options.length > 0 && (
              <div className="options-review">
                <strong>Options:</strong>
                <div className="options-list">
                  {q.options.map((option, optIndex) => (
                    <div 
                      key={optIndex} 
                      className={`option ${option === q.correctAnswer ? 'correct-option' : ''} ${option === q.userAnswer && !q.isCorrect ? 'user-incorrect-option' : ''}`}
                    >
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="review-actions">
        <button 
          onClick={() => navigate('/quiz')} 
          className="action-btn primary"
        >
          🎯 Take New Quiz
        </button>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="action-btn secondary"
        >
          📊 Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default QuizReview;