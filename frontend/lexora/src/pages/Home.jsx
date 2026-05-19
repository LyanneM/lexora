import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Lottie from "lottie-react";
import "../styles/home.css";

//  Lottie animations
import KeyboardTypingAnimation from "../../public/Keyboard Typing.json";
import StudentAnimation from "../../public/STUDENT.json";
import RobotAnimation from "../../public/Little Power Robot.json";
import ProgrammingAnimation from "../../public/Programming Computer.json";

function Home() {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  React.useEffect(() => { 
    if (!loading && isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, loading, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Your  Home component content is here lol*/}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
      
      <div className="home-hero">
        <div className="logo-container">
          <img src="/logo.png" alt="Lexora Logo" className="home-logo" />
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-word title-word-1">Welcome to</span>
            <span className="title-word title-word-2">Lexora</span>
          </h1>
          <p className="hero-subtitle">Your immersive online note-taking and quiz generation app.</p>
          
          <div className="hero-cta">
            <Link to="/choose-role" className="cta-button">Get Started</Link>
            <a href="#animations" className="cta-button secondary">See Features</a>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="floating-notebook">
            <div className="notebook-cover">
              <div className="notebook-spine"></div>
              <div className="notebook-title">Lexora</div>
            </div>
            <div className="notebook-pages">
              <div className="page page-1"></div>
              <div className="page page-2"></div>
              <div className="page page-3"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Lottie Animations Section */}
      <div id="animations" className="animations-section">
        <div className="section-header">
          <h2>Why Choose Lexora?</h2>
          <p>Experience the future of learning with our innovative features</p>
        </div>
        
        <div className="animations-grid">
          <div className="animation-card">
            <div className="animation-wrapper">
              <Lottie 
                animationData={KeyboardTypingAnimation} 
                loop={true} 
                className="lottie-animation"
              />
            </div>
            <h3>Enhanced Learning</h3>
            <p>Learning brought to a whole new level with intuitive tools</p>
          </div>
          
          <div className="animation-card">
            <div className="animation-wrapper">
              <Lottie 
                animationData={StudentAnimation} 
                loop={true} 
                className="lottie-animation"
              />
            </div>
            <h3>Study Anywhere</h3>
            <p>Efficient studying anytime, anywhere with our platform</p>
          </div>
          
          <div className="animation-card">
            <div className="animation-wrapper">
              <Lottie 
                animationData={RobotAnimation} 
                loop={true} 
                className="lottie-animation"
              />
            </div>
            <h3>AI Companion</h3>
            <p>Smart AI assistance to enhance your note-taking experience</p>
          </div>
          
          <div className="animation-card">
            <div className="animation-wrapper">
              <Lottie 
                animationData={ProgrammingAnimation} 
                loop={true} 
                className="lottie-animation"
              />
            </div>
            <h3>Simplified Learning</h3>
            <p>Complex concepts made easy with our intuitive interface</p>
          </div>
        </div>
      </div>
      
      <div id="video-section" className="video-section">
        <div className="section-header">
          <h2>See Lexora in Action</h2>
          <p>Watch how our platform transforms your note-taking experience</p>
        </div>
        
        <div className="video-container">
          <div className="video-placeholder">
            <div className="play-button">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="30" fill="#8A2BE2" fillOpacity="0.8"/>
                <path d="M25 20L40 30L25 40V20Z" fill="white"/>
              </svg>
            </div>
            <p className="video-caption">Video demonstration coming soon</p>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="section-header">
          <h2>Powerful Features</h2>
          <p>Everything you need for effective learning and teaching</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Smart Notes</h3>
            <p>Create organized, searchable notes with our intuitive editor.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">❓</div>
            <h3>Quiz Generation</h3>
            <p>Automatically generate quizzes from your notes for effective studying.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Smart Search</h3>
            <p>Find exactly what you need across all your notes in seconds.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;