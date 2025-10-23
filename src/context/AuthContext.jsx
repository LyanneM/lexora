// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react"; // Add React import
import { auth, db, COLLECTIONS } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

// Admin configuration
const ADMIN_CONFIG = {
  allowedEmails: ["lyanne371@gmail.com"],
};

// Allowed domains for registration
const ALLOWED_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Validate email domain
  const validateEmailDomain = (email) => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1];
    return ALLOWED_DOMAINS.includes(domain);
  };

  // 🔹 Check if user can be admin
  const canBeAdmin = async (email) => {
    return ADMIN_CONFIG.allowedEmails.includes(email);
  };

  // 🔹 Initialize admin settings in Firestore
  const initializeAdminSettings = async () => {
    try {
      const adminSettingsDoc = await getDoc(doc(db, COLLECTIONS.ADMIN_SETTINGS, "config"));
      if (!adminSettingsDoc.exists()) {
        await setDoc(doc(db, COLLECTIONS.ADMIN_SETTINGS, "config"), {
          allowedAdminEmails: ADMIN_CONFIG.allowedEmails,
          initializedAt: serverTimestamp(),
        });
        console.log("Admin settings initialized");
      }
    } catch (error) {
      console.error("Error initializing admin settings:", error);
      // Don't throw error here, just log it
    }
  };

  // 🔹 Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);

        try {
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
          
          if (userDoc.exists()) {
            // Existing user - get their role
            const userData = userDoc.data();
            setRole(userData.role);
            
            // Update last login
            await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
              lastLogin: serverTimestamp()
            });
          } else {
            // New user
            const userRole = await canBeAdmin(user.email) ? "admin" : "user";
            
            await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
              email: user.email,
              role: userRole,
              name: user.displayName || "",
              photoURL: user.photoURL || "",
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            });
            
            setRole(userRole);
            console.log(`New user created with role: ${userRole}`);
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
          setRole("user");
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setRole(null);
      }
      setLoading(false);
    });

    // Initialize admin settings on app start 
    initializeAdminSettings();

    return unsubscribe;
  }, []);

  // 🔹 Register new user
  const register = async (email, password, role = "user") => {
    // Validate email domain
    if (!validateEmailDomain(email)) {
      throw new Error(`Email domain not allowed. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`);
    }

    // Check admin permissions
    if (role === "admin") {
      const canAdmin = await canBeAdmin(email);
      if (!canAdmin) {
        throw new Error("Admin registration not allowed for this email.");
      }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Determine final role
    const finalRole = role === "admin" && (await canBeAdmin(email)) ? "admin" : "user";

    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
      email: user.email,
      role: finalRole,
      name: "",
      photoURL: "",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    setCurrentUser(user);
    setRole(finalRole);
    setIsLoggedIn(true);

    return finalRole;
  };

  // 🔹 Login
  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res.user;

    // Update last login
    await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
      lastLogin: serverTimestamp()
    });

    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    const userRole = userDoc.exists() ? userDoc.data().role : "user";

    setRole(userRole);
    setCurrentUser(user);
    setIsLoggedIn(true);

    return userRole;
  };

  // 🔹 Google Sign-in
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    provider.addScope('email');
    provider.addScope('profile');

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Validate email domain for Google sign-in
      if (!validateEmailDomain(user.email)) {
        await signOut(auth);
        throw new Error(`Email domain not allowed. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`);
      }

      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));

      if (!userDoc.exists()) {
        // New user - create document with appropriate role
        const userRole = await canBeAdmin(user.email) ? "admin" : "user";
        
        await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
          email: user.email,
          role: userRole,
          name: user.displayName || "",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          provider: "google"
        });
        
        setRole(userRole);
      } else {
        // Existing user - update last login
        await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
          lastLogin: serverTimestamp(),
          photoURL: user.photoURL || userDoc.data().photoURL
        });
        
        setRole(userDoc.data().role);
      }

      return userDoc.exists() ? userDoc.data().role : "user";
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  // 🔹 Logout
  const logout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    setRole(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn,
      role,
      currentUser,
      register,
      login,
      logout,
      signInWithGoogle,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}