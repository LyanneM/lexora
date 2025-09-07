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
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";

// Notes operations
export const notesService = {
  // Create a new note
  createNote: async (noteData) => {
    try {
      const docRef = await addDoc(collection(db, "notes"), {
        ...noteData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  },

  // Update an existing note
  updateNote: async (noteId, noteData) => {
    try {
      await updateDoc(doc(db, "notes", noteId), {
        ...noteData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  },

  // Get user's notes
  getUserNotes: async (userId) => {
    try {
      const q = query(
        collection(db, "notes"),
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

  // Get a specific note
  getNote: async (noteId) => {
    try {
      const docSnap = await getDoc(doc(db, "notes", noteId));
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
  // Create a new quiz
  createQuiz: async (quizData) => {
    try {
      const docRef = await addDoc(collection(db, "quizzes"), {
        ...quizData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating quiz:", error);
      throw error;
    }
  },

  // Get user's quizzes
  getUserQuizzes: async (userId) => {
    try {
      const q = query(
        collection(db, "quizzes"),
        where("owner", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting quizzes:", error);
      throw error;
    }
  }
};