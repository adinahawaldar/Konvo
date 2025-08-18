import { auth, provider, db } from "./firebase.js";
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginBtn = document.getElementById("login-btn");

loginBtn.addEventListener("click", async () => {
  const usernameRaw = (document.getElementById("username")?.value || "").trim();
  if (!usernameRaw) {
    alert("Please enter a username.");
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      username: usernameRaw,
      usernameLower: usernameRaw.toLowerCase(),
      email: user.email,
      emailLower: (user.email || "").toLowerCase(),
      photoURL: user.photoURL,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });

    localStorage.setItem("konvoUser", JSON.stringify({
      uid: user.uid, username: usernameRaw, email: user.email, photoURL: user.photoURL
    }));

    window.location.href = "home.html";
  } catch (e) {
    console.error(e);
    alert("Login failed: " + e.message);
  }
});
