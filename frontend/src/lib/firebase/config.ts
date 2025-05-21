// src/lib/firebase/config.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore'; // Example for Firestore
// import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Example for Storage

// Updated Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCF5nYszi-2lq7j_yBcQ4faHFzLm1K-blg",
  authDomain: "empathyai-wx82w.firebaseapp.com",
  projectId: "empathyai-wx82w",
  storageBucket: "empathyai-wx82w.firebasestorage.app",
  messagingSenderId: "413682015192",
  appId: "1:413682015192:web:a199aa1b144dfd81e7b0ad",
  measurementId: "" // This value is often optional, if you don't have it, an empty string or omitting it is fine.
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore; // Example for Firestore
// let storage: FirebaseStorage; // Example for Storage

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
firestore = getFirestore(app); // Example for Firestore
// storage = getStorage(app); // Example for Storage

export { app, auth, firestore /*, storage */ };
