import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyABxF3nO6fVtgk-RQEwE5eYK5GKEt8diEI",
  authDomain: "ajou-project-cafd9.firebaseapp.com",
  projectId: "ajou-project-cafd9",
  storageBucket: "ajou-project-cafd9.firebasestorage.app",
  messagingSenderId: "926871086070",
  appId: "1:926871086070:web:9a01bad8170cb172f15dd7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;