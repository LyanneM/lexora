// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/register.css";

function Register() {
  const { register, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleParam = new URLSearchParams(location.search).get("role") || "user";

  // Redirect if trying to register as admin
  if (roleParam === "admin") {
    navigate("/login", { 
      state: { 
        error: "Admin registration is not allowed. Please contact an existing administrator." 
      } 
    });
    return null;
  }

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    age: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.includes("@")) {
      return setError("Invalid email address.");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (!formData.name.trim()) {
      return setError("Please enter your name.");
    }
    if (!formData.age || formData.age < 13 || formData.age > 120) {
      return setError("Please enter a valid age (13-120).");
    }

    setLoading(true);
    try {
      await register(formData.email, formData.password, {
        role: roleParam,
        name: formData.name,
        age: parseInt(formData.age),
      });
      // Redirect to login after successful registration
      navigate("/login", { state: { message: "Registration successful! Please log in." } });
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const role = await signInWithGoogle(roleParam);
      navigate(role === "admin" ? "/adminpanel" : "/dashboard");
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Register as {roleParam === "admin" ? "Admin" : "User"}</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="number"
              name="age"
              placeholder="Age"
              min="13"
              max="120"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="register-btn"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        <div className="divider">
          <span>Or</span>
        </div>
        
        <button 
          onClick={handleGoogleSignUp}
          className="google-btn"
          disabled={loading}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" />
          Sign up with Google
        </button>
        
        <p className="login-link">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}

export default Register;