// src/components/AdminUserManager.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import "../styles/admin-user-manager.css";

function AdminUserManager() {
  const { createAdminAccount, isAdmin, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New admin form state
  const [newAdminData, setNewAdminData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    permissions: ["read", "write", "manage_users"]
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
    } catch (err) {
      setError("Failed to fetch users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newAdminData.password !== newAdminData.confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (newAdminData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    try {
      // Verify current user is admin
      const currentUserIsAdmin = await isAdmin();
      if (!currentUserIsAdmin) {
        throw new Error("Only admins can create admin accounts.");
      }

      await createAdminAccount(newAdminData.email, newAdminData.password, {
        name: newAdminData.name,
        permissions: newAdminData.permissions
      });

      setSuccess("Admin account created successfully!");
      setNewAdminData({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        permissions: ["read", "write", "manage_users"]
      });
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    setNewAdminData({
      ...newAdminData,
      [e.target.name]: e.target.value
    });
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isActive: !currentStatus
      });
      setSuccess("User status updated successfully!");
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError("Failed to update user status: " + err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="admin-user-manager">
      <h3>User Management</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Create New Admin Form */}
      <div className="create-admin-form">
        <h4>Create New Admin</h4>
        <form onSubmit={handleCreateAdmin}>
          <div className="form-row">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={newAdminData.name}
              onChange={handleInputChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={newAdminData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={newAdminData.password}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={newAdminData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="create-admin-btn">
            Create Admin Account
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="users-list">
        <h4>All Users</h4>
        <div className="users-table">
          <div className="table-header">
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {users.map(user => (
            <div key={user.id} className="table-row">
              <div>{user.name || "N/A"}</div>
              <div>{user.email}</div>
              <div>
                <span className={`role-badge ${user.role}`}>
                  {user.role}
                </span>
              </div>
              <div>
                <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                {user.id !== currentUser.uid && (
                  <button 
                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                    className="status-toggle-btn"
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminUserManager;