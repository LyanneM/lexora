import "../styles/global.css"; // We'll create this CSS file

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Lexora</h3>
          <p>Your immersive online note-taking and quiz generation app.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/notes">Notes</a></li>
            <li><a href="/quiz">Quiz</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="/help">Help Center</a></li>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Service</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Connect With Us</h4>
          <div className="social-icons">
            <a href="#" aria-label="Facebook"><span>📱</span></a>
            <a href="#" aria-label="Twitter"><span>🐦</span></a>
            <a href="#" aria-label="Instagram"><span>📸</span></a>
            <a href="#" aria-label="LinkedIn"><span>💼</span></a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Lexora. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;