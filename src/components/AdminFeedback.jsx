import { useState, useEffect } from 'react';
import '../styles/admin-feedback.css';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, [filter]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/feedback?status=${filter}`);
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId, status) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        // Refresh the feedback list
        loadFeedbacks();
      } else {
        alert('Failed to update feedback status');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Error updating feedback status');
    }
  };

  const sendReply = async (feedbackId, message) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (response.ok) {
        alert('Reply sent successfully');
        loadFeedbacks();
      } else {
        alert('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error sending reply');
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => 
    filter === 'all' || feedback.status === filter
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#ff0080';
      case 'read': return '#00b4db';
      case 'addressed': return '#00c853';
      default: return '#666';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature': return '#00b4db';
      case 'bug': return '#ff5252';
      case 'api': return '#ff9800';
      case 'general': return '#9c27b0';
      default: return '#666';
    }
  };

  if (loading) return <div className="loading">Loading feedback...</div>;

  return (
    <div className="admin-feedback">
      <div className="feedback-header">
        <h2>User Feedback</h2>
        <div className="feedback-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({feedbacks.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'new' ? 'active' : ''}`}
            onClick={() => setFilter('new')}
          >
            New ({feedbacks.filter(f => f.status === 'new').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({feedbacks.filter(f => f.status === 'read').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'addressed' ? 'active' : ''}`}
            onClick={() => setFilter('addressed')}
          >
            Addressed ({feedbacks.filter(f => f.status === 'addressed').length})
          </button>
        </div>
      </div>

      <div className="feedback-stats">
        <div className="stat">
          <div className="stat-value">{feedbacks.length}</div>
          <div className="stat-label">Total Feedback</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {feedbacks.length > 0 
              ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
              : '0.0'
            }
          </div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {feedbacks.filter(f => f.status === 'new').length}
          </div>
          <div className="stat-label">Pending Review</div>
        </div>
      </div>

      <div className="feedback-list">
        {filteredFeedbacks.map(feedback => (
          <div key={feedback.id} className="feedback-item">
            <div className="feedback-header">
              <div className="user-info">
                <span className="user-name">{feedback.userName || 'Anonymous User'}</span>
                <span className="user-email">{feedback.userEmail}</span>
              </div>
              <div className="feedback-meta">
                <span 
                  className="type-badge"
                  style={{ backgroundColor: getTypeColor(feedback.type) }}
                >
                  {feedback.type}
                </span>
                {feedback.rating && (
                  <span className="rating">{"⭐".repeat(feedback.rating)}</span>
                )}
                <span className="date">{new Date(feedback.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="feedback-message">
              {feedback.message}
            </div>
            
            <div className="feedback-actions">
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(feedback.status) }}
              >
                {feedback.status}
              </span>
              
              <div className="action-buttons">
                {feedback.status !== 'read' && (
                  <button 
                    onClick={() => updateFeedbackStatus(feedback.id, 'read')}
                    className="action-btn mark-read"
                  >
                    Mark Read
                  </button>
                )}
                {feedback.status !== 'addressed' && (
                  <button 
                    onClick={() => updateFeedbackStatus(feedback.id, 'addressed')}
                    className="action-btn mark-addressed"
                  >
                    Mark Addressed
                  </button>
                )}
                <button 
                  onClick={() => {
                    const message = prompt('Enter your reply:');
                    if (message) {
                      sendReply(feedback.id, message);
                    }
                  }}
                  className="action-btn reply"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminFeedback;