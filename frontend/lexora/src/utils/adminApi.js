const API_BASE_URL = 'http://localhost:8000';

// Generic API call function
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Analytics API
export const analyticsApi = {
  getAnalytics: (range = '7d') => 
    apiCall(`/api/admin/analytics?range=${range}`),
};

// Users API
export const usersApi = {
  getUsers: () => apiCall('/api/admin/users'),
};

// Content Moderation API
export const contentApi = {
  getContent: (status = 'pending') => 
    apiCall(`/api/admin/content?status=${status}`),
  
  updateContentStatus: (contentId, status, notes = '') => 
    apiCall(`/api/admin/content/${contentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),
};

// Feedback API
export const feedbackApi = {
  getFeedback: (status = 'all') => 
    apiCall(`/api/admin/feedback?status=${status}`),
  
  updateFeedbackStatus: (feedbackId, status) => 
    apiCall(`/api/admin/feedback/${feedbackId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  
  sendReply: (feedbackId, message) => 
    apiCall(`/api/admin/feedback/${feedbackId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

// Notifications API
export const notificationsApi = {
  getNotifications: (filter = 'all') => 
    apiCall(`/api/admin/notifications?filter=${filter}`),
  
  markAsRead: (notificationId) => 
    apiCall(`/api/admin/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),
  
  markAllAsRead: () => 
    apiCall('/api/admin/notifications/mark-all-read', {
      method: 'PUT',
    }),
  
  deleteNotification: (notificationId) => 
    apiCall(`/api/admin/notifications/${notificationId}`, {
      method: 'DELETE',
    }),
  
  clearAll: () => 
    apiCall('/api/admin/notifications/clear-all', {
      method: 'DELETE',
    }),
};

export default apiCall;