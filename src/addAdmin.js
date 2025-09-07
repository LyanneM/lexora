// addAdmin.js
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, setDoc, doc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  // Your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser(email, password, name) {
  try {
    // Create the user in Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Add user data to Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      role: "admin",
      name: name,
      createdAt: serverTimestamp(),
      isActive: true,
      permissions: ["read", "write", "manage_users"]
    });
    
    console.log(`Admin user ${email} created successfully with UID: ${user.uid}`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Usage: node addAdmin.js email password name
const args = process.argv.slice(2);
if (args.length === 3) {
  createAdminUser(args[0], args[1], args[2]);
} else {
  console.log("Usage: node addAdmin.js <email> <password> <name>");
}