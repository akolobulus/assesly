import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration for the CLIENT, now from environment variables
const firebaseConfig = {
 apiKey: "AIzaSyAKL0prBfvDFFJIy_9-5wTSBuY8MKrnCT8",
  authDomain: "vet-it-technology.firebaseapp.com",
  projectId: "vet-it-technology",
  storageBucket: "vet-it-technology.firebasestorage.app",
  messagingSenderId: "550396477257",
  appId: "1:550396477257:web:747325f6c9f24515b12498",
  measurementId: "G-VJQK8098KL"
};


// Initialize Firebase for the CLIENT
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export client SDK instances
export { app, auth, db, storage };
