import { useNavigate } from "react-router-dom";
import "../styles/role.css";

function ChooseRole() {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    navigate(`/register?role=${role}`);
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  return (
    <div className="choose-role-container">
      {/* Animated background icons */}
      <div className="floating-icon book-icon">📚</div>
      <div className="floating-icon pen-icon">✏️</div>
      <div className="floating-icon paper-icon">📝</div>
      <div className="floating-icon person-icon">👩‍💼</div>
      <div className="floating-icon document-icon">📄</div>
      
      <div className="choose-role-content">
        <h2>Choose Your Role</h2>
        <p>Select how you'd like to use our platform</p>
        
        <div className="role-buttons">
          <button 
            className="role-btn user-btn"
            onClick={() => handleSelect("user")}
          >
            <span className="btn-icon">👤</span>
            <span className="btn-text">
              <span className="btn-title">Continue as User</span>
              <span className="btn-description">Access learning materials and resources</span>
            </span>
          </button>
          
          <button 
            className="role-btn admin-btn"
            onClick={() => handleSelect("admin")}
          >
            <span className="btn-icon">⚙️</span>
            <span className="btn-text">
              <span className="btn-title">Continue as Admin</span>
              <span className="btn-description">Manage content and user accounts</span>
            </span>
          </button>
        </div>
        
        <div className="login-redirect">
          <p>Already have an account?</p>
          <button onClick={handleLoginRedirect} className="login-btn">
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChooseRole;