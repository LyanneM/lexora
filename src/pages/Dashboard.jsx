import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notesService, quizzesService } from "../services/firebaseService";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("notes");
  const [loading, setLoading] = useState(true);
  
  // Real user data state
  const [userData, setUserData] = useState({
    notes: [],
    quizzes: [],
    uploads: [] // Placeholder for future upload feature
  });

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Fetch notes
        const userNotes = await notesService.getUserNotes(currentUser.uid);
        
        // Fetch quizzes
        const userQuizzes = await quizzesService.getUserQuizzes(currentUser.uid);
        
        setUserData({
          notes: userNotes,
          quizzes: userQuizzes,
          uploads: [] // Add uploads when you implement the service
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleCreateNote = () => {
    navigate("/notebook/create");
  };

  const handleOpenNote = (noteId) => {
    navigate(`/notebook/${noteId}`);
  };

  const handleCreateQuiz = (noteId = null) => {
    if (noteId) {
      navigate(`/quiz/create?fromNote=${noteId}`);
    } else {
      navigate("/quiz");
    }
  };

  const handleOpenQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  const handleUploadFile = () => {
    // Implement file upload logic here
    document.getElementById('file-upload').click();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome to Your Dashboard</h2>
        <p>Manage your notes, quizzes, and learning materials</p>
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
            <h3>🐍 Python Math Notebook</h3>
            <p>Advanced computations with Python code and rich outputs</p>
            <button 
              className="notebook-card-btn"
              onClick={() => navigate('/notebook/python')}
            >
              Open Python Notebook
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
                        onClick={() => handleCreateQuiz(note.id)}
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
                    <h4>{quiz.title || 'Untitled Quiz'}</h4>
                    <p>Created: {formatDate(quiz.createdAt)}</p>
                    {quiz.score && <p className="quiz-score">Score: {quiz.score}</p>}
                    <div className="item-actions">
                      <button 
                        className="action-btn primary"
                        onClick={() => handleOpenQuiz(quiz.id)}
                      >
                        {quiz.score ? 'Review' : 'Start'}
                      </button>
                      <button 
                        className="action-btn secondary"
                        onClick={() => handleCreateQuiz()}
                      >
                        Retake
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