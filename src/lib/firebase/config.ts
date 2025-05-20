// src/lib/firebase/config.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
// import { getFirestore, type Firestore } from 'firebase/firestore'; // Example for Firestore
// import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Example for Storage

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AlzaSyCF5nYszi-2lq7j_yBcQ4faHFzLm1K-blg",
  authDomain: "YOUR_AUTH_DOMAIN", // Needs to be filled after web app registration
  projectId: "empathyai-wx82w",
  storageBucket: "YOUR_STORAGE_BUCKET", // Needs to be filled after web app registration
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Needs to be filled after web app registration
  appId: "YOUR_APP_ID", // Needs to be filled after web app registration
  measurementId: "YOUR_MEASUREMENT_ID" // Optional, get this if available after web app registration
};

let app: FirebaseApp;
let auth: Auth;
// let firestore: Firestore; // Example for Firestore
// let storage: FirebaseStorage; // Example for Storage

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
// firestore = getFirestore(app); // Example for Firestore
// storage = getStorage(app); // Example for Storage

export { app, auth /*, firestore, storage */ };
