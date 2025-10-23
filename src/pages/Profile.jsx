// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usersService } from "../services/firebaseService";
import "../styles/profile.css";

function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [profileData, setProfileData] = useState({
    displayName: "",
    firstName: "",
    lastName: "",
    age: "",
    bio: "",
    interests: "",
    education: "",
    avatar: "",
    phone: "",
    location: ""
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const userDoc = await usersService.getUser(currentUser.uid);
        if (userDoc) {
          setProfileData({
            displayName: userDoc.displayName || "",
            firstName: userDoc.firstName || "",
            lastName: userDoc.lastName || "",
            age: userDoc.age || "",
            bio: userDoc.bio || "",
            interests: userDoc.interests || "",
            education: userDoc.education || "",
            avatar: userDoc.avatar || "",
            phone: userDoc.phone || "",
            location: userDoc.location || ""
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser]);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await usersService.updateUser(currentUser.uid, profileData);
      setMessage("Profile updated successfully!");

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({
          ...profileData,
          avatar: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
    }
    if (profileData.displayName) {
      return profileData.displayName.charAt(0).toUpperCase();
    }
    return currentUser?.email?.charAt(0).toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Your Profile</h2>
        <p>Manage your personal information and preferences</p>
      </div>

      <div className="profile-content">
        {/* Left Sidebar - Avatar & Basic Info */}
        <div className="profile-sidebar">
          <div className="avatar-section">
            <div className="avatar-preview">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Profile" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials()}
                </div>
              )}
            </div>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <button 
              className="change-avatar-btn"
              onClick={() => document.getElementById('avatar-upload').click()}
            >
              Change Photo
            </button>
            <small>JPG, PNG or GIF - Max 5MB</small>
          </div>

          <div className="profile-stats">
            <h4>Account Info</h4>
            <div className="stat-item">
              <span className="stat-label">Email:</span>
              <span className="stat-value">{currentUser?.email}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">User ID:</span>
              <span className="stat-value">{currentUser?.uid?.substring(0, 8)}...</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Member since:</span>
              <span className="stat-value">
                {currentUser?.metadata?.creationTime ? 
                  new Date(currentUser.metadata.creationTime).toLocaleDateString() : 
                  'Recently'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Main Content - Profile */}
        <div className="profile-main">
          <form onSubmit={handleSubmit} className="profile-form">
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={profileData.displayName}
                    onChange={handleChange}
                    placeholder="How you want to be called"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleChange}
                    placeholder="Your first name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="age">Age</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={profileData.age}
                    onChange={handleChange}
                    placeholder="Your age"
                    min="13"
                    max="120"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={profileData.location}
                    onChange={handleChange}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Education & Interests</h3>

              <div className="form-group">
                <label htmlFor="education">Education Level</label>
                <select
                  id="education"
                  name="education"
                  value={profileData.education}
                  onChange={handleChange}
                >
                  <option value="">Select education level</option>
                  <option value="high-school">High School</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                  <option value="post-graduate">Post Graduate</option>
                  <option value="professional">Professional</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="interests">Learning Interests</label>
                <input
                  type="text"
                  id="interests"
                  name="interests"
                  value={profileData.interests}
                  onChange={handleChange}
                  placeholder="e.g., Mathematics, Programming, History, Science, Languages"
                />
                <small>Separate interests with commas</small>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about your learning goals, background, or anything you'd like to share..."
                  rows="4"
                />
                <small>This will be visible to other learners in study groups</small>
              </div>
            </div>

            <div className="form-section">
              <h3>Contact Information</h3>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
                <small>Optional - for account recovery</small>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="save-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => window.history.back()}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;