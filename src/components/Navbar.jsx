// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import "../styles/global.css";

function Navbar() {
  const { isLoggedIn, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsAdmin(role === "admin");
  }, [role]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Hide Navbar on specific routes like login and register and home
  if (location.pathname === "/") {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">📚</span>
          Lexora
        </Link>
        
        <div className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
          <div className="nav-item">
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
          </div>
          
          {isLoggedIn ? (
            <>
              {/* ADMIN USER MENU - Only Home, Profile, Admin */}
              {isAdmin ? (
                <>
                  <div className="nav-item">
                    <Link to="/profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                      Profile
                    </Link>
                  </div>
                  
                  <div className="nav-item">
                    <Link to="/adminpanel" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                      Admin
                    </Link>
                  </div>
                  
                  <div className="nav-item">
                    <button onClick={handleLogout} className="nav-button">
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                /* REGULAR USER MENU - Full menu */
                <>
                  <div className="nav-item">
                    <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </div>
                  
                  <div className="nav-item">
                    <Link to="/quiz" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                      Quiz
                    </Link>
                  </div>
                  
                  <div className="nav-item">
                    <Link to="/profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                      Profile
                    </Link>
                  </div>
                  
                  <div className="nav-item">
                    <Link to="/settings" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                      Settings
                    </Link>
                  </div>
                  
                  <div className="nav-item">
                    <button onClick={handleLogout} className="nav-button">
                      Logout
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* NOT LOGGED IN MENU */
            <>
              <div className="nav-item">
                <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
              </div>
              
              <div className="nav-item">
                <Link to="/choose-role" className="nav-link register-btn" onClick={() => setIsMenuOpen(false)}>
                  Register
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="nav-toggle" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;