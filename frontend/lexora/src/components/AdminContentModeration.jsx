import { useState, useEffect } from 'react';
import '../styles/admin-content-moderation.css';

const AdminContentModeration = () => {
  const [content, setContent] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [filter]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content?status=${filter}`);
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContentStatus = async (contentId, status, notes = '') => {
    try {
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });
      
      if (response.ok) {
        // Refresh the content list
        loadContent();
        setSelectedContent(null);
      } else {
        alert('Failed to update content status');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Error updating content status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#00c853';
      case 'rejected': return '#ff5252';
      default: return '#666';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'quiz': return '📝';
      case 'notebook': return '📓';
      case 'question': return '❓';
      default: return '📄';
    }
  };

  if (loading) return <div className="loading">Loading content...</div>;

  return (
    <div className="admin-content-moderation">
      <div className="moderation-header">
        <h2>Content Moderation</h2>
        <div className="moderation-filters">
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending Review ({content.filter(c => c.status === 'pending').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({content.filter(c => c.status === 'approved').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({content.filter(c => c.status === 'rejected').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Content ({content.length})
          </button>
        </div>
      </div>

      <div className="moderation-stats">
        <div className="stat">
          <div className="stat-value">{content.length}</div>
          <div className="stat-label">Total Content</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {content.filter(c => c.status === 'pending').length}
          </div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {content.filter(c => c.flags > 0).length}
          </div>
          <div className="stat-label">Flagged Content</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {Math.round((content.filter(c => c.status !== 'pending').length / content.length) * 100)}%
          </div>
          <div className="stat-label">Moderation Rate</div>
        </div>
      </div>

      <div className="content-list">
        {content.map(item => (
          <div key={item.id} className="content-item">
            <div className="content-header">
              <div className="content-type">
                <span className="type-icon">{getTypeIcon(item.type)}</span>
                <span className="type-name">{item.type}</span>
              </div>
              <div className="content-meta">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(item.status) }}
                >
                  {item.status}
                </span>
                {item.flags > 0 && (
                  <span className="flag-count">🚩 {item.flags}</span>
                )}
                <span className="date">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="content-details">
              <h4 className="content-title">{item.title}</h4>
              <p className="content-author">By: {item.authorName || item.authorEmail}</p>
              {item.reason && (
                <p className="content-reason">
                  <strong>Flag Reason:</strong> {item.reason}
                </p>
              )}
              <p className="content-preview">{item.content.substring(0, 200)}...</p>
            </div>

            {item.status === 'pending' && (
              <div className="moderation-actions">
                <button 
                  onClick={() => updateContentStatus(item.id, 'approved')}
                  className="action-btn approve"
                >
                  ✅ Approve
                </button>
                <button 
                  onClick={() => setSelectedContent(item)}
                  className="action-btn reject"
                >
                  ❌ Reject
                </button>
                <button 
                  onClick={() => setSelectedContent(item)}
                  className="action-btn review"
                >
                  🔍 Review Details
                </button>
              </div>
            )}

            {item.status !== 'pending' && item.reviewedBy && (
              <div className="review-info">
                <p>
                  Reviewed by {item.reviewedBy} on {new Date(item.reviewedAt).toLocaleDateString()}
                  {item.reviewNotes && ` - ${item.reviewNotes}`}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedContent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Review Content</h3>
              <button 
                onClick={() => setSelectedContent(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="content-review">
                <h4>{selectedContent.title}</h4>
                <p><strong>Type:</strong> {selectedContent.type}</p>
                <p><strong>Author:</strong> {selectedContent.authorName || selectedContent.authorEmail}</p>
                <p><strong>Created:</strong> {new Date(selectedContent.createdAt).toLocaleDateString()}</p>
                <p><strong>Flags:</strong> {selectedContent.flags}</p>
                <p><strong>Reason:</strong> {selectedContent.reason}</p>
                
                <div className="content-full">
                  <h5>Content Preview:</h5>
                  <div className="content-text">
                    {selectedContent.content}
                  </div>
                </div>

                <div className="rejection-reason">
                  <label htmlFor="rejectionNotes">Rejection Notes (required):</label>
                  <textarea 
                    id="rejectionNotes"
                    placeholder="Explain why this content is being rejected..."
                    rows="4"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => updateContentStatus(selectedContent.id, 'approved')}
                className="action-btn approve"
              >
                ✅ Approve Content
              </button>
              <button 
                onClick={() => {
                  const notes = document.getElementById('rejectionNotes').value;
                  if (notes.trim()) {
                    updateContentStatus(selectedContent.id, 'rejected', notes);
                  } else {
                    alert('Please provide rejection notes');
                  }
                }}
                className="action-btn reject"
              >
                ❌ Reject Content
              </button>
              <button 
                onClick={() => setSelectedContent(null)}
                className="action-btn cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContentModeration;