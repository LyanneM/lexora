import { useState, useEffect } from 'react';
import '../styles/admin-settings.css';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'Math Learning Platform',
    platformDescription: 'Advanced mathematics learning with AI integration',
    maintenanceMode: false,
    allowRegistrations: true,
    maxQuizzesPerUser: 10,
    
    // Gemini API Settings
    geminiApiEnabled: true,
    geminiApiKey: '••••••••••••••••',
    geminiMaxRequests: 1000,
    geminiTimeout: 30,
    
    // Security Settings
    requireEmailVerification: true,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    
    // Notification Settings
    emailNotifications: true,
    adminAlerts: true,
    userNewsletter: false
  });

  const [activeSection, setActiveSection] = useState('platform');
  const [isSaving, setIsSaving] = useState(false);

  const sections = [
    { id: 'platform', name: 'Platform Settings', icon: '⚙️' },
    { id: 'api', name: 'API Configuration', icon: '🔌' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '📢' }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Settings saved:', settings);
    setIsSaving(false);
    alert('Settings saved successfully!');
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        platformName: 'Math Learning Platform',
        platformDescription: 'Advanced mathematics learning with AI integration',
        maintenanceMode: false,
        allowRegistrations: true,
        maxQuizzesPerUser: 10,
        geminiApiEnabled: true,
        geminiApiKey: '',
        geminiMaxRequests: 1000,
        geminiTimeout: 30,
        requireEmailVerification: true,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        emailNotifications: true,
        adminAlerts: true,
        userNewsletter: false
      });
    }
  };

  const renderPlatformSettings = () => (
    <div className="settings-section platform-settings">
      <h3>Platform Configuration</h3>
      <div className="setting-group">
        <label className="setting-label">
          Platform Name
          <input
            type="text"
            value={settings.platformName}
            onChange={(e) => handleSettingChange('platformName', e.target.value)}
            className="setting-input"
            placeholder="Enter platform name"
          />
        </label>

        <label className="setting-label">
          Platform Description
          <textarea
            value={settings.platformDescription}
            onChange={(e) => handleSettingChange('platformDescription', e.target.value)}
            className="setting-textarea"
            rows="3"
            placeholder="Describe your platform"
          />
        </label>

        <div className="setting-row">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            Maintenance Mode
          </label>
          <span className="setting-description">
            When enabled, only administrators can access the platform. Users will see a maintenance message.
          </span>
        </div>

        <div className="setting-row">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.allowRegistrations}
              onChange={(e) => handleSettingChange('allowRegistrations', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            Allow New Registrations
          </label>
          <span className="setting-description">
            Enable or disable new user registrations on the platform.
          </span>
        </div>

        <label className="setting-label">
          Maximum Quizzes Per User
          <input
            type="number"
            value={settings.maxQuizzesPerUser}
            onChange={(e) => handleSettingChange('maxQuizzesPerUser', parseInt(e.target.value))}
            className="setting-input"
            min="1"
            max="100"
          />
          <span className="setting-description">
            Set the maximum number of quizzes a user can create.
          </span>
        </label>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="settings-section api-settings">
      <h3>API Configuration</h3>
      <div className="setting-group">
        <div className="setting-row">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.geminiApiEnabled}
              onChange={(e) => handleSettingChange('geminiApiEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            Enable Gemini API
          </label>
          <span className="setting-description">
            Disable to stop all Gemini API calls and AI features.
          </span>
        </div>

        <label className="setting-label">
          Gemini API Key
          <input
            type="password"
            value={settings.geminiApiKey}
            onChange={(e) => handleSettingChange('geminiApiKey', e.target.value)}
            className="setting-input"
            placeholder="Enter your Gemini API key"
          />
          <span className="setting-description">
            Your secure Gemini API key for AI-powered features.
          </span>
        </label>

        <div className="setting-row">
          <label className="setting-label">
            Maximum Daily Requests
            <input
              type="number"
              value={settings.geminiMaxRequests}
              onChange={(e) => handleSettingChange('geminiMaxRequests', parseInt(e.target.value))}
              className="setting-input"
              min="100"
              max="10000"
            />
          </label>

          <label className="setting-label">
            API Timeout (seconds)
            <input
              type="number"
              value={settings.geminiTimeout}
              onChange={(e) => handleSettingChange('geminiTimeout', parseInt(e.target.value))}
              className="setting-input"
              min="5"
              max="120"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section security-settings">
      <h3>Security Settings</h3>
      <div className="setting-group">
        <div className="setting-row">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            Require Email Verification
          </label>
          <span className="setting-description">
            Users must verify their email address before accessing the platform.
          </span>
        </div>

        <label className="setting-label">
          Session Timeout (hours)
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
            className="setting-input"
            min="1"
            max="720"
          />
          <span className="setting-description">
            How long before users are automatically logged out for security.
          </span>
        </label>

        <label className="setting-label">
          Maximum Login Attempts
          <input
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
            className="setting-input"
            min="1"
            max="10"
          />
          <span className="setting-description">
            Number of failed login attempts before temporary account lockout.
          </span>
        </label>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section notifications-settings">
      <h3>Notification Settings</h3>
      <div className="setting-group">
        <div className="setting-row">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            Email Notifications
          </label>
          <span className="setting-description">
            Send email notifications for important events and updates.
          </span>
        </div>

        <div className="setting-row">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.adminAlerts}
              onChange={(e) => handleSettingChange('adminAlerts', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            Admin Alert Notifications
          </label>
          <span className="setting-description">
            Receive alerts for system issues, security events, and important updates.
          </span>
        </div>

        <div className="setting-row">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.userNewsletter}
              onChange={(e) => handleSettingChange('userNewsletter', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            User Newsletter
          </label>
          <span className="setting-description">
            Send monthly newsletter to users about new features and updates.
          </span>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'platform': return renderPlatformSettings();
      case 'api': return renderApiSettings();
      case 'security': return renderSecuritySettings();
      case 'notifications': return renderNotificationSettings();
      default: return renderPlatformSettings();
    }
  };

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h2>Platform Administration</h2>
        <p>Manage and configure your platform settings</p>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {sections.map(section => (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="sidebar-icon">{section.icon}</span>
              <span className="sidebar-name">{section.name}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {renderSectionContent()}
        </div>
      </div>

      <div className="settings-actions">
        <button 
          onClick={saveSettings}
          disabled={isSaving}
          className="save-btn"
        >
          {isSaving ? 'Saving Changes...' : 'Save Settings'}
        </button>
        <button 
          onClick={resetToDefaults}
          className="reset-btn"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;