import { useState, useEffect } from 'react';
import '../styles/admin-notifications.css';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/notifications?filter=${filter}`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(notifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(notifications.filter(notif => notif.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      try {
        const response = await fetch('/api/admin/notifications/clear-all', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error clearing all notifications:', error);
      }
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.category === filter;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff5252';
      case 'medium': return '#ff9800';
      case 'low': return '#00b4db';
      default: return '#666';
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  if (loading) return <div className="loading">Loading notifications...</div>;

  return (
    <div className="admin-notifications">
      <div className="notifications-header">
        <div className="header-left">
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="action-btn mark-all-read"
          >
            Mark All as Read
          </button>
          <button 
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="action-btn clear-all"
          >
            Clear All
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="action-btn settings"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      <div className="notifications-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button 
          className={`filter-btn ${filter === 'system' ? 'active' : ''}`}
          onClick={() => setFilter('system')}
        >
          System
        </button>
        <button 
          className={`filter-btn ${filter === 'api' ? 'active' : ''}`}
          onClick={() => setFilter('api')}
        >
          API
        </button>
        <button 
          className={`filter-btn ${filter === 'user' ? 'active' : ''}`}
          onClick={() => setFilter('user')}
        >
          Users
        </button>
        <button 
          className={`filter-btn ${filter === 'content' ? 'active' : ''}`}
          onClick={() => setFilter('content')}
        >
          Content
        </button>
      </div>

      {showSettings && (
        <div className="notification-settings">
          <h4>Notification Preferences</h4>
          <div className="settings-grid">
            <label className="setting-toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
              System Alerts
            </label>
            <label className="setting-toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
              API Monitoring
            </label>
            <label className="setting-toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
              User Activity
            </label>
            <label className="setting-toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
              Content Moderation
            </label>
            <label className="setting-toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
              Email Notifications
            </label>
          </div>
        </div>
      )}

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No notifications</h3>
            <p>You're all caught up! New notifications will appear here.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h4 className="notification-title">{notification.title}</h4>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(notification.priority) }}
                  >
                    {notification.priority}
                  </span>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                <div className="notification-footer">
                  <span className="notification-time">
                    {new Date(notification.timestamp).toLocaleString()}
                  </span>
                  <span className="notification-category">{notification.category}</span>
                </div>
              </div>

              <div className="notification-actions">
                {!notification.read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="action-btn mark-read"
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notification.id)}
                  className="action-btn delete"
                  title="Delete notification"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="notifications-footer">
        <div className="footer-stats">
          <span>Total: {notifications.length}</span>
          <span>Unread: {unreadCount}</span>
          <span>High Priority: {notifications.filter(n => n.priority === 'high').length}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;