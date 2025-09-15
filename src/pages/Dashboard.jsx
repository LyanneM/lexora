import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("notes");

  // Sample data - you'll replace this with real data from your backend
  const [userData, setUserData] = useState({
    notes: [
      { id: 1, title: "Math Lecture Notes", type: "math", date: "2023-10-15" },
      { id: 2, title: "Programming Concepts", type: "technical", date: "2023-10-10" },
      { id: 3, title: "History Summary", type: "regular", date: "2023-10-05" }
    ],
    quizzes: [
      { id: 1, title: "Algebra Quiz", score: "85%", date: "2023-10-16" },
      { id: 2, title: "JavaScript Basics", score: "92%", date: "2023-10-11" }
    ],
    uploads: [
      { id: 1, title: "Lecture Slides", type: "PDF", date: "2023-10-14" },
      { id: 2, title: "Research Paper", type: "DOC", date: "2023-10-08" }
    ]
  });

 // In your Dashboard.jsx, update the handleCreateNote function:
const handleCreateNote = () => {
  navigate("/notebook/create"); // This will go to the type selector
};

  const handleOpenNote = (noteId) => {
    navigate(`/notebook/${noteId}`);
  };

  const handleCreateQuiz = (noteId = null) => {
    if (noteId) {
      navigate(`/quiz/create?fromNote=${noteId}`);
    } else {
      navigate("/quiz/create");
    }
  };

  const handleOpenQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Your Dashboard</h2>
        <p>Manage your notes, quizzes, and learning materials</p>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === "notes" ? "tab-active" : ""} 
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
        <button 
          className={activeTab === "quizzes" ? "tab-active" : ""} 
          onClick={() => setActiveTab("quizzes")}
        >
          Quizzes
        </button>
        <button 
          className={activeTab === "uploads" ? "tab-active" : ""} 
          onClick={() => setActiveTab("uploads")}
        >
          Uploads
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
                <p>You haven't created any notes yet.</p>
                <button className="create-button" onClick={handleCreateNote}>
                  Create Your First Note
                </button>
              </div>
            ) : (
              <div className="items-grid">
                {userData.notes.map(note => (
                  <div key={note.id} className="item-card">
                    <div className="item-icon">
                      {note.type === "math" && "π"}
                      {note.type === "technical" && "</>"}
                      {note.type === "regular" && "📝"}
                    </div>
                    <h4>{note.title}</h4>
                    <p>Created: {note.date}</p>
                    <div className="item-actions">
                      <button onClick={() => handleOpenNote(note.id)}>Open</button>
                      <button onClick={() => handleCreateQuiz(note.id)}>Quiz Me</button>
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
                <p>You haven't taken any quizzes yet.</p>
                <button className="create-button" onClick={() => handleCreateQuiz()}>
                  Create Your First Quiz
                </button>
              </div>
            ) : (
              <div className="items-grid">
                {userData.quizzes.map(quiz => (
                  <div key={quiz.id} className="item-card">
                    <div className="item-icon">❓</div>
                    <h4>{quiz.title}</h4>
                    <p>Score: {quiz.score} • Date: {quiz.date}</p>
                    <div className="item-actions">
                      <button onClick={() => handleOpenQuiz(quiz.id)}>Review</button>
                      <button onClick={() => handleCreateQuiz()}>Retake</button>
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
              <button className="create-button" onClick={() => document.getElementById('file-upload').click()}>
                + Upload File
              </button>
              <input type="file" id="file-upload" style={{display: 'none'}} />
            </div>
            
            {userData.uploads.length === 0 ? (
              <div className="empty-state">
                <p>You haven't uploaded any files yet.</p>
              </div>
            ) : (
              <div className="items-grid">
                {userData.uploads.map(upload => (
                  <div key={upload.id} className="item-card">
                    <div className="item-icon">📄</div>
                    <h4>{upload.title}</h4>
                    <p>Type: {upload.type} • Date: {upload.date}</p>
                    <div className="item-actions">
                      <button>View</button>
                      <button>Download</button>
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