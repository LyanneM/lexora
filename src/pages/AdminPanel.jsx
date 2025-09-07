// src/pages/AdminPanel.jsx
import { useAuth } from "../context/AuthContext";
import AdminUserManager from "../components/AdminUserManager";
import "../styles/admin.css";

function AdminPanel() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <div className="user-info">
          <span>Welcome, Admin {currentUser?.email}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>
      
      <main className="admin-content">
        <div className="welcome-card">
          <h2>Administrator Dashboard</h2>
          <p>Manage users, content, and platform settings.</p>
        </div>
        
        {/* User Management Section */}
        <AdminUserManager />
        
        <div className="admin-grid">
          <div className="admin-card">
            <h3>Content Moderation</h3>
            <p>Review and moderate content</p>
          </div>
          
          <div className="admin-card">
            <h3>Analytics</h3>
            <p>View platform analytics</p>
          </div>
          
          <div className="admin-card">
            <h3>Settings</h3>
            <p>Configure platform settings</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;