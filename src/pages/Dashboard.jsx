import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("notes");
  const [loading, setLoading] = useState(true);
  
  
  const [userData, setUserData] = useState({
    notes: [],
    quizzes: [],
    uploads: []
  });

  
  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  
  const fetchUserData = async () => {
    if (!currentUser) {
      console.log("No current user found");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log("Fetching data for user:", currentUser.uid);
      
     
      let userNotes = [];
      try {
        const notesQuery = query(
          collection(db, "notes"),
          where("owner", "==", currentUser.uid)
        );
        const notesSnapshot = await getDocs(notesQuery);
        userNotes = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('✅ Successfully loaded notes:', userNotes.length);
      } catch (notesError) {
        console.error('❌ Error loading notes:', notesError);
        console.log('Notes error details:', notesError.code, notesError.message);
      }

      
      let userQuizzes = [];
      try {
        const quizzesQuery = query(
          collection(db, "quizResults"),
          where("userId", "==", currentUser.uid),
          orderBy("completedAt", "desc")
        );
        const quizzesSnapshot = await getDocs(quizzesQuery);
        userQuizzes = quizzesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('✅ Successfully loaded quizzes:', userQuizzes.length);
      } catch (quizzesError) {
        console.error('❌ Error loading quizzes:', quizzesError);
        console.log('Quizzes error details:', quizzesError.code, quizzesError.message);
      }

      setUserData({
        notes: userNotes,
        quizzes: userQuizzes,
        uploads: []
      });
      
    } catch (error) {
      console.error("General error fetching user data:", error);
      setUserData({
        notes: [],
        quizzes: [],
        uploads: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Add error handling for Firestore permissions
  useEffect(() => {
    const checkFirestoreAccess = async () => {
      try {
        // Test if we can access Firestore
        const testQuery = query(collection(db, "notes"), where("owner", "==", "test"));
        await getDocs(testQuery);
      } catch (error) {
        console.error("Firestore access error:", error);
        if (error.code === 'permission-denied') {
          console.log("Firestore permissions issue - check your Firestore rules");
        }
      }
    };
    
    if (currentUser) {
      checkFirestoreAccess();
    }
  }, [currentUser]);

  const handleCreateNote = () => {
    navigate("/notebook/create");
  };

  const handleOpenNote = (noteId) => {
    navigate(`/notebook/${noteId}`);
  };

  const handleCreateQuiz = (noteId = null) => {
    if (noteId) {
      navigate(`/quiz/${noteId}`);
    } else {
      navigate("/quiz");
    }
  };

  const handleOpenQuiz = (quizId) => {
    navigate(`/quiz-review/${quizId}`);
  };

  const handleUploadFile = () => {
    document.getElementById('file-upload').click();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getNoteIcon = (noteType) => {
    switch (noteType) {
      case 'math': return 'π';
      case 'technical': return '</>';
      case 'regular': 
      default: 
        return '📝';
    }
  };

const testFirestoreAccess = async () => {
  try {
    console.log("Testing Firestore access...");
    
    // Test notes access
    const notesTest = await getDocs(query(collection(db, "notes"), where("owner", "==", currentUser.uid)));
    console.log("Notes test result:", notesTest.docs.length, "documents");
    
    // Test quizResults access  
    const quizzesTest = await getDocs(query(collection(db, "quizResults"), where("userId", "==", currentUser.uid)));
    console.log("Quizzes test result:", quizzesTest.docs.length, "documents");
    
  } catch (error) {
    console.error("Firestore test failed:", error);
    console.log("Error code:", error.code);
    console.log("Error message:", error.message);
  }
};

useEffect(() => {
  if (currentUser) {
    fetchUserData();
    testFirestoreAccess(); // Add this line
  }
}, [currentUser]);
  const handleRefresh = () => {
    fetchUserData();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
        <button onClick={handleRefresh} style={{marginTop: '10px'}}>
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome to Your Dashboard</h2>
        <p>Manage your notes, quizzes, and learning materials</p>
        <button 
          onClick={handleRefresh}
          className="refresh-btn"
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>
      {/* Feedback Prompt Section */}
<div className="feedback-prompt">
  <div className="feedback-message">
    <h3>Enjoying Lexora?</h3>
    <p>Help us improve by sharing your feedback</p>
  </div>
  <button 
    onClick={() => navigate("/feedback")}
    className="feedback-btn"
  >
    💬 Give Feedback
  </button>
</div>

      {/* Notebook Options Section */}
      <div className="notebook-options-section">
        <h3>Quick Access Notebooks</h3>
        <div className="notebook-options">
          {/* Quick Math Tools */}
          <div className="notebook-card">
            <h3>🧮 Math Notebook</h3>
            <p>Quick calculations, graphing, and equation solving</p>
            <button 
              className="notebook-card-btn"
              onClick={() => navigate('/notebook/math')}
            >
              Open Math Tools
            </button>
          </div>

          {/* Advanced Python Notebook */}
          <div className="notebook-card">
            <h3>Complex Math Notebook</h3>
            <p>Advanced Mathematical practices</p>
            <button 
              className="notebook-card-btn"
              onClick={() => navigate('/notebook/complex-math/')}
            >
              Open Complex Notebook
            </button>
          </div>

          {/* Code Notebook */}
          <div className="notebook-card">
            <h3>💻 Code Notebook</h3>
            <p>Write and execute code in multiple languages</p>
            <button 
              className="notebook-card-btn"
              onClick={() => navigate('/notebook/code')}
            >
              Open Code Editor
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === "notes" ? "tab-active" : ""} 
          onClick={() => setActiveTab("notes")}
        >
          Notes ({userData.notes.length})
        </button>
        <button 
          className={activeTab === "quizzes" ? "tab-active" : ""} 
          onClick={() => setActiveTab("quizzes")}
        >
          Quizzes ({userData.quizzes.length})
        </button>
        <button 
          className={activeTab === "uploads" ? "tab-active" : ""} 
          onClick={() => setActiveTab("uploads")}
        >
          Uploads ({userData.uploads.length})
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="dashboard-content">
        {activeTab === "notes" && (
          <div className="notes-section">
            <div className="section-header">
              <h3>Your Notes</h3>
              <button className="create-button" onClick={handleCreateNote}>
                + Create New Note
              </button>
            </div>
            
            {userData.notes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h4>No notes yet</h4>
                <p>Create your first note to get started with Lexora</p>
                <button className="create-button primary" onClick={handleCreateNote}>
                  Create Your First Note
                </button>
              </div>
            ) : (
              <div className="items-grid">
                {userData.notes.map(note => (
                  <div key={note.id} className="item-card">
                    <div className="item-icon">
                      {getNoteIcon(note.type)}
                    </div>
                    <h4>{note.title || 'Untitled Note'}</h4>
                    <p>Created: {formatDate(note.createdAt)}</p>
                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                      <p className="updated-date">Updated: {formatDate(note.updatedAt)}</p>
                    )}
                    <div className="item-actions">
                      <button 
                        className="action-btn primary"
                        onClick={() => handleOpenNote(note.id)}
                      >
                        Open
                      </button>
                      
                      <button 
                        className="action-btn secondary"
                        onClick={() => navigate('/quiz', { state: { selectedNoteId: note.id } })}
                      >
                        Quiz Me
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "quizzes" && (
          <div className="quizzes-section">
            <div className="section-header">
              <h3>Your Quizzes</h3>
              <button className="create-button" onClick={() => handleCreateQuiz()}>
                + Create New Quiz
              </button>
            </div>
            
            {userData.quizzes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">❓</div>
                <h4>No quizzes yet</h4>
                <p>Create quizzes from your notes to test your knowledge</p>
                <button className="create-button primary" onClick={() => handleCreateQuiz()}>
                  Create Your First Quiz
                </button>
              </div>
            ) : (
              <div className="items-grid">
                {userData.quizzes.map(quiz => (
                  <div key={quiz.id} className="item-card">
                    <div className="item-icon">❓</div>
                    <h4>{quiz.quizTitle || 'Quiz Results'}</h4>
                    <p>Completed: {formatDate(quiz.completedAt)}</p>
                    <p>Source: {quiz.sourceName || 'Unknown'}</p>
                    {quiz.score !== undefined && (
                      <p className={`quiz-score ${quiz.score >= 80 ? 'excellent' : quiz.score >= 60 ? 'good' : 'poor'}`}>
                        Score: {quiz.score}%
                      </p>
                    )}
                    <div className="item-actions">
                      <button 
                        className="action-btn primary"
                        onClick={() => navigate(`/quiz-review/${quiz.id}`)}
                      >
                        📊 Review
                      </button>
                      <button 
                        className="action-btn secondary"
                        onClick={() => handleCreateQuiz()}
                      >
                        🎯 New Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "uploads" && (
          <div className="uploads-section">
            <div className="section-header">
              <h3>Your Uploads</h3>
              <button className="create-button" onClick={handleUploadFile}>
                + Upload File
              </button>
              <input type="file" id="file-upload" style={{display: 'none'}} />
            </div>
            
            {userData.uploads.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h4>No uploads yet</h4>
                <p>Upload files to organize your learning materials</p>
                <button className="create-button primary" onClick={handleUploadFile}>
                  Upload Your First File
                </button>
              </div>
            ) : (
              <div className="items-grid">
                {userData.uploads.map(upload => (
                  <div key={upload.id} className="item-card">
                    <div className="item-icon">📄</div>
                    <h4>{upload.title}</h4>
                    <p>Type: {upload.type} • Date: {formatDate(upload.date)}</p>
                    <div className="item-actions">
                      <button className="action-btn primary">View</button>
                      <button className="action-btn secondary">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
