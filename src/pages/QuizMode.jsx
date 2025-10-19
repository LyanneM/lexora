// frontend/src/pages/QuizMode.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/quizmode.css';

function QuizMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizData, sourceType, sourceName } = location.state || {};
  
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedTime, setSelectedTime] = useState(30);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState({
    multipleChoice: true,
    fillInBlank: true,
    trueFalse: true,
    openEnded: false
  });

 
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [audio, setAudio] = useState(null);

  // ADD DEBUGGING HERE:
  useEffect(() => {
    console.log("📥 QuizMode received data:", {
      quizData,
      sourceType, 
      sourceName
    });
    console.log("🎯 Quiz data structure:", quizData?.quiz_data);
    console.log("❓ Questions:", quizData?.quiz_data?.questions);
    console.log("🔢 Question count:", quizData?.quiz_data?.questions?.length);
  }, [quizData]);

  // Music functionality - MOVE INSIDE COMPONENT
  useEffect(() => {
    const backgroundAudio = new Audio('/music/quiz-background.mp3');
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
      if (musicEnabled) {
        audio.play().catch(error => {
          console.log('Audio play failed:', error);
        });
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, [musicEnabled, audio]);

  const toggleMusic = () => {
    setMusicEnabled(!musicEnabled);
  };

  // Handle question type changes
  const handleQuestionTypeChange = (type) => {
    setQuestionTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Filter questions based on selected types
  const getAvailableQuestions = () => {
    // Check different possible locations for questions
    const questions = quizData?.quiz_data?.questions || quizData?.questions || [];
    
    console.log("🔍 Available questions:", questions);
    console.log("📊 Total questions found:", questions.length);
    
    if (!questions || questions.length === 0) {
      console.warn("⚠️ No questions found in quiz data");
      return [];
    }
    
    const filtered = questions.filter(question => {
      if (!question || !question.type) return true;
      
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
    
    console.log("✅ Filtered questions:", filtered.length);
    return filtered;
  };

  const availableQuestions = getAvailableQuestions();
  const maxAvailableQuestions = availableQuestions.length;
  const actualQuestionCount = Math.min(questionCount, maxAvailableQuestions);

  // Calculate time limit for exam mode
  const calculateTimeLimit = () => {
    if (selectedMode === 'relaxed') {
      return null;
    }
    
    const baseTimePerQuestion = selectedTime / 10;
    const totalTime = Math.ceil(baseTimePerQuestion * actualQuestionCount);
    return totalTime * 60;
  };

  // FIXED: startQuiz function - no hooks inside!
  const startQuiz = () => {
    if (!selectedMode) {
      alert('Please select a quiz mode');
      return;
    }

    const selectedTypes = Object.values(questionTypes).filter(Boolean);
    if (selectedTypes.length === 0) {
      alert('Please select at least one question type');
      return;
    }

    if (actualQuestionCount === 0) {
      alert('No questions available with the selected types. Please adjust your question type selection.');
      return;
    }

    const timeLimit = calculateTimeLimit();

    navigate('/quiz-session', {
      state: {
        quizData: {
          ...quizData,
          questions: availableQuestions.slice(0, actualQuestionCount)
        },
        mode: selectedMode,
        timeLimit: timeLimit,
        sourceName,
        questionTypes,
        questionCount: actualQuestionCount
      }
    });
  };

  // Add floating elements component - MOVE INSIDE COMPONENT
  const FloatingElements = () => (
    <div className="floating-elements">
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>
    </div>
  );

  if (!quizData) {
    return (
      <div className="quiz-mode-container error">
        <h2>No Quiz Data Available</h2>
        <p>Unable to load quiz questions. Please go back and generate a new quiz.</p>
        <button onClick={() => navigate('/quiz')} className="back-btn">
          ← Back to Quiz Generator
        </button>
      </div>
    );
  }

  const maxQuestions = Math.min(maxAvailableQuestions, 50);

  return (
    <>
      <FloatingElements />
      <div className="music-control">
        <button 
          className="music-toggle"
          onClick={toggleMusic}
          title={musicEnabled ? "Turn music off" : "Turn music on"}
        >
          {musicEnabled ? "🔊" : "🔇"}
        </button>
      </div>
      
      <div className="quiz-mode-container">
        <div className="quiz-mode-header">
          <h1>Configure Your Quiz</h1>
          <p>AI has generated {quizData.quiz_data?.questions?.length || 0} questions from your {sourceType}</p>
          {maxAvailableQuestions < quizData.quiz_data?.questions?.length && (
            <p className="filtered-count">
              ({maxAvailableQuestions} questions available with selected types)
            </p>
          )}
        </div>

        <div className="configuration-section">
          {/* Question Count Selection */}
          <div className="config-card">
            <h3>📊 Number of Questions</h3>
            <div className="count-selection">
              <div className="count-slider">
                <input
                  type="range"
                  min="5"
                  max={maxQuestions}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="count-slider-input"
                />
                <div className="count-labels">
                  <span>5</span>
                  <span className="count-display">{actualQuestionCount} questions</span>
                  <span>{maxQuestions}</span>
                </div>
              </div>
              <div className="count-presets">
                {[5, 10, 15, 20, 25, 30].filter(count => count <= maxQuestions).map(count => (
                  <button
                    key={count}
                    className={`count-preset ${questionCount === count ? 'active' : ''}`}
                    onClick={() => setQuestionCount(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question Type Selection */}
          <div className="config-card">
            <h3>🎯 Question Types</h3>
            <div className="type-selection">
              <div className="type-option">
                <label className="type-checkbox">
                  <input
                    type="checkbox"
                    checked={questionTypes.multipleChoice}
                    onChange={() => handleQuestionTypeChange('multipleChoice')}
                  />
                  <span className="checkmark"></span>
                  <div className="type-info">
                    <span className="type-name">Multiple Choice</span>
                    <span className="type-desc">
                      Choose from several options
                    </span>
                  </div>
                </label>
              </div>

              <div className="type-option">
                <label className="type-checkbox">
                  <input
                    type="checkbox"
                    checked={questionTypes.fillInBlank}
                    onChange={() => handleQuestionTypeChange('fillInBlank')}
                  />
                  <span className="checkmark"></span>
                  <div className="type-info">
                    <span className="type-name">Fill in the Blank</span>
                    <span className="type-desc">
                      Type the missing word or phrase
                    </span>
                  </div>
                </label>
              </div>

              <div className="type-option">
                <label className="type-checkbox">
                  <input
                    type="checkbox"
                    checked={questionTypes.trueFalse}
                    onChange={() => handleQuestionTypeChange('trueFalse')}
                  />
                  <span className="checkmark"></span>
                  <div className="type-info">
                    <span className="type-name">True/False</span>
                    <span className="type-desc">
                      Determine if statement is true or false
                    </span>
                  </div>
                </label>
              </div>

              <div className="type-option">
                <label className="type-checkbox">
                  <input
                    type="checkbox"
                    checked={questionTypes.openEnded}
                    onChange={() => handleQuestionTypeChange('openEnded')}
                  />
                  <span className="checkmark"></span>
                  <div className="type-info">
                    <span className="type-name">Open Ended</span>
                    <span className="type-desc">
                      Write detailed answers
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="config-card">
            <h3>⚡ Quiz Mode</h3>
            <div className="mode-selection">
              <div 
                className={`mode-option ${selectedMode === 'exam' ? 'selected' : ''}`}
                onClick={() => setSelectedMode('exam')}
              >
                <div className="mode-icon">⏰</div>
                <div className="mode-content">
                  <h4>Exam Mode</h4>
                  <p>Timed environment with restrictions</p>
                  <ul>
                    <li>⏱️ Dynamic timer based on question count</li>
                    <li>🚫 Tab switching detection</li>
                    <li>📊 Instant scoring</li>
                    <li>🎯 Focused environment</li>
                  </ul>
                  
                  {selectedMode === 'exam' && (
                    <div className="time-selection">
                      <h5>Time per 10 questions:</h5>
                      <div className="time-options">
                        {[15, 30, 45, 60, 90, 120].map(time => (
                          <button
                            key={time}
                            className={`time-option ${selectedTime === time ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTime(time);
                            }}
                          >
                            {time} min
                          </button>
                        ))}
                      </div>
                      <div className="time-summary">
                        <p>Total time: <strong>{Math.ceil(calculateTimeLimit() / 60)} minutes</strong></p>
                        <small>({Math.ceil(calculateTimeLimit() / actualQuestionCount)} seconds per question)</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div 
                className={`mode-option ${selectedMode === 'relaxed' ? 'selected' : ''}`}
                onClick={() => setSelectedMode('relaxed')}
              >
                <div className="mode-icon">😌</div>
                <div className="mode-content">
                  <h4>Relaxed Mode</h4>
                  <p>Take your time, no pressure</p>
                  <ul>
                    <li>🕐 No time limit</li>
                    <li>💾 Progress saved automatically</li>
                    <li>📖 Review answers anytime</li>
                    <li>↩️ Feel free to take breaks</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Preview */}
        <div className="quiz-preview">
          <h3>Quiz Preview ({actualQuestionCount} questions)</h3>
          <div className="preview-questions">
            {availableQuestions.slice(0, 3).map((q, index) => (
              <div key={index} className="preview-question">
                <div className="question-type-badge">
                  {q.type === 'multiple_choice' && '🔘 Multiple Choice'}
                  {q.type === 'fill_blank' && '📝 Fill in Blank'}
                  {q.type === 'true_false' && '✅ True/False'}
                  {q.type === 'open_ended' && '📝 Open Ended'}
                </div>
                <h4>Q{index + 1}: {q.question}</h4>
                {q.type === 'multiple_choice' && q.options && (
                  <div className="preview-options">
                    {q.options.slice(0, 4).map((opt, optIndex) => (
                      <div key={optIndex} className="preview-option">
                        {String.fromCharCode(65 + optIndex)}. {opt}
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'true_false' && (
                  <div className="preview-options">
                    <div className="preview-option">True / False</div>
                  </div>
                )}
                {q.type === 'fill_blank' && (
                  <div className="preview-options">
                    <div className="preview-option">Type your answer...</div>
                  </div>
                )}
                {q.type === 'open_ended' && (
                  <div className="preview-options">
                    <div className="preview-option">Write detailed answer...</div>
                  </div>
                )}
              </div>
            ))}
            {actualQuestionCount > 3 && (
              <p className="more-questions">... and {actualQuestionCount - 3} more questions</p>
            )}
          </div>
        </div>

        {/* Start Button */}
        <div className="start-section">
          <button 
            onClick={startQuiz}
            disabled={!selectedMode || actualQuestionCount === 0}
            className="start-quiz-btn"
          >
            {selectedMode === 'exam' 
              ? `🚀 Start Exam (${actualQuestionCount} questions, ${Math.ceil(calculateTimeLimit() / 60)} min)` 
              : `😌 Start Quiz (${actualQuestionCount} questions)`
            }
          </button>
          
          {actualQuestionCount === 0 && (
            <p className="warning">No questions available with current filters. Please adjust question types.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default QuizMode;