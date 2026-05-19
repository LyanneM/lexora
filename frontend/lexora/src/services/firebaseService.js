// src/services/firebaseService.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db, COLLECTIONS } from "../firebase";

// Users operations
export const usersService = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  },

  // Get user by ID
  getUser: async (userId) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  },

  // Update user profile
  updateUser: async (userId, userData) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
};

// Notes operations
export const notesService = {
  createNote: async (noteData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.NOTES), {
        ...noteData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  },

  updateNote: async (noteId, noteData) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTES, noteId), {
        ...noteData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  },

  deleteNote: async (noteId) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.NOTES, noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  },

  getUserNotes: async (userId) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTES),
        where("owner", "==", userId),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting notes:", error);
      throw error;
    }
  },

  getNote: async (noteId) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.NOTES, noteId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting note:", error);
      throw error;
    }
  }
};

// Quizzes operations
export const quizzesService = {
  createQuiz: async (quizData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.QUIZZES), {
        ...quizData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating quiz:", error);
      throw error;
    }
  },

  getUserQuizzes: async (userId) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.QUIZZES),
        where("owner", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting quizzes:", error);
      throw error;
    }
  },

  getQuiz: async (quizId) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.QUIZZES, quizId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting quiz:", error);
      throw error;
    }
  },

  // Quiz results operations
  saveQuizResult: async (quizData) => {
    try {
      const docRef = await addDoc(collection(db, 'quizResults'), {
        ...quizData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  },

  // Get user's quiz results
  getUserQuizResults: async (userId) => {
    try {
      const q = query(
        collection(db, 'quizResults'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching user quiz results:', error);
      throw error;
    }
  },

  // Get specific quiz result
  getQuizResult: async (quizId) => {
    try {
      const docRef = doc(db, 'quizResults', quizId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching quiz result:', error);
      throw error;
    }
  },

  // Additional quiz methods
  saveQuizAttempt: async (quizData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.QUIZZES), {
        ...quizData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'completed',
        score: quizData.score || 0,
        totalQuestions: quizData.questions?.length || 0
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
      throw error;
    }
  },

  getQuizWithResults: async (quizId) => {
    try {
      const quizDoc = await getDoc(doc(db, COLLECTIONS.QUIZZES, quizId));
      if (!quizDoc.exists()) return null;

      const quizData = { id: quizDoc.id, ...quizDoc.data() };
      
      // Get results for this quiz
      const resultsQuery = query(
        collection(db, "quizResults"),
        where("quizId", "==", quizId),
        orderBy("createdAt", "desc")
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      const results = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        ...quizData,
        results: results
      };
    } catch (error) {
      console.error("Error getting quiz with results:", error);
      throw error;
    }
  }
};

// AI Chat operations
export const aiChatService = {
  createChat: async (chatData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.AI_CHATS), {
        ...chatData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  },

  getUserChats: async (userId) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.AI_CHATS),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting chats:", error);
      throw error;
    }
  }
};

// Reports operations (admin only)
export const reportsService = {
  createReport: async (reportData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.REPORTS), {
        ...reportData,
        createdAt: serverTimestamp(),
        status: "pending"
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  },

  getReports: async (userId = null) => {
    try {
      let q;
      if (userId) {
        q = query(
          collection(db, COLLECTIONS.REPORTS),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(
          collection(db, COLLECTIONS.REPORTS),
          orderBy("createdAt", "desc")
        );
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting reports:", error);
      throw error;
    }
  }
};

// Suggestions operations
export const suggestionsService = {
  createSuggestion: async (suggestionData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.SUGGESTIONS), {
        ...suggestionData,
        createdAt: serverTimestamp(),
        status: "pending"
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating suggestion:", error);
      throw error;
    }
  },

  getSuggestions: async (userId = null) => {
    try {
      let q;
      if (userId) {
        q = query(
          collection(db, COLLECTIONS.SUGGESTIONS),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(
          collection(db, COLLECTIONS.SUGGESTIONS),
          orderBy("createdAt", "desc")
        );
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting suggestions:", error);
      throw error;
    }
  }
};