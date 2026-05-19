// src/utils/adminFirebaseService.js
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  orderBy,
  limit,
  where,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';

// Debug function to check collections
const debugCollections = async () => {
  try {
    console.log('📁 Checking available collections...');
    const collections = ['users', 'quizzes', 'feedback', 'settings'];
    
    for (const collName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collName));
        console.log(`✅ Collection "${collName}": ${snapshot.size} documents`);
        
        if (snapshot.size > 0) {
          snapshot.docs.slice(0, 2).forEach(doc => {
            console.log(`   Sample doc:`, { id: doc.id, ...doc.data() });
          });
        }
      } catch (error) {
        console.log(`❌ Collection "${collName}":`, error.message);
      }
    }
  } catch (error) {
    console.error('Debug error:', error);
  }
};

// Default settings
const defaultSettings = {
  platformName: 'StudyGenius',
  maintenanceMode: false,
  allowRegistrations: true,
  maxFileSize: 10,
  enableAnalytics: true,
  autoBackup: true,
  backupFrequency: 'daily',
  emailNotifications: true,
  maxUsers: 1000,
  sessionTimeout: 60,
  updatedAt: Timestamp.now(),
  updatedBy: 'system'
};

export const adminFirebaseService = {
  // Debug function - call this first
  debug: debugCollections,

  // Get all users - SIMPLIFIED VERSION
  async getUsers() {
    try {
      console.log('🔄 Fetching users...');
      const querySnapshot = await getDocs(collection(db, 'users'));
      console.log(`✅ Found ${querySnapshot.size} users`);
      
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('User data:', { id: doc.id, ...data });
        return {
          uid: doc.id,
          email: data.email || 'No email',
          displayName: data.displayName || 'No name',
          role: data.role || 'user',
          createdAt: data.createdAt || null,
          lastLogin: data.lastLogin || null,
          disabled: data.disabled || false,
          // Default values for now
          quizzesCreated: 0,
          lastActive: data.lastLogin || data.createdAt
        };
      });
      
      return users;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get platform statistics - SIMPLIFIED
  async getPlatformStats() {
    try {
      console.log('🔄 Fetching platform stats...');
      
      const [usersSnapshot, quizzesSnapshot, feedbackSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'quizzes')),
        getDocs(collection(db, 'feedback'))
      ]);
      
      console.log(`📊 Stats - Users: ${usersSnapshot.size}, Quizzes: ${quizzesSnapshot.size}, Feedback: ${feedbackSnapshot.size}`);
      
      // Simple active users calculation (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const activeUsers = usersSnapshot.docs.filter(userDoc => {
        const userData = userDoc.data();
        const lastActive = userData.lastLogin || userData.createdAt;
        return lastActive && lastActive.toDate() > sevenDaysAgo;
      }).length;

      // Today's new users
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = usersSnapshot.docs.filter(userDoc => {
        const userData = userDoc.data();
        return userData.createdAt && userData.createdAt.toDate() >= today;
      }).length;

      // Today's quizzes
      const quizzesToday = quizzesSnapshot.docs.filter(quizDoc => {
        const quizData = quizDoc.data();
        return quizData.createdAt && quizData.createdAt.toDate() >= today;
      }).length;

      return {
        totalUsers: usersSnapshot.size,
        totalQuizzes: quizzesSnapshot.size,
        totalFeedback: feedbackSnapshot.size,
        activeUsers,
        newUsersToday,
        quizzesToday
      };
    } catch (error) {
      console.error('❌ Error fetching platform stats:', error);
      // Return default stats instead of throwing
      return {
        totalUsers: 0,
        totalQuizzes: 0,
        totalFeedback: 0,
        activeUsers: 0,
        newUsersToday: 0,
        quizzesToday: 0
      };
    }
  },

  // Get quiz statistics - SIMPLIFIED
  async getQuizStats() {
    try {
      console.log('🔄 Fetching quiz stats...');
      const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
      
      console.log(`📝 Found ${quizzesSnapshot.size} quizzes`);
      
      // Count by subject
      const subjects = {};
      quizzesSnapshot.docs.forEach(doc => {
        const quizData = doc.data();
        const subject = quizData.subject || quizData.category || 'Uncategorized';
        subjects[subject] = (subjects[subject] || 0) + 1;
      });
      
      // Convert to array and sort
      const popularSubjects = Object.entries(subjects)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      console.log('📚 Popular subjects:', popularSubjects);
      
      return {
        totalQuizzes: quizzesSnapshot.size,
        popularSubjects
      };
    } catch (error) {
      console.error('❌ Error fetching quiz stats:', error);
      return {
        totalQuizzes: 0,
        popularSubjects: []
      };
    }
  },

  // Get all feedback - SIMPLIFIED
  async getFeedback() {
    try {
      console.log('🔄 Fetching feedback...');
      const q = query(
        collection(db, 'feedback'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      console.log(`💬 Found ${querySnapshot.size} feedback items`);
      
      const feedback = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userName: data.userName || data.displayName || 'Anonymous User',
          userEmail: data.userEmail || data.email || 'No email',
          message: data.message || data.feedback || 'No message',
          rating: data.rating || data.stars || 0,
          type: data.type || 'general',
          status: data.status || 'new',
          createdAt: data.createdAt || data.timestamp || Timestamp.now()
        };
      });
      
      return feedback;
    } catch (error) {
      console.error('❌ Error fetching feedback:', error);
      return [];
    }
  },

  // Get recent feedback
  async getRecentFeedback(limitCount = 3) {
    try {
      const q = query(
        collection(db, 'feedback'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching recent feedback:', error);
      return [];
    }
  },

  // Update user
  async updateUser(uid, updates) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete quiz
  async deleteQuiz(quizId) {
    try {
      await deleteDoc(doc(db, 'quizzes', quizId));
      return true;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },

  // Update feedback status
  async updateFeedbackStatus(feedbackId, status) {
    try {
      const feedbackRef = doc(db, 'feedback', feedbackId);
      await updateDoc(feedbackRef, {
        status,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  },

  // ============ SETTINGS MANAGEMENT ============

  // Get platform settings
  async getSettings() {
    try {
      console.log('🔄 Fetching platform settings...');
      const settingsRef = doc(db, 'settings', 'platform');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        console.log('✅ Settings found:', settingsDoc.data());
        return settingsDoc.data();
      } else {
        console.log('📝 No settings found, creating defaults...');
        // Create default settings if they don't exist
        await this.saveSettings(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
      // Return default settings if there's an error
      return defaultSettings;
    }
  },

  // Save platform settings
  async saveSettings(settings) {
    try {
      console.log('💾 Saving platform settings...', settings);
      const settingsRef = doc(db, 'settings', 'platform');
      
      const settingsWithMetadata = {
        ...settings,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin' // In a real app, you'd use the current admin's ID
      };
      
      await setDoc(settingsRef, settingsWithMetadata, { merge: true });
      console.log('✅ Settings saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      throw error;
    }
  },

  // Reset settings to defaults
  async resetSettings() {
    try {
      console.log('🔄 Resetting settings to defaults...');
      const settingsRef = doc(db, 'settings', 'platform');
      
      const defaultSettingsWithMetadata = {
        ...defaultSettings,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin',
        resetAt: Timestamp.now()
      };
      
      await setDoc(settingsRef, defaultSettingsWithMetadata);
      console.log('✅ Settings reset to defaults');
      return defaultSettingsWithMetadata;
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      throw error;
    }
  },

  // Get settings history (optional - for audit purposes)
  async getSettingsHistory(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'settings_history'),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching settings history:', error);
      return [];
    }
  },

  // Log settings change (for audit trail)
  async logSettingsChange(previousSettings, newSettings, changedBy) {
    try {
      const historyRef = doc(collection(db, 'settings_history'));
      await setDoc(historyRef, {
        previousSettings,
        newSettings,
        changedBy,
        changedAt: Timestamp.now(),
        changes: this.getSettingsChanges(previousSettings, newSettings)
      });
    } catch (error) {
      console.error('Error logging settings change:', error);
      // Don't throw error for logging failures
    }
  },

  // Helper to detect what changed
  getSettingsChanges(previous, current) {
    const changes = [];
    for (const key in current) {
      if (previous[key] !== current[key]) {
        changes.push({
          key,
          from: previous[key],
          to: current[key]
        });
      }
    }
    return changes;
  }
};