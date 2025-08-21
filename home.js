import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, query, orderBy, startAt, endAt, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const meDiv = document.getElementById("me");
const resultsDiv = document.getElementById("results");
const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  const local = JSON.parse(localStorage.getItem("konvoUser") || "{}");
  meDiv.innerHTML = `
    <img src="${user.photoURL}" alt="me"/>
    <div class="name">${local.username || user.displayName || "(no username)"}</div>
    <div class="email" style="opacity:.7; font-size:.9rem">${user.email}</div>
  `;
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  localStorage.removeItem("konvoUser");
  window.location.href = "index.html";
});

async function runSearch() {
  resultsDiv.innerHTML = "Searching...";
  const term = (searchInput.value || "").trim().toLowerCase();
  if (!term) { resultsDiv.innerHTML = "Type a username or email to search."; return; }

  const usersRef = collection(db, "users");

  const q1 = query(usersRef, orderBy("usernameLower"), startAt(term), endAt(term + "\uf8ff"));
  const q2 = query(usersRef, orderBy("emailLower"), startAt(term), endAt(term + "\uf8ff"));

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const map = new Map();
  for (const s of [snap1, snap2]) {
    s.forEach(docSnap => {
      const d = docSnap.data();
      if (d.uid !== currentUser.uid) map.set(d.uid, d);
    });
  }

  if (map.size === 0) { resultsDiv.innerHTML = "No users found."; return; }

  resultsDiv.innerHTML = "";
  map.forEach((u) => {
    const item = document.createElement("div");
    item.className = "result";
    item.innerHTML = `
      <img src="${u.photoURL}" alt="">
      <div>
        <div style="font-weight:700">${u.username || "(no username)"}</div>
        <div style="opacity:.7; font-size:.9rem">${u.email}</div>
      </div>
    `;
    item.addEventListener("click", () => {
      window.location.href = `chat.html?uid=${encodeURIComponent(u.uid)}`;
    });
    resultsDiv.appendChild(item);
  });
}

searchBtn.addEventListener("click", runSearch);
searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });
