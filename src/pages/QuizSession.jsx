// frontend/src/pages/QuizSession.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { QuizApiService } from '../utils/quizApiService';
import '../styles/quiz-session.css';

function QuizSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { quizData, mode, timeLimit, sourceName, questionTypes } = location.state || {};
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter questions based on selected types
  const filteredQuestions = React.useMemo(() => {
    if (!quizData?.questions) return [];
    
    let questions = quizData.questions;
    
    if (questionTypes) {
      questions = questions.filter(question => {
        if (!question?.type) return questionTypes.multipleChoice;
        
        switch(question.type) {
          case 'multiple_choice':
            return questionTypes.multipleChoice;
          case 'fill_blank':
            return questionTypes.fillInBlank;
          case 'true_false':
            return questionTypes.trueFalse;
          case 'open_ended':
            return questionTypes.openEnded;
          default:
            return true;
        }
      });
    }
    
    return questions.filter(q => q && q.question);
  }, [quizData?.questions, questionTypes]);

  const currentQuestion = filteredQuestions?.[currentQuestionIndex];
  const totalQuestions = filteredQuestions?.length || 0;
  const answeredQuestions = Object.keys(answers).length + Object.keys(textAnswers).length;

  // Timer effect for exam mode
  useEffect(() => {
    if (!quizStarted || mode !== 'exam' || !timeLeft || quizCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizCompleted, mode]);

  // Tab switch detection for exam mode
  useEffect(() => {
    if (mode !== 'exam' || !quizStarted || quizCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        if (tabSwitchCount >= 2) {
          alert('⚠️ Warning: Multiple tab switches detected. This may result in quiz termination.');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [mode, quizStarted, quizCompleted, tabSwitchCount]);

  // Fullscreen handling for exam mode
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const handleTextAnswerChange = (questionIndex, answer) => {
    setTextAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleAutoSubmit = async () => {
    setQuizCompleted(true);
    await saveQuizResults();
  };

  const handleSubmitQuiz = async () => {
    setQuizCompleted(true);
    await saveQuizResults();
    setShowResults(true);
  };

  const saveQuizResults = async () => {
    try {
      const score = calculateScore();
      const quizResult = {
        userId: currentUser.uid,
        quizTitle: `Quiz - ${quizData?.subject || 'Unknown Subject'}`,
        sourceName,
        mode,
        questions: filteredQuestions.map((q, index) => ({
          question: q?.question || 'No question text',
          userAnswer: answers[index] || textAnswers[index] || 'Not answered',
          correctAnswer: q?.correct_answer || 'No correct answer provided',
          options: q?.options || [],
          explanation: q?.explanation || 'No explanation provided',
          type: q?.type || 'multiple_choice'
        })),
        score,
        totalQuestions,
        timeSpent: mode === 'exam' ? timeLimit - timeLeft : null,
        tabSwitches: mode === 'exam' ? tabSwitchCount : null,
        completedAt: new Date(),
        generatedAt: quizData?.generated_at || new Date()
      };

      // Save to Firestore
      await addDoc(collection(db, 'quizResults'), quizResult);

      // Update user statistics
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        totalQuizzes: arrayUnion(quizResult),
        lastQuizDate: new Date()
      });

    } catch (error) {
      console.error('Error saving quiz results:', error);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    filteredQuestions.forEach((question, index) => {
      const userAnswer = answers[index] || textAnswers[index];
      if (userAnswer && question?.correct_answer && 
          userAnswer.toString().toLowerCase() === question.correct_answer.toString().toLowerCase()) {
        correct++;
      }
    });
    return totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  };

  const formatTime = (seconds) => {
    if (!seconds) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startQuiz = () => {
    setQuizStarted(true);
    if (mode === 'exam') {
      enterFullscreen();
    }
  };

  const exportQuiz = async () => {
    try {
      await QuizApiService.exportQuiz(filteredQuestions);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    switch(currentQuestion.type) {
      case 'fill_blank':
        return (
          <div className="question-content fill-blank">
            <div className="answer-instruction">
              <p>📝 Type your answer in the box below:</p>
            </div>
            <textarea
              value={textAnswers[currentQuestionIndex] || ''}
              onChange={(e) => handleTextAnswerChange(currentQuestionIndex, e.target.value)}
              placeholder="Enter your answer here..."
              className="text-answer-input"
              rows="4"
            />
          </div>
        );

      case 'true_false':
        return (
          <div className="question-content true-false">
            <div className="options-grid">
              {['True', 'False'].map((option) => (
                <button
                  key={option}
                  className={`true-false-option ${answers[currentQuestionIndex] === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
                >
                  <span className="option-symbol">
                    {option === 'True' ? '✓' : '✗'}
                  </span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'open_ended':
        return (
          <div className="question-content open-ended">
            <div className="answer-instruction">
              <p>📝 Write a detailed answer in the box below:</p>
            </div>
            <textarea
              value={textAnswers[currentQuestionIndex] || ''}
              onChange={(e) => handleTextAnswerChange(currentQuestionIndex, e.target.value)}
              placeholder="Type your detailed answer here... (Minimum 50 characters recommended)"
              className="open-ended-input"
              rows="8"
            />
            <div className="answer-guidance">
              <p>💡 <strong>Your answer should include:</strong></p>
              <ul>
                <li>Clear definition of the concept</li>
                <li>Key characteristics and features</li>
                <li>Practical applications or examples</li>
                <li>Relevance to the subject matter</li>
              </ul>
            </div>
          </div>
        );

      default: // multiple_choice
        return (
          <div className="question-content multiple-choice">
            <div className="options-list">
              {currentQuestion.options && currentQuestion.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className={`option-card ${answers[currentQuestionIndex] === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
                >
                  <div className="option-letter">
                    {String.fromCharCode(65 + optionIndex)}
                  </div>
                  <div className="option-text">
                    {option}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };


const [musicEnabled, setMusicEnabled] = useState(false);
const [audio, setAudio] = useState(null);

useEffect(() => {
  const backgroundAudio = new Audio('/music/quiz-session.mp3'); 
  backgroundAudio.loop = true;
  backgroundAudio.volume = 0.2;
  setAudio(backgroundAudio);

  return () => {
    if (backgroundAudio) {
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
    }
  };
}, []);

useEffect(() => {
  if (audio) {
    if (musicEnabled && quizStarted) {
      audio.play().catch(error => {
        console.log('Audio play failed:', error);
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }
}, [musicEnabled, quizStarted, audio]);

const toggleMusic = () => {
  setMusicEnabled(!musicEnabled);
};


const FloatingParticles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: Math.random() * 20 + 10,
      left: Math.random() * 100,
      animationDelay: Math.random() * 8,
      duration: Math.random() * 4 + 4
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="floating-particles">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}
    </div>
  );
};

//music toggle button JSX
<>
  <FloatingParticles />
  <div className="music-control">
    <button 
      className="music-toggle"
      onClick={toggleMusic}
      title={musicEnabled ? "Turn music off" : "Turn music on"}
    >
      {musicEnabled ? "🔊" : "🔇"}
    </button>
  </div>

</>

  const getQuestionTypeBadge = () => {
    if (!currentQuestion?.type) return null;

    const typeConfig = {
      'multiple_choice': { text: 'Multiple Choice', emoji: '🔘' },
      'fill_blank': { text: 'Fill in Blank', emoji: '📝' },
      'true_false': { text: 'True/False', emoji: '✅' },
      'open_ended': { text: 'Open Ended', emoji: '📝' }
    };

    const config = typeConfig[currentQuestion.type] || typeConfig.multiple_choice;
    return (
      <div className="question-type-badge">
        {config.emoji} {config.text}
      </div>
    );
  };

  // Error boundary for missing quiz data
  if (!quizData || !filteredQuestions || filteredQuestions.length === 0) {
    return (
      <div className="quiz-session-container error">
        <h2>No quiz data available</h2>
        <p>Unable to load quiz questions. Please try generating a new quiz.</p>
        <button onClick={() => navigate('/quiz')} className="back-btn">
          ← Back to Quiz Generator
        </button>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="quiz-session-container pre-start">
        <div className="quiz-start-screen">
          <h1>Quiz Ready! 🎊</h1>
          <div className="quiz-info-card">
            <h2>{quizData?.subject || 'General'} Quiz</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Mode:</span>
                <span className="value">{mode === 'exam' ? '⏰ Exam Mode' : '🛏️ Relaxed Mode'}</span>
              </div>
              <div className="info-item">
                <span className="label">Questions:</span>
                <span className="value">{totalQuestions}</span>
              </div>
              {mode === 'exam' && (
                <div className="info-item">
                  <span className="label">Time Limit:</span>
                  <span className="value">{formatTime(timeLimit)}</span>
                </div>
              )}
              <div className="info-item">
                <span className="label">Source:</span>
                <span className="value">{sourceName || 'Unknown'}</span>
              </div>
            </div>

            {mode === 'exam' && (
              <div className="exam-warnings">
                <h3>📋 Exam Rules:</h3>
                <ul>
                  <li>⏰ Timer will start immediately</li>
                  <li>🚫 Do not switch tabs or applications</li>
                  <li>📵 Fullscreen mode will be activated</li>
                  <li>✅ Quiz auto-submits when time ends</li>
                  <li>⚠️ Multiple tab switches may terminate quiz</li>
                </ul>
              </div>
            )}

            {mode === 'relaxed' && (
              <div className="relaxed-info">
                <h3>😌 Relaxed Mode:</h3>
                <ul>
                  <li>🕐 No time pressure</li>
                  <li>💾 Progress is saved automatically</li>
                  <li>📖 You can review answers later</li>
                  <li>↩️ Feel free to take breaks</li>
                </ul>
              </div>
            )}
          </div>

          <button onClick={startQuiz} className="start-quiz-btn large">
            {mode === 'exam' ? '🚀 Start Exam' : '😃 Start Quiz'}
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const correctCount = Object.keys(answers).filter(idx => 
      answers[idx] === filteredQuestions[idx]?.correct_answer
    ).length + Object.keys(textAnswers).filter(idx => 
      textAnswers[idx]?.toLowerCase() === filteredQuestions[idx]?.correct_answer?.toLowerCase()
    ).length;

    return (
      <div className="quiz-session-container results">
        <div className="results-screen">
          <h1>Quiz Complete! 🎉</h1>
          <div className="score-card">
            <div className="score-circle">
              <span className="score-percent">{score}%</span>
              <span className="score-text">Score</span>
            </div>
            <div className="score-details">
              <p><strong>Correct Answers:</strong> {correctCount} / {totalQuestions}</p>
              <p><strong>Mode:</strong> {mode === 'exam' ? 'Exam' : 'Relaxed'}</p>
              {mode === 'exam' && <p><strong>Time Spent:</strong> {formatTime(timeLimit - timeLeft)}</p>}
              <p><strong>Completed:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="results-actions">
            <button onClick={() => navigate('/quiz')} className="action-btn primary">
              📔 Generate New Quiz
            </button>
            <button onClick={exportQuiz} className="action-btn secondary">
              📥 Export Results
            </button>
            <button onClick={() => navigate('/dashboard')} className="action-btn tertiary">
              📊 View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted && !showResults) {
    return (
      <div className="quiz-session-container completed">
        <div className="completion-screen">
          <h1>Quiz Finished! 📝</h1>
          <p>You've answered {answeredQuestions} out of {totalQuestions} questions.</p>
          <div className="completion-actions">
            <button onClick={() => setShowResults(true)} className="action-btn primary">
              📊 View Results
            </button>
            <button onClick={exportQuiz} className="action-btn secondary">
              📥 Export Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for current question
  if (!currentQuestion) {
    return (
      <div className="quiz-session-container error">
        <h2>Error loading question</h2>
        <p>Unable to load the current question. Please try navigating to another question.</p>
        <button onClick={() => setCurrentQuestionIndex(0)} className="back-btn">
          ← Back to First Question
        </button>
      </div>
    );
  }

  // Main quiz interface
  return (
    <div className="quiz-session-container active">
      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-info">
          <h2>{quizData?.subject || 'Quiz'}</h2>
          <div className="progress-info">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
        
        <div className="quiz-controls">
          {mode === 'exam' && (
            <div className={`timer ${timeLeft < 300 ? 'warning' : ''}`}>
              ⏰ {formatTime(timeLeft)}
            </div>
          )}
          {mode === 'exam' && tabSwitchCount > 0 && (
            <div className="tab-warning">
              ⚠️ Tab Switches: {tabSwitchCount}
            </div>
          )}
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="question-area">
        <div className="question-card">
          <div className="question-header">
            {getQuestionTypeBadge()}
            <div className="question-number">
              Q{currentQuestionIndex + 1}
            </div>
          </div>
          
          <h3 className="question-text">
            {currentQuestion.question || 'Question not available'}
          </h3>
          
          {renderQuestionContent()}
        </div>
      </div>

      {/* Navigation */}
      <div className="quiz-navigation">
        <button 
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="nav-btn prev"
        >
          ← Previous
        </button>
        
        <div className="question-indicators">
          {filteredQuestions.map((_, index) => (
            <button
              key={index}
              className={`indicator ${
                index === currentQuestionIndex ? 'active' : ''
              } ${(answers[index] || textAnswers[index]) ? 'answered' : ''}`}
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button 
            onClick={handleSubmitQuiz}
            className="nav-btn submit"
          >
            Submit Quiz ✅
          </button>
        ) : (
          <button 
            onClick={handleNext}
            className="nav-btn next"
          >
            Next →
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="quiz-stats">
        <span className="stat-item">
          📊 Answered: {answeredQuestions}/{totalQuestions}
        </span>
        {mode === 'exam' && (
          <span className="stat-item">
            ⏰ Time Left: {formatTime(timeLeft)}
          </span>
        )}
        <span className="stat-item">
          🎯 Mode: {mode === 'exam' ? 'Exam' : 'Relaxed'}
        </span>
      </div>
    </div>
  );
}

export default QuizSession;