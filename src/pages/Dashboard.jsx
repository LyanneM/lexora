import "../styles/dashboard.css"; // Import page-specific styles

function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Your Dashboard</h2>
        <p>This is where your notes, quizzes, and uploads will appear.</p>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">Notes</div>
        <div className="dashboard-card">Quizzes</div>
        <div className="dashboard-card">Uploads</div>
      </div>
    </div>
  );
}

export default Dashboard;
