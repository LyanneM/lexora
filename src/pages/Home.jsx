import { Link } from "react-router-dom";
import "../styles/home.css"; // Import page-specific styles

function Home() {
  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Welcome to Lexora</h1>
        <p>Your immersive online note-taking and quiz generation app.</p>
        <Link to="/login" className="home-btn">Get Started</Link>
      </div>
    </div>
  );
}

export default Home;
