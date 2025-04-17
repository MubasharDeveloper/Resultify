// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDoc, Timestamp, getDocs, orderBy, updateDoc, setDoc, deleteDoc, doc, addDoc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAsFTFuUKY--TJP0kLylg3TEdT6SZaxEpQ",
  authDomain: "resultify-d20b7.firebaseapp.com",
  projectId: "resultify-d20b7",
  storageBucket: "resultify-d20b7.firebasestorage.app",
  messagingSenderId: "578967854929",
  appId: "1:578967854929:web:0804ae5d27f720bc9b3d70",
  measurementId: "G-FPCVTRFY6F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { analytics, auth, db, collection, query, where, getDoc, getDocs, Timestamp, updateDoc, setDoc, orderBy, deleteDoc, doc, addDoc };