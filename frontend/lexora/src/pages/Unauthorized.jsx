// src/pages/Unauthorized.jsx
import { Link } from "react-router-dom";
import "../styles/unauthorized.css";

function Unauthorized() {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <div className="actions">
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
          <Link to="/" className="btn-secondary">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;