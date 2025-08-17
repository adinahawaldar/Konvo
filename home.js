import { auth, db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const logoutBtn = document.getElementById("logout-btn");
const userList = document.getElementById("user-list");
const searchInput = document.getElementById("search-user");

logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location = "index.html";
});

async function loadUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  userList.innerHTML = "";
  querySnapshot.forEach(doc => {
    const user = doc.data();
    const li = document.createElement("li");
    li.textContent = user.displayName || user.email;
    li.addEventListener("click", () => {
      localStorage.setItem("chatPartner", user.email);
      window.location = "chat.html";
    });
    userList.appendChild(li);
  });
}
loadUsers();

searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase();
  const lis = userList.querySelectorAll("li");
  lis.forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(filter) ? "block" : "none";
  });
});
