// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);

        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          setRole(docSnap.exists() ? docSnap.data().role : "user");
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole("user");
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🔹 Register new user
  const register = async (email, password, role = "user") => {
    if (role === "admin") {
      throw new Error("Admin registration not allowed here.");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role,
      createdAt: serverTimestamp(),
    });

    setCurrentUser(user);
    setRole(role);
    setIsLoggedIn(true);

    return role;
  };

  // 🔹 Login
  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res.user;

    const docSnap = await getDoc(doc(db, "users", user.uid));
    const userRole = docSnap.exists() ? docSnap.data().role : "user";

    setRole(userRole);
    setCurrentUser(user);
    setIsLoggedIn(true);

    return userRole;
  };

  // 🔹 Google Sign-in
  const signInWithGoogle = async (role = "user") => {
    if (role === "admin") {
      throw new Error("Admin signup not allowed via Google.");
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const docSnap = await getDoc(doc(db, "users", user.uid));

    if (!docSnap.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role,
        name: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
    }

    setRole(docSnap.exists() ? docSnap.data().role : role);
    setCurrentUser(user);
    setIsLoggedIn(true);

    return role;
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
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
