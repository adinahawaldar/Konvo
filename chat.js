import { auth, db } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const messagesContainer = document.getElementById("messages");
const chatForm = document.getElementById("send-btn");
const msgInput = document.getElementById("msg");
const chatWithElem = document.getElementById("chat-with");
const backBtn = document.getElementById("back-btn");
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");

const chatPartner = localStorage.getItem("chatPartner");
chatWithElem.textContent = chatPartner;

backBtn.addEventListener("click", () => window.location = "home.html");

emojiBtn.addEventListener("click", () => emojiPicker.classList.toggle("show"));

emojiPicker.addEventListener("click", e => {
  if(e.target.tagName === "SPAN") {
    msgInput.value += e.target.textContent;
  }
});

document.getElementById("send-btn").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!msgInput.value) return;

  await addDoc(collection(db, "chats"), {
    sender: user.email,
    receiver: chatPartner,
    message: msgInput.value,
    timestamp: serverTimestamp()
  });

  msgInput.value = "";
});

const q = query(collection(db, "chats"), orderBy("timestamp"));
onSnapshot(q, snapshot => {
  messagesContainer.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    if ((data.sender === auth.currentUser.email && data.receiver === chatPartner) ||
        (data.sender === chatPartner && data.receiver === auth.currentUser.email)) {
      const div = document.createElement("div");
      div.className = data.sender === auth.currentUser.email ? "my-msg" : "other-msg";
      div.textContent = data.message;
      messagesContainer.appendChild(div);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
});
