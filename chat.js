// chat.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, setDoc, getDoc, collection, addDoc, serverTimestamp,
  onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(location.search);
const otherUid = params.get("uid");

if (!otherUid) {
  alert("No user selected."); 
  location.href = "home.html";
}

let me = null;
let other = null;
let chatId = null;

const chatTop = document.getElementById("chatTop");
const messagesEl = document.getElementById("messages");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

// sort two UIDs to create a unique/deterministic chat ID
const makeChatId = (a, b) => [a, b].sort().join("_");

// auth gate
onAuthStateChanged(auth, async (user) => {
  if (!user) { 
    location.href = "index.html"; 
    return; 
  }
  me = user;

  // fetch the other user's profile
  const otherSnap = await getDoc(doc(db, "users", otherUid));
  if (!otherSnap.exists()) {
    alert("User not found or not registered."); 
    location.href = "home.html"; 
    return;
  }
  other = otherSnap.data();

  // compute chatId
  chatId = makeChatId(me.uid, otherUid);

  // check if chat exists, else create
  const chatRef = doc(db, "conversations", chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    const data = chatSnap.data();
    // 🔐 validate participants
    if (!data.participants.includes(me.uid)) {
      alert("You are not authorized to view this chat.");
      location.href = "home.html";
      return;
    }
  } else {
    // create new chat if not exists
    await setDoc(chatRef, {
      participants: [me.uid, otherUid],
      updatedAt: serverTimestamp()
    });
  }

  // header
  chatTop.innerHTML = `
    <img src="${other.photoURL}" alt="">
    <div>
      <div style="font-weight:700">${other.username || other.email}</div>
      <div style="font-size:.9rem; opacity:.7">${other.email}</div>
    </div>
  `;

  // live messages
  const msgsRef = collection(db, "conversations", chatId, "messages");
  const q = query(msgsRef, orderBy("createdAt"));
  onSnapshot(q, (snap) => {
    messagesEl.innerHTML = "";
    snap.forEach((m) => {
      const d = m.data();
      const div = document.createElement("div");
      div.className = "bubble " + (d.senderId === me.uid ? "mine" : "theirs");
      div.textContent = d.text;
      messagesEl.appendChild(div);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text || !me || !chatId) return;

  await addDoc(collection(db, "conversations", chatId, "messages"), {
    text,
    senderId: me.uid,
    senderName: me.displayName || "",
    senderPhoto: me.photoURL || "",
    createdAt: serverTimestamp()
  });

  // touch chat doc for recents
  await setDoc(doc(db, "conversations", chatId), { 
    updatedAt: serverTimestamp() 
  }, { merge: true });

  input.value = "";
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
