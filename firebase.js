// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDLN8XMKNZ6Tz3B-SKPWzE78a3q0z3sjaw",
  authDomain: "konvo-7408d.firebaseapp.com",
  projectId: "konvo-7408d",
  storageBucket: "konvo-7408d.appspot.com",
  messagingSenderId: "705515358733",
  appId: "1:705515358733:web:8c7432cc4dec7c7f28e344",
  measurementId: "G-Z8DN7LBF1D"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
