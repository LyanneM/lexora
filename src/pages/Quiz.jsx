// frontend/src/pages/Quiz.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { QuizApiService } from '../utils/quizApiService';
import '../styles/quiz.css';

function Quiz() {
  const [notes, setNotes] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [sourceType, setSourceType] = useState('note'); // 'note', 'upload', 'text'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [customText, setCustomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState('');
  const [serverInfo, setServerInfo] = useState(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [audio, setAudio] = useState(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadUserNotes();
      getServerInfo();
    } else {
      setNotesLoading(false);
    }
  }, [currentUser]);

  // Music functionality
  useEffect(() => {
    //audio element for background music
    const backgroundAudio = new Audio('/music/quizz.mp3');
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.3;
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

  const loadUserNotes = async () => {
    if (!currentUser) {
      setNotesLoading(false);
      return;
    }

    setNotesLoading(true);
    setNotesError('');
    
    try {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const notesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotes(notesData);
      console.log(`✓ Loaded ${notesData.length} notes`);
      
    } catch (error) {
      console.error("Error loading notes:", error);
      setNotesError('Unable to load notes. You can still use file upload or text input.');
    } finally {
      setNotesLoading(false);
    }
  };

  const getServerInfo = async () => {
    try {
      const info = await QuizApiService.getServerInfo();
      setServerInfo(info);
      console.log('Server info:', info);
    } catch (error) {
      console.error('Failed to get server info:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf', 
        'text/plain', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload PDF, TXT, or DOCX files only');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('File size too large. Please upload files smaller than 10MB.');
        return;
      }
      
      setUploadedFile(file);
      setSelectedSource(file.name);
    }
  };

  const extractContent = async () => {
    let content = '';
    
    if (sourceType === 'note' && selectedSource) {
      const note = notes.find(n => n.id === selectedSource);
      content = note?.content || JSON.stringify(note?.elements || '');
      console.log("Extracted content from note");
    } else if (sourceType === 'upload' && uploadedFile) {
      return null;
    } else if (sourceType === 'text' && customText) {
      content = customText;
    }
    
    return content;
  };

 const testBackendConnection = async () => {
  try {
    console.log("🔍 Testing backend connection...");
    const isConnected = await QuizApiService.testConnection();
    if (!isConnected) {
      throw new Error('Backend server is not available');
    }
    return true;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    throw new Error(`Cannot connect to backend server: ${error.message}`);
  }
};

const generateQuiz = async () => {
  setLoading(true);
  setAnalyzing(true);
  
  try {
    console.log("=== STARTING QUIZ GENERATION ===");
    
    await testBackendConnection();
    console.log("✅ Backend connection confirmed");
    
    let quizData;

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (sourceType === 'upload' && uploadedFile) {
      console.log("📁 Generating from file upload...");
      quizData = await QuizApiService.generateQuizFromFile(uploadedFile, 50);
    } else {
      const content = await extractContent();
      
      if (!content || content.length < 50) {
        alert('Please provide sufficient content (at least 50 characters) for quiz generation.');
        setLoading(false);
        setAnalyzing(false);
        return;
      }

      console.log("📝 Generating from text content...");
      console.log("Content length:", content?.length);
      
      quizData = await QuizApiService.generateQuizFromText(content, {
        numQuestions: 50,
        quizType: 'mixed',
      });
    }

    // COMPREHENSIVE DEBUGGING: THE QUIZ NEEDS TO WORKKKK
    console.log("🎯 FULL QUIZ DATA RESPONSE:", quizData);
    console.log("📊 Quiz data keys:", Object.keys(quizData));
    console.log("🔍 Quiz data structure:", quizData.quiz_data);
    console.log("❓ Questions array:", quizData.quiz_data?.questions);
    console.log("🔢 Number of questions:", quizData.quiz_data?.questions?.length);
    console.log("📝 First question:", quizData.quiz_data?.questions?.[0]);
    
    setAnalyzing(false);
    

    navigate('/quiz-mode', { 
      state: { 
        quizData,
        sourceType,
        sourceName: sourceType === 'upload' ? uploadedFile.name : selectedSource || 'Custom Content'
      } 
    });

  } catch (error) {
    console.error('=== QUIZ GENERATION ERROR ===', error);
    setAnalyzing(false);
    setLoading(false);
    
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('Cannot connect to AI server') ||
        error.message.includes('Backend server is not available')) {
      
      alert(`🚨 Backend Connection Issue\n\nPlease make sure:\n1. The Python backend is running\n2. No firewall is blocking the connection\n3. The backend is accessible on ports 8000-8004\n\nTechnical details: ${error.message}`);
      
    } else if (error.message.includes('violates community guidelines')) {
      alert('This content contains inappropriate material and cannot be used for quiz generation.');
    } else {
      alert(`Failed to generate quiz: ${error.message}`);
    }
  }
};
   
         
const getGeneratorStatus = () => {
  if (!serverInfo) return '🔍 Checking connection...';
  
  if (serverInfo.error) {
    return '❌ Backend not available';
  }
  
  if (serverInfo.using_intelligent_generator) {
    return '🧠 Intelligent Generator (Content-Based)';
  } else if (serverInfo.mode === 'SIMPLE') {
    return '⚡ Simple Generator (Basic)';
  } else {
    return '🔧 Unknown Mode';
  }
};

  const FloatingShapes = () => (
    <div className="floating-shapes">
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
    </div>
  );

  // Loading...
  const LoadingOverlay = () => (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h3>{analyzing ? "Analyzing Content..." : "Generating Quiz..."}</h3>
        <p>{analyzing ? "Reading and understanding your content..." : "Creating personalized questions..."}</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <FloatingShapes />
      <div className="music-control">
        <button 
          className="music-toggle"
          onClick={toggleMusic}
          title={musicEnabled ? "Turn music off" : "Turn music on"}
        >
          {musicEnabled ? "🔊" : "🔇"}
        </button>
      </div>
      
      <div className="quiz-container">
        <div className="quiz-header">
          <h1>Generate AI Quiz</h1>
          <p><br />Select your content source and create customized quizzes automatically</p>  {serverInfo && (
    <div className="generator-status">
      <span className="status-badge">{getGeneratorStatus()}</span>
      <button 
        onClick={async () => {
          try {
            await testBackendConnection();
            alert('✅ Backend connection successful!');
            getServerInfo(); // Refresh server info
          } catch (error) {
            alert(`❌ Connection failed: ${error.message}`);
          }
        }}
        className="test-connection-btn"
        style={{
          marginLeft: '10px',
          padding: '5px 10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Connection
      </button>
    </div>
  )}
</div>

        <div className="source-selection">
          {/* Source Type Selection */}
          <div className="source-type-selector">
            <h3>Select Content Source</h3>
            <div className="source-buttons">
              <button 
                className={sourceType === 'note' ? 'active' : ''}
                onClick={() => setSourceType('note')}
              >
                📝 From Notes
              </button>
              <button 
                className={sourceType === 'upload' ? 'active' : ''}
                onClick={() => setSourceType('upload')}
              >
                🗄️ Upload File
              </button>
              <button 
                className={sourceType === 'text' ? 'active' : ''}
                onClick={() => setSourceType('text')}
              >
                ✏️ Custom Text
              </button>
            </div>
          </div>

          {/* Source Specific Inputs */}
          <div className="source-inputs">
            {sourceType === 'note' && (
              <div className="note-selection">
                <h4>Select a Note</h4>
                {notesLoading ? (
                  <div className="loading-notes">
                    <p>Loading your notes...</p>
                  </div>
                ) : notesError ? (
                  <div className="notes-error">
                    <p>{notesError}</p>
                    <button onClick={loadUserNotes} className="retry-btn">
                      🔄 Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <select 
                      value={selectedSource} 
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="note-select"
                    >
                      <option value="">Choose a note...</option>
                      {notes.map(note => (
                        <option key={note.id} value={note.id}>
                          {note.title || `Note from ${new Date(note.createdAt?.toDate()).toLocaleDateString()}`}
                        </option>
                      ))}
                    </select>
                    {notes.length === 0 && (
                      <p className="no-notes">
                        You don't have any notes yet. Create some notes first or use file upload/text input!
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {sourceType === 'upload' && (
              <div className="file-upload">
                <h4>Upload Document</h4>
                <div className="upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.docx"
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="upload-label">
                    {uploadedFile ? `📄 ${uploadedFile.name}` : '📎 Choose PDF, TXT, or DOCX'}
                  </label>
                  <p className="upload-hint">Supports: PDF, Text files, Word documents (Max 10MB)</p>
                  {uploadedFile && (
                    <p className="file-info">
                      Size: {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
              </div>
            )}

            {sourceType === 'text' && (
              <div className="text-input">
                <h4>Enter Text Content</h4>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste or type your content here... (Minimum 100 characters for best results)"
                  className="text-area"
                  rows="8"
                />
                <div className="char-count">
                  {customText.length} characters
                  {customText.length < 100 && (
                    <span className="min-chars"> (Minimum 100 recommended)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="generate-section">
            <button 
              onClick={generateQuiz}
              disabled={loading || 
                (sourceType === 'note' && !selectedSource) ||
                (sourceType === 'upload' && !uploadedFile) ||
                (sourceType === 'text' && customText.length < 50)
              }
              className="generate-btn"
            >
              {loading ? '🔄 Generating Quiz...' : '🫸 Generate AI Quiz (Up to 50 questions)'}
            </button>
            
            {sourceType === 'text' && customText.length < 50 && (
              <p className="warning">Please enter at least 50 characters for meaningful quiz generation</p>
            )}
            {sourceType === 'note' && !selectedSource && notes.length > 0 && (
              <p className="warning">Please select a note to generate quiz from</p>
            )}
          </div>
<button
  onClick={async () => {
    try {
      const testContent = "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines. Machine learning is a subset of AI that allows computers to learn without explicit programming. Deep learning uses neural networks to analyze complex patterns in data.";
      const quizData = await QuizApiService.generateQuizFromText(testContent, {
        numQuestions: 5,
        quizType: 'multiple_choice'
      });
      console.log("🧪 TEST RESULT:", quizData);
      alert(`Test generated ${quizData.quiz_data?.questions?.length || 0} questions`);
    } catch (error) {
      console.error("Test failed:", error);
      alert("Test failed: " + error.message);
    }
  }}
  style={{
    padding: '10px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    margin: '10px'
  }}
>
  👨🏾‍🔬 Test Quiz Generation
</button>
        </div>

        {/* Features Preview */}
        <div className="features-preview">
          <h3>Quiz Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h4>Smart Question Generation</h4>
              <p>AI analyzes your content and creates relevant, educational questions</p>
            
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h4>Exam & Relaxed Modes</h4>
              <p>Choose between timed exam mode or stress-free relaxed practice</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>Multiple Question Types</h4>
              <p>Multiple choice, fill-in-blank, true/false, and open-ended questions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📥</div>
              <h4>Export Results</h4>
              <p>Download your quiz results and answers for offline review</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Quiz;