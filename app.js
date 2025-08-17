import { auth, provider } from "./firebase.js";
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginBtn = document.getElementById("login-btn");

loginBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("User signed in:", user.displayName, user.email);

    localStorage.setItem("user", JSON.stringify(user));

    window.location.href = "home.html";   
  } catch (error) {
    console.error("Login failed:", error.message);
    alert("Login failed: " + error.message);
  }
});
