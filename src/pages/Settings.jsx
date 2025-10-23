// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/settings.css";

function Settings() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("appearance");

  const [settings, setSettings] = useState({
    theme: "light",
    transparentSidebar: false,
    emailNotifications: true,
    quizReminders: true,
    autoSave: true,
    language: "en",
    fontSize: "medium",
    reduceAnimations: false,
    highContrast: false,
    compactMode: false
  });


  useEffect(() => {
    const savedSettings = localStorage.getItem('lexora-settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      
      document.documentElement.setAttribute('data-theme', parsedSettings.theme);
    }
  }, []);

  const handleSettingChange = (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
    
 
    localStorage.setItem('lexora-settings', JSON.stringify(newSettings));
    
 
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }
    
    // Show instant changes
    if (['theme', 'fontSize', 'highContrast'].includes(key)) {
      setMessage(`${key.replace(/([A-Z])/g, ' $1')} updated!`);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Simulate saving settings to server
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage("All settings saved successfully! ✨");
      
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
  
    setMessage("Preparing your data export... 📦");
    setTimeout(() => {
      setMessage("Data export ready! Check your email. 📧");
    }, 1500);
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.")) {
      setMessage("Account deletion initiated. We're sorry to see you go! 😢");

    }
  };

  const resetToDefaults = () => {
    if (window.confirm("Reset all settings to default values?")) {
      const defaultSettings = {
        theme: "light",
        transparentSidebar: false,
        emailNotifications: true,
        quizReminders: true,
        autoSave: true,
        language: "en",
        fontSize: "medium",
        reduceAnimations: false,
        highContrast: false,
        compactMode: false
      };
      setSettings(defaultSettings);
      localStorage.setItem('lexora-settings', JSON.stringify(defaultSettings));
      document.documentElement.setAttribute('data-theme', 'light');
      setMessage("Settings reset to defaults! 🔄");
    }
  };

  const navItems = [
    { id: "appearance", label: "🎨 Appearance", icon: "" },
    { id: "notifications", label: "🔔 Notifications", icon: "" },
    { id: "accessibility", label: "♿ Accessibility", icon: "" },
    { id: "privacy", label: "🔒 Privacy & Security", icon: "" },
    { id: "account", label: "👤 Account", icon: "" }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="header-content">
          <h2>Settings</h2>
          <p>Customize your Lexora experience to fit your preferences</p>
        </div>
        <div className="header-actions">
          <button className="reset-btn" onClick={resetToDefaults}>
            🔄 Reset Defaults
          </button>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <div className="nav-indicator"></div>
              </button>
            ))}
          </nav>
          
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-email">{currentUser?.email}</span>
                <span className="user-status">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-main">
          <div className="settings-scroll">
            {message && (
              <div className="success-message">
                <span className="message-icon">✅</span>
                {message}
              </div>
            )}
            {error && (
              <div className="error-message">
                <span className="message-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Appearance Settings */}
            {activeSection === "appearance" && (
              <section className="settings-section">
                <div className="section-header">
                  <h3>🎨 Appearance</h3>
                  <p>Customize the look and feel of Lexora</p>
                </div>
                
                <div className="settings-grid">
                  <div className="setting-card">
                    <div className="setting-info">
                      <label className="setting-label">Theme</label>
                      <p className="setting-description">Choose your preferred color scheme</p>
                    </div>
                    <div className="setting-control">
                      <div className="theme-selector">
                        {['light', 'dark', 'auto'].map(theme => (
                          <button
                            key={theme}
                            className={`theme-option ${settings.theme === theme ? 'active' : ''}`}
                            onClick={() => handleSettingChange('theme', theme)}
                            data-theme={theme}
                          >
                            <div className="theme-preview">
                              <div className="preview-header"></div>
                              <div className="preview-content"></div>
                            </div>
                            <span className="theme-label">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="setting-card">
                    <div className="setting-info">
                      <label className="setting-label">Font Size</label>
                      <p className="setting-description">Adjust the text size for better readability</p>
                    </div>
                    <div className="setting-control">
                      <div className="font-size-selector">
                        {['small', 'medium', 'large'].map(size => (
                          <button
                            key={size}
                            className={`size-option ${settings.fontSize === size ? 'active' : ''}`}
                            onClick={() => handleSettingChange('fontSize', size)}
                          >
                            <span className={`size-preview ${size}`}>Aa</span>
                            <span className="size-label">{size.charAt(0).toUpperCase() + size.slice(1)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="setting-card">
                    <div className="setting-info">
                      <label className="setting-label">Layout Options</label>
                      <p className="setting-description">Customize the interface layout</p>
                    </div>
                    <div className="setting-control">
                      <div className="toggle-group">
                        <div className="toggle-item">
                          <label>Compact Mode</label>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.compactMode}
                              onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                        <div className="toggle-item">
                          <label>Transparent Sidebar</label>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={settings.transparentSidebar}
                              onChange={(e) => handleSettingChange('transparentSidebar', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Notification Settings */}
            {activeSection === "notifications" && (
              <section className="settings-section">
                <div className="section-header">
                  <h3>🔔 Notifications</h3>
                  <p>Manage how and when you receive notifications</p>
                </div>
                
                <div className="settings-grid">
                  <div className="setting-card">
                    <div className="setting-info">
                      <label className="setting-label">Email Notifications</label>
                      <p className="setting-description">Receive updates and summaries via email</p>
                    </div>
                    <div className="setting-control">
                      <label className="toggle-switch large">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="setting-card">
                    <div className="setting-info">
                      <label className="setting-label">Quiz Reminders</label>
                      <p className="setting-description">Get reminders for pending quizzes and reviews</p>
                    </div>
                    <div className="setting-control">
                      <label className="toggle-switch large">
                        <input
                          type="checkbox"
                          checked={settings.quizReminders}
                          onChange={(e) => handleSettingChange('quizReminders', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Accessibility Settings */}
            {activeSection === "accessibility" && (
              <section className="settings-section">
                <div className="section-header">
                  <h3>♿ Accessibility</h3>
                  <p>Make Lexora more comfortable to use</p>
                </div>
                
                <div className="settings-grid">
                  <div className="setting-card">
                    <div className="setting-info">
                      <label className="setting-label">Reduce Animations</label>
                      <p className="setting-description">Minimize motion and animations throughout the app</p>
                    </div>
                    <div className="setting-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.reduceAnimations}
                          onChange={(e) => handleSettingChange('reduceAnimations', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="setting-card">
                    <div className="setting-info">
                      <label className="setting-label">High Contrast Mode</label>
                      <p className="setting-description">Increase color contrast for better visibility</p>
                    </div>
                    <div className="setting-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.highContrast}
                          onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Privacy & Security */}
            {activeSection === "privacy" && (
              <section className="settings-section">
                <div className="section-header">
                  <h3>🔒 Privacy & Security</h3>
                  <p>Control your data and privacy settings</p>
                </div>
                
                <div className="settings-grid">
                  <div className="setting-card">
                    <div className="setting-info">
                      <label className="setting-label">Auto-save Notes</label>
                      <p className="setting-description">Automatically save notes as you type</p>
                    </div>
                    <div className="setting-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.autoSave}
                          onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="setting-card action-card">
                    <div className="setting-info">
                      <label className="setting-label">Data Export</label>
                      <p className="setting-description">Download all your data in a portable format</p>
                    </div>
                    <div className="setting-control">
                      <button className="action-btn secondary" onClick={handleExportData}>
                        📦 Export My Data
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Account Settings */}
            {activeSection === "account" && (
              <section className="settings-section">
                <div className="section-header">
                  <h3>👤 Account</h3>
                  <p>Manage your account preferences</p>
                </div>
                
                <div className="settings-grid">
                  <div className="setting-card">
                    <div className="setting-info">
                      <label className="setting-label">Language</label>
                      <p className="setting-description">Interface language preference</p>
                    </div>
                    <div className="setting-control">
                      <select 
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="setting-select"
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="es">🇪🇸 Spanish</option>
                        <option value="fr">🇫🇷 French</option>
                        <option value="de">🇩🇪 German</option>
                        <option value="zh">🇨🇳 Chinese</option>
                      </select>
                    </div>
                  </div>

                  <div className="setting-card action-card dangerous">
                    <div className="setting-info">
                      <label className="setting-label">Account Actions</label>
                      <p className="setting-description">Manage your account session and data</p>
                    </div>
                    <div className="setting-control">
                      <div className="action-group">
                        <button className="action-btn warning" onClick={logout}>
                          🚪 Log Out
                        </button>
                        <button className="action-btn danger" onClick={handleDeleteAccount}>
                          🗑️ Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="settings-footer">
            <button 
              className="save-settings-btn"
              onClick={handleSaveSettings}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Saving...
                </>
              ) : (
                "💾 Save All Settings"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;