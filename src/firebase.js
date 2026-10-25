import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
apiKey: "AIzaSyBtwzyZE7gIOXk1fzamSkK36uZMePICsiY",
  authDomain: "devdirectory-35e77.firebaseapp.com",
  projectId: "devdirectory-35e77",
  storageBucket: "devdirectory-35e77.firebasestorage.app",
  messagingSenderId: "644377916148",
  appId: "1:644377916148:web:699817d682d2304f5164a1",
  measurementId: "G-8NJE0GD04F"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
