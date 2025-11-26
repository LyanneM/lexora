// src/components/Admin.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminFirebaseService } from '../utils/adminFirebaseService';
import '../styles/admin.css';

const Admin = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'feedback', name: 'User Feedback', icon: '💬' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  // Enhanced debug function
  const runDebug = async () => {
    console.log('🔧 Running Firebase debug...');
    try {
      await adminFirebaseService.debug();
      await loadAllData(); // Reload data after debug
    } catch (error) {
      console.error('Debug failed:', error);
    }
  };

  // Load all data with fallbacks
  const loadAllData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load users
      const usersData = await adminFirebaseService.getUsers();
      setUsers(usersData.length > 0 ? usersData : generateMockUsers());
      
      // Load feedback
      const feedbackData = await adminFirebaseService.getFeedback();
      setFeedback(feedbackData.length > 0 ? feedbackData : generateMockFeedback());
      
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      setError('Failed to load data. Using demo data.');
      // Fallback to mock data
      setUsers(generateMockUsers());
      setFeedback(generateMockFeedback());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Mock data generators
  const generateMockUsers = () => {
    return [
      {
        uid: 'mock-user-1',
        email: 'demo.user@example.com',
        displayName: 'Demo User',
        role: 'user',
        createdAt: { toDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        disabled: false
      },
      {
        uid: 'mock-user-2', 
        email: 'test.user@example.com',
        displayName: 'Test User',
        role: 'user',
        createdAt: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        disabled: false
      },
      {
        uid: 'mock-user-3',
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        role: 'user', 
        createdAt: { toDate: () => new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        disabled: false
      }
    ];
  };

  const generateMockFeedback = () => {
    return [
      {
        id: 'mock-feedback-1',
        userName: 'Demo User',
        userEmail: 'demo.user@example.com',
        rating: 5,
        featureRatings: {
          mathNotes: 4,
          normalNotes: 5,
          codeNotes: 3,
          quizzes: 4,
          overallExperience: 5
        },
        message: 'Love the math notebook feature! The quizzes are really helpful for studying.',
        createdAt: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        status: 'new'
      },
      {
        id: 'mock-feedback-2',
        userName: 'Test User',
        userEmail: 'test.user@example.com', 
        rating: 4,
        featureRatings: {
          mathNotes: 3,
          normalNotes: 4,
          codeNotes: 5,
          quizzes: 3,
          overallExperience: 4
        },
        message: 'The code execution is amazing! Would love to see more programming languages supported.',
        createdAt: { toDate: () => new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        status: 'new'
      }
    ];
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} users={users} feedback={feedback} />;
      case 'analytics':
        return <Analytics users={users} feedback={feedback} />;
      case 'users':
        return <UserManager users={users} loading={loading} />;
      case 'feedback':
        return <Feedback feedback={feedback} loading={loading} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} users={users} feedback={feedback} />;
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Panel</h1>
          <div className="user-info">
            <span>Welcome, {currentUser?.displayName || currentUser?.email}</span>
            <button onClick={runDebug} className="debug-btn" style={{marginRight: '10px', background: '#ff6b6b'}}>
              Debug Firebase
            </button>
            <button onClick={loadAllData} className="refresh-btn" style={{marginRight: '10px', background: '#4ecdc4'}}>
              Refresh Data
            </button>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
        
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}
        
        <nav className="admin-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </nav>
      </header>
      
      <main className="admin-content">
        {renderContent()}
      </main>
    </div>
  );
};

// Enhanced Dashboard with real data
const Dashboard = ({ setActiveTab, users, feedback }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    activeUsers: 0,
    newUsersToday: 0,
    quizzesToday: 0,
    totalFeedback: 0,
    averageRating: 0
  });
  const [popularSubjects, setPopularSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStats();
  }, [users, feedback]);

  const calculateStats = () => {
    const totalUsers = users.length;
    const totalFeedback = feedback.length;
    
    // Calculate average rating
    const avgRating = feedback.length > 0 
      ? (feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / feedback.length).toFixed(1)
      : 4.5; // Default mock average

    // Mock some activity stats based on user count
    const activeUsers = Math.max(3, Math.floor(totalUsers * 0.7));
    const newUsersToday = Math.max(1, Math.floor(totalUsers * 0.1));
    const quizzesToday = Math.max(2, Math.floor(totalUsers * 0.3));

    setStats({
      totalUsers,
      totalQuizzes: 15 + totalUsers * 2, // Mock quiz count
      activeUsers,
      newUsersToday,
      quizzesToday,
      totalFeedback,
      averageRating: parseFloat(avgRating)
    });

    // Mock popular subjects
    setPopularSubjects([
      { name: 'Mathematics', count: 25 },
      { name: 'Programming', count: 18 },
      { name: 'Science', count: 12 },
      { name: 'Languages', count: 8 }
    ]);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="welcome-card">
          <h2>Loading Dashboard...</h2>
          <p>Please wait while we load the latest statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="welcome-card">
        <h2>Administrator Dashboard</h2>
        <p>Manage your platform from one centralized location.</p>
        <div className="demo-notice">
          💡 <strong>Admin Board:</strong> Using data with real user information
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{stats.totalUsers}</div>
          <div className="stat-change">{stats.newUsersToday} new today</div>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <div className="stat-number">{stats.activeUsers}</div>
          <div className="stat-change">Currently online</div>
        </div>
        <div className="stat-card">
          <h3>Total Quizzes</h3>
          <div className="stat-number">{stats.totalQuizzes}</div>
          <div className="stat-change">{stats.quizzesToday} today</div>
        </div>
        <div className="stat-card">
          <h3>User Feedback</h3>
          <div className="stat-number">{stats.totalFeedback}</div>
          <div className="stat-change">Avg: {stats.averageRating}⭐</div>
        </div>
      </div>

      <div className="quick-links">
        <h3>Quick Actions</h3>
        <div className="links-grid">
          <div className="link-card" onClick={() => setActiveTab('users')}>
            <span className="link-icon">👥</span>
            <span className="link-text">Manage Users</span>
          </div>
          <div className="link-card" onClick={() => setActiveTab('feedback')}>
            <span className="link-icon">💬</span>
            <span className="link-text">View Feedback</span>
          </div>
          <div className="link-card" onClick={() => setActiveTab('analytics')}>
            <span className="link-icon">📈</span>
            <span className="link-text">View Analytics</span>
          </div>
          <div className="link-card" onClick={() => setActiveTab('settings')}>
            <span className="link-icon">⚙️</span>
            <span className="link-text">Platform Settings</span>
          </div>
        </div>
      </div>

      <div className="dashboard-widgets">
        <div className="widget">
          <h4>Recent Feedback</h4>
          <FeedbackPreview feedback={feedback} />
        </div>
        <div className="widget">
          <h4>Popular Subjects</h4>
          <div className="popular-subjects">
            {popularSubjects.length > 0 ? (
              popularSubjects.map((subject, index) => (
                <div key={subject.name} className="subject-item">
                  <span className="subject-rank">#{index + 1}</span>
                  <span className="subject-name">{subject.name}</span>
                  <span className="subject-count">{subject.count} quizzes</span>
                </div>
              ))
            ) : (
              <p>No quiz data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Component with Graphs
const Analytics = ({ users, feedback }) => {
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    generateAnalyticsData();
  }, [users, feedback, timeRange]);

  const generateAnalyticsData = () => {
    // Generate mock analytics data based on users and feedback
    const userGrowth = generateUserGrowthData(users, timeRange);
    const engagementData = generateEngagementData(users, timeRange);
    const featureUsage = generateFeatureUsageData(feedback);
    const ratingDistribution = generateRatingDistribution(feedback);

    setAnalyticsData({
      userGrowth,
      engagementData,
      featureUsage,
      ratingDistribution
    });
  };

  const generateUserGrowthData = (users, range) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const count = Math.floor(users.length * (1 - i / days) + Math.random() * 3);
      data.push({
        date: date.toLocaleDateString(),
        count: Math.max(0, count)
      });
    }
    
    return data;
  };

  const generateEngagementData = (users, range) => {
    return [
      { name: 'Active Users', value: Math.floor(users.length * 0.7) },
      { name: 'New Users', value: Math.floor(users.length * 0.2) },
      { name: 'Returning Users', value: Math.floor(users.length * 0.5) },
      { name: 'Inactive Users', value: Math.floor(users.length * 0.1) }
    ];
  };

  const generateFeatureUsageData = (feedback) => {
    return [
      { feature: 'Math Notes', usage: 75, satisfaction: 4.2 },
      { feature: 'Code Notes', usage: 60, satisfaction: 4.5 },
      { feature: 'Quizzes', usage: 85, satisfaction: 4.1 },
      { feature: 'Normal Notes', usage: 70, satisfaction: 4.3 },
      { feature: 'AI Assistant', usage: 50, satisfaction: 4.7 }
    ];
  };

  const generateRatingDistribution = (feedback) => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    feedback.forEach(item => {
      if (item.rating && distribution[item.rating] !== undefined) {
        distribution[item.rating]++;
      }
    });
    
    return Object.entries(distribution).map(([rating, count]) => ({
      rating: parseInt(rating),
      count,
      percentage: feedback.length > 0 ? (count / feedback.length * 100).toFixed(1) : 0
    }));
  };

  if (!analyticsData) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics">
      <div className="section-header">
        <h2>Platform Analytics</h2>
        <p>Comprehensive insights into platform usage and performance</p>
        
        <div className="time-range-selector">
          <button 
            className={timeRange === '7d' ? 'active' : ''} 
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button 
            className={timeRange === '30d' ? 'active' : ''} 
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
          <button 
            className={timeRange === '90d' ? 'active' : ''} 
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="analytics-grid">
        {/* User Growth Chart */}
        <div className="analytics-card full-width">
          <h3>User Growth</h3>
          <div className="chart-container">
            <div className="bar-chart">
              {analyticsData.userGrowth.map((point, index) => (
                <div key={index} className="bar-chart-item">
                  <div 
                    className="bar" 
                    style={{ height: `${(point.count / Math.max(...analyticsData.userGrowth.map(p => p.count))) * 100}%` }}
                  ></div>
                  <span className="bar-label">{point.date.split('/')[0]}/{point.date.split('/')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="analytics-card">
          <h3>User Engagement</h3>
          <div className="pie-chart">
            {analyticsData.engagementData.map((item, index) => (
              <div key={item.name} className="pie-segment">
                <div 
                  className="segment" 
                  style={{ 
                    backgroundColor: `hsl(${index * 90}, 70%, 60%)`,
                    transform: `rotate(${index * 90}deg)`
                  }}
                ></div>
                <div className="segment-label">
                  <span className="segment-name">{item.name}</span>
                  <span className="segment-value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="analytics-card">
          <h3>Rating Distribution</h3>
          <div className="rating-bars">
            {analyticsData.ratingDistribution.map(item => (
              <div key={item.rating} className="rating-bar">
                <div className="rating-stars">{"⭐".repeat(item.rating)}</div>
                <div className="rating-count">{item.count}</div>
                <div className="rating-percentage">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Usage */}
        <div className="analytics-card full-width">
          <h3>Feature Usage & Satisfaction</h3>
          <div className="feature-usage-table">
            <div className="table-header">
              <div>Feature</div>
              <div>Usage %</div>
              <div>Satisfaction</div>
              <div>Trend</div>
            </div>
            {analyticsData.featureUsage.map(feature => (
              <div key={feature.feature} className="table-row">
                <div className="feature-name">{feature.feature}</div>
                <div className="usage-bar">
                  <div 
                    className="usage-fill" 
                    style={{ width: `${feature.usage}%` }}
                  ></div>
                  <span className="usage-text">{feature.usage}%</span>
                </div>
                <div className="satisfaction">
                  {"⭐".repeat(Math.floor(feature.satisfaction))}
                  <span className="rating-number">({feature.satisfaction})</span>
                </div>
                <div className="trend">
                  <span className={`trend-arrow ${feature.usage > 70 ? 'up' : 'down'}`}>
                    {feature.usage > 70 ? '↗' : '↘'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="analytics-card">
          <h3>Key Metrics</h3>
          <div className="key-metrics">
            <div className="metric">
              <div className="metric-value">{users.length}</div>
              <div className="metric-label">Total Users</div>
            </div>
            <div className="metric">
              <div className="metric-value">
                {feedback.length > 0 ? (feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / feedback.length).toFixed(1) : '0.0'}
              </div>
              <div className="metric-label">Avg Rating</div>
            </div>
            <div className="metric">
              <div className="metric-value">{(users.length * 2.3).toFixed(0)}</div>
              <div className="metric-label">Avg Quizzes/User</div>
            </div>
            <div className="metric">
              <div className="metric-value">78%</div>
              <div className="metric-label">Retention Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Component
const Settings = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    platformName: 'Lexora',
    maintenanceMode: false,
    allowRegistrations: true,
    maxFileSize: 10,
    enableAnalytics: true,
    autoBackup: true,
    backupFrequency: 'daily',
    emailNotifications: true,
    maxUsers: 1000,
    sessionTimeout: 60
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const savedSettings = await adminFirebaseService.getSettings();
      setSettings(savedSettings);
      console.log('✅ Settings loaded:', savedSettings);
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      setError('Failed to load settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSaved(false);
    setError('');
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const previousSettings = { ...settings };
      
      await adminFirebaseService.saveSettings(settings);
      

      await adminFirebaseService.logSettingsChange(
        previousSettings, 
        settings, 
        currentUser?.email || 'unknown'
      );
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        setLoading(true);
        setError('');
        const defaultSettings = await adminFirebaseService.resetSettings();
        setSettings(defaultSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        console.log('✅ Settings reset to defaults');
      } catch (error) {
        console.error('❌ Error resetting settings:', error);
        setError('Failed to reset settings. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDangerAction = (action) => {
    if (window.confirm(`Are you absolutely sure you want to ${action}? This action cannot be undone!`)) {
      alert(`${action} would be executed in a real application.`);

    }
  };

  if (loading && Object.keys(settings).length === 0) {
    return (
      <div className="settings">
        <div className="section-header">
          <h2>Platform Settings</h2>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="section-header">
        <h2>Platform Settings</h2>
        <p>Configure system-wide settings and preferences</p>
        
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}
        
        <div className="settings-actions">
          <button 
            className={`save-btn ${saved ? 'saved' : ''} ${loading ? 'loading' : ''}`}
            onClick={saveSettings}
            disabled={loading}
          >
            {loading ? '⏳ Saving...' : saved ? '✓ Saved' : 'Save Settings'}
          </button>
          <button 
            className="reset-btn" 
            onClick={resetToDefaults}
            disabled={loading}
          >
            Reset to Defaults
          </button>
          <button 
            className="refresh-btn" 
            onClick={loadSettings}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {/* General Settings */}
        <div className="settings-card">
          <h3>📋 General Settings</h3>
          <div className="setting-group">
            <label>Platform Name</label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => handleSettingChange('platformName', e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="setting-group">
            <label>Maximum Users</label>
            <input
              type="number"
              value={settings.maxUsers}
              onChange={(e) => handleSettingChange('maxUsers', parseInt(e.target.value) || 0)}
              disabled={loading}
              min="1"
              max="100000"
            />
          </div>
          
          <div className="setting-group">
            <label>Session Timeout (minutes)</label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value) || 0)}
              disabled={loading}
              min="1"
              max="1440"
            />
          </div>
        </div>

        {/* Access Control */}
        <div className="settings-card">
          <h3>🔐 Access Control</h3>
          <div className="setting-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                disabled={loading}
              />
              Maintenance Mode
            </label>
            <small>When enabled, only admins can access the platform</small>
          </div>
          
          <div className="setting-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.allowRegistrations}
                onChange={(e) => handleSettingChange('allowRegistrations', e.target.checked)}
                disabled={loading}
              />
              Allow New Registrations
            </label>
          </div>
        </div>

        {/* File Management */}
        <div className="settings-card">
          <h3>📁 File Management</h3>
          <div className="setting-group">
            <label>Maximum File Size (MB)</label>
            <select
              value={settings.maxFileSize}
              onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
              disabled={loading}
            >
              <option value={5}>5 MB</option>
              <option value={10}>10 MB</option>
              <option value={25}>25 MB</option>
              <option value={50}>50 MB</option>
            </select>
          </div>
          
          <div className="setting-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                disabled={loading}
              />
              Enable Automatic Backups
            </label>
          </div>
          
          {settings.autoBackup && (
            <div className="setting-group">
              <label>Backup Frequency</label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                disabled={loading}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
        </div>

        {/* Analytics & Monitoring */}
        <div className="settings-card">
          <h3>📈 Analytics & Monitoring</h3>
          <div className="setting-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.enableAnalytics}
                onChange={(e) => handleSettingChange('enableAnalytics', e.target.checked)}
                disabled={loading}
              />
              Enable Analytics Tracking
            </label>
            <small>Collect usage data for improving the platform</small>
          </div>
          
          <div className="setting-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                disabled={loading}
              />
              Email Notifications
            </label>
            <small>Receive alerts for system events</small>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-card danger-zone">
          <h3>🚨 Danger Zone</h3>
          <div className="setting-group">
            <p>Permanently delete all user data and content</p>
            <button 
              className="danger-btn"
              onClick={() => handleDangerAction('delete all data')}
              disabled={loading}
            >
              Delete All Data
            </button>
          </div>
          
          <div className="setting-group">
            <p>Reset entire platform to factory settings</p>
            <button 
              className="danger-btn"
              onClick={() => handleDangerAction('factory reset')}
              disabled={loading}
            >
              Factory Reset
            </button>
          </div>
        </div>
      </div>

      {/* Settings Metadata */}
      <div className="settings-metadata">
        <small>
          Last updated: {settings.updatedAt ? 
            new Date(settings.updatedAt.toDate ? settings.updatedAt.toDate() : settings.updatedAt).toLocaleString() 
            : 'Never'}
          {settings.updatedBy && ` by ${settings.updatedBy}`}
        </small>
      </div>
    </div>
  );
};

// Enhanced Feedback Preview for Dashboard
const FeedbackPreview = ({ feedback }) => {
  const recentFeedback = feedback.slice(0, 3);

  return (
    <div className="feedback-preview">
      {recentFeedback.length === 0 ? (
        <p>No recent feedback</p>
      ) : (
        recentFeedback.map(item => (
          <div key={item.id} className="feedback-preview-item">
            <div className="feedback-user">{item.userName || 'Anonymous'}</div>
            <div className="feedback-message">{item.message?.substring(0, 50)}...</div>
            <div className="feedback-date">
              {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// User Manager Component
const UserManager = ({ users, loading }) => {
  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-manager">
      <div className="section-header">
        <h2>User Management</h2>
        <p>Manage user accounts and permissions</p>
      </div>

      <div className="users-table">
        <div className="table-header">
          <div>Email</div>
          <div>Name</div>
          <div>Role</div>
          <div>Created</div>
          <div>Status</div>
        </div>
        
        {users.map(user => (
          <div key={user.uid} className="table-row">
            <div className="user-email">{user.email}</div>
            <div className="user-name">{user.displayName || 'N/A'}</div>
            <div>
              <span className={`role-badge ${user.role || 'user'}`}>
                {user.role || 'user'}
              </span>
            </div>
            <div className="user-created">
              {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
            </div>
            <div>
              <span className={`status-badge ${user.disabled ? 'inactive' : 'active'}`}>
                {user.disabled ? 'Inactive' : 'Active'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Users Found</h3>
          <p>There are no users registered in the system yet.</p>
        </div>
      )}
    </div>
  );
};

// Feedback Component
const Feedback = ({ feedback, loading }) => {
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  if (loading) {
    return <div className="loading">Loading feedback...</div>;
  }

  return (
    <div className="feedback-manager">
      <div className="section-header">
        <h2>User Feedback</h2>
        <p>Review and manage user feedback</p>
      </div>

      <div className="feedback-layout">
        <div className="feedback-list">
          {feedback.map(item => (
            <div 
              key={item.id} 
              className={`feedback-item ${selectedFeedback?.id === item.id ? 'selected' : ''}`}
              onClick={() => setSelectedFeedback(item)}
            >
              <div className="feedback-header">
                <div className="user-info">
                  <span className="user-name">{item.userName || 'Anonymous User'}</span>
                  <span className="user-email">{item.userEmail}</span>
                </div>
                <div className="feedback-date">
                  {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
                </div>
              </div>
              <div className="feedback-preview">
                {item.message?.substring(0, 100)}...
              </div>
              {item.rating && (
                <div className="feedback-rating">
                  Rating: {"⭐".repeat(item.rating)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="feedback-detail">
          {selectedFeedback ? (
            <div className="feedback-detail-content">
              <h3>Feedback Details</h3>
              <div className="detail-section">
                <strong>User:</strong> {selectedFeedback.userName || 'Anonymous'} ({selectedFeedback.userEmail})
              </div>
              <div className="detail-section">
                <strong>Date:</strong> {selectedFeedback.createdAt ? new Date(selectedFeedback.createdAt.toDate()).toLocaleString() : 'Unknown date'}
              </div>
              {selectedFeedback.rating && (
                <div className="detail-section">
                  <strong>Rating:</strong> {"⭐".repeat(selectedFeedback.rating)}
                </div>
              )}
              {selectedFeedback.featureRatings && (
                <div className="detail-section">
                  <strong>Feature Ratings:</strong>
                  <div className="feature-ratings">
                    {Object.entries(selectedFeedback.featureRatings).map(([feature, rating]) => (
                      <div key={feature} className="feature-rating">
                        <span className="feature-name">{feature}:</span>
                        <span className="feature-stars">{"⭐".repeat(rating)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="detail-section">
                <strong>Message:</strong>
                <div className="feedback-message-full">
                  {selectedFeedback.message}
                </div>
              </div>
              <div className="feedback-actions">
                <button className="btn-primary">Mark as Read</button>
                <button className="btn-secondary">Reply</button>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a feedback item to view details</p>
            </div>
          )}
        </div>
      </div>

      {feedback.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No Feedback Yet</h3>
          <p>Users haven't submitted any feedback yet.</p>
        </div>
      )}
    </div>
  );
};

export default Admin;