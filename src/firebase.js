// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Make sure this line is here

const firebaseConfig = {
  apiKey: "AIzaSyA8XFSxrNRz1ZBxz4IO9LrbQv03f0iu_XA",
  authDomain: "todoapp-78228.firebaseapp.com",
  projectId: "todoapp-78228",
  storageBucket: "todoapp-78228.firebasestorage.app",
  messagingSenderId: "322557957651",
  appId: "1:322557957651:web:2e95544b70facfd65551e6"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app); // And make sure you export auth here