// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_HQsNZ_MgU82t8eKnka3v3wnMZN7FMkg",
  authDomain: "lexoraproject.firebaseapp.com",
  projectId: "lexoraproject",
  storageBucket: "lexoraproject.firebasestorage.app",
  messagingSenderId: "958874712855",
  appId: "1:958874712855:web:eac33895009308a123d552",
  measurementId: "G-62XXEPN41N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firestore Collections
export const COLLECTIONS = {
  USERS: 'users',
  NOTES: 'notes',
  QUIZZES: 'quizzes',
  QUIZ_RESULTS: 'quizResults',
  AI_CHATS: 'aiChats',
  REPORTS: 'reports',
  SUGGESTIONS: 'suggestions',
  UPLOADS: 'uploads',
  ADMIN_SETTINGS: 'adminSettings'
};