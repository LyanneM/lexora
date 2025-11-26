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

  const [questionFormats, setQuestionFormats] = useState({
    multiple_choice: true,
    fill_blank: true,
    true_false: true,
    open_ended: false,
    essay: false,
    structured: false
  });

  const [musicEnabled, setMusicEnabled] = useState(false);
  const [audio, setAudio] = useState(null);

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

  // Helper method for format descriptions
  const getFormatDescription = (format) => {
    const descriptions = {
      multiple_choice: 'Choose from several options',
      fill_blank: 'Type the missing word or phrase',
      true_false: 'Determine if statement is true or false',
      open_ended: 'Write short answers (1-2 sentences)',
      essay: 'Write detailed paragraph responses',
      structured: 'Step-by-step problem solving'
    };
    return descriptions[format] || 'Question format';
  };

  // Filter questions based on selected formats
  const getAvailableQuestions = () => {
    const questions = quizData?.quiz_data?.questions || quizData?.questions || [];
    
    console.log("🔍 Available questions:", questions);
    console.log("📊 Total questions found:", questions.length);
    
    if (!questions || questions.length === 0) {
      console.warn("⚠️ No questions found in quiz data");
      return [];
    }
    
    const filtered = questions.filter(question => {
      if (!question || !question.type) return true;
      
      // Map question types to our format categories
      const typeMapping = {
        'multiple_choice': 'multiple_choice',
        'multiple_choice_question': 'multiple_choice',
        'fill_blank': 'fill_blank',
        'fill_in_blank': 'fill_blank',
        'fill-in-the-blank': 'fill_blank',
        'true_false': 'true_false',
        'true_false_question': 'true_false',
        'open_ended': 'open_ended',
        'open_ended_question': 'open_ended',
        'essay': 'essay',
        'structured': 'structured'
      };
      
      const questionFormat = typeMapping[question.type] || question.type;
      return questionFormats[questionFormat];
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

  const startQuiz = () => {
    if (!selectedMode) {
      alert('Please select a quiz mode');
      return;
    }

    const selectedFormats = Object.values(questionFormats).filter(Boolean);
    if (selectedFormats.length === 0) {
      alert('Please select at least one question format');
      return;
    }

    if (actualQuestionCount === 0) {
      alert('No questions available with the selected formats. Please adjust your question format selection.');
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
        questionFormats,
        questionCount: actualQuestionCount
      }
    });
  };

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

  const maxQuestions = Math.min(maxAvailableQuestions, 20);

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
              ({maxAvailableQuestions} questions available with selected formats)
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

          {/* Question Formats Selection - Consolidated */}
          <div className="config-card">
            <h3>🎯 Question Formats</h3>
            <div className="format-selection">
              <div className="format-option">
                <label className="format-checkbox">
                  <input
                    type="checkbox"
                    checked={questionFormats.multiple_choice}
                    onChange={() => setQuestionFormats(prev => ({
                      ...prev,
                      multiple_choice: !prev.multiple_choice
                    }))}
                  />
                  <span className="checkmark"></span>
                  <div className="format-info">
                    <span className="format-name">Multiple Choice</span>
                    <span className="format-desc">Choose from several options</span>
                  </div>
                </label>
              </div>

              <div className="format-option">
                <label className="format-checkbox">
                  <input
                    type="checkbox"
                    checked={questionFormats.fill_blank}
                    onChange={() => setQuestionFormats(prev => ({
                      ...prev,
                      fill_blank: !prev.fill_blank
                    }))}
                  />
                  <span className="checkmark"></span>
                  <div className="format-info">
                    <span className="format-name">Fill in the Blank</span>
                    <span className="format-desc">Type the missing word or phrase</span>
                  </div>
                </label>
              </div>

              <div className="format-option">
                <label className="format-checkbox">
                  <input
                    type="checkbox"
                    checked={questionFormats.true_false}
                    onChange={() => setQuestionFormats(prev => ({
                      ...prev,
                      true_false: !prev.true_false
                    }))}
                  />
                  <span className="checkmark"></span>
                  <div className="format-info">
                    <span className="format-name">True/False</span>
                    <span className="format-desc">Determine if statement is true or false</span>
                  </div>
                </label>
              </div>

              <div className="format-option">
                <label className="format-checkbox">
                  <input
                    type="checkbox"
                    checked={questionFormats.open_ended}
                    onChange={() => setQuestionFormats(prev => ({
                      ...prev,
                      open_ended: !prev.open_ended
                    }))}
                  />
                  <span className="checkmark"></span>
                  <div className="format-info">
                    <span className="format-name">Open Ended</span>
                    <span className="format-desc">Write short answers (1-2 sentences)</span>
                  </div>
                </label>
              </div>

              <div className="format-option">
                <label className="format-checkbox">
                  <input
                    type="checkbox"
                    checked={questionFormats.essay}
                    onChange={() => setQuestionFormats(prev => ({
                      ...prev,
                      essay: !prev.essay
                    }))}
                  />
                  <span className="checkmark"></span>
                  <div className="format-info">
                    <span className="format-name">Essay</span>
                    <span className="format-desc">Write detailed paragraph responses</span>
                  </div>
                </label>
              </div>

              <div className="format-option">
                <label className="format-checkbox">
                  <input
                    type="checkbox"
                    checked={questionFormats.structured}
                    onChange={() => setQuestionFormats(prev => ({
                      ...prev,
                      structured: !prev.structured
                    }))}
                  />
                  <span className="checkmark"></span>
                  <div className="format-info">
                    <span className="format-name">Structured</span>
                    <span className="format-desc">Step-by-step problem solving</span>
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
                  {q.type === 'essay' && '📄 Essay'}
                  {q.type === 'structured' && '🔍 Structured'}
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
                    <div className="preview-option">Write short answer...</div>
                  </div>
                )}
                {q.type === 'essay' && (
                  <div className="preview-options">
                    <div className="preview-option">Write detailed essay...</div>
                  </div>
                )}
                {q.type === 'structured' && (
                  <div className="preview-options">
                    <div className="preview-option">Step-by-step solution...</div>
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
              ? `📖 Start Exam (${actualQuestionCount} questions, ${Math.ceil(calculateTimeLimit() / 60)} min)` 
              : `😎 Start Quiz (${actualQuestionCount} questions)`
            }
          </button>
          
          {actualQuestionCount === 0 && (
            <p className="warning">No questions available with the current filters implemented. Please adjust question formats or try again later.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default QuizMode;