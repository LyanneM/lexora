// src/pages/Feedback.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/feedback.css";

function Feedback() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [feedback, setFeedback] = useState({
    rating: 0,
    mathNotes: 0,
    normalNotes: 0,
    codeNotes: 0,
    quizzes: 0,
    overallExperience: 0,
    comments: ""
  });

  const handleRatingChange = (category, value) => {
    setFeedback(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to submit feedback");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "feedback"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || "Anonymous",
        rating: feedback.rating,
        featureRatings: {
          mathNotes: feedback.mathNotes,
          normalNotes: feedback.normalNotes,
          codeNotes: feedback.codeNotes,
          quizzes: feedback.quizzes,
          overallExperience: feedback.overallExperience
        },
        message: feedback.comments,
        createdAt: serverTimestamp(),
        status: "new",
        read: false
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ category, value, onChange }) => (
    <div className="rating-group">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${value >= star ? 'active' : ''}`}
          onClick={() => onChange(category, star)}
        >
          ⭐
        </button>
      ))}
    </div>
  );

  if (submitted) {
    return (
      <div className="feedback-container">
        <div className="feedback-success">
          <div className="success-icon">🎉</div>
          <h2>Thank You for Your Feedback!</h2>
          <p>Your feedback helps us improve Lexora. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>Share Your Feedback</h1>
        <p>Help us improve Lexora by sharing your experience</p>
      </div>

      <form onSubmit={handleSubmit} className="feedback-form">
        {/* Overall Rating */}
        <div className="form-section">
          <label>Overall Rating</label>
          <RatingStars 
            category="rating" 
            value={feedback.rating} 
            onChange={handleRatingChange} 
          />
        </div>

        {/* Feature Ratings */}
        <div className="form-section">
          <h3>Rate Our Features</h3>
          
          <div className="feature-rating">
            <label>Math Notes</label>
            <RatingStars 
              category="mathNotes" 
              value={feedback.mathNotes} 
              onChange={handleRatingChange} 
            />
          </div>

          <div className="feature-rating">
            <label>Normal Notes</label>
            <RatingStars 
              category="normalNotes" 
              value={feedback.normalNotes} 
              onChange={handleRatingChange} 
            />
          </div>

          <div className="feature-rating">
            <label>Code Notebook</label>
            <RatingStars 
              category="codeNotes" 
              value={feedback.codeNotes} 
              onChange={handleRatingChange} 
            />
          </div>

          <div className="feature-rating">
            <label>Quizzes</label>
            <RatingStars 
              category="quizzes" 
              value={feedback.quizzes} 
              onChange={handleRatingChange} 
            />
          </div>

          <div className="feature-rating">
            <label>Overall Experience</label>
            <RatingStars 
              category="overallExperience" 
              value={feedback.overallExperience} 
              onChange={handleRatingChange} 
            />
          </div>
        </div>

        {/* Comments */}
        <div className="form-section">
          <label htmlFor="comments">Additional Comments</label>
          <textarea
            id="comments"
            value={feedback.comments}
            onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
            placeholder="What do you love about Lexora? What can we improve? Any features you'd like to see?"
            rows="5"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}

export default Feedback;