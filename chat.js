// chat.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, setDoc, getDoc, collection, addDoc, serverTimestamp,
  onSnapshot, query, orderBy, updateDoc
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
const emojiBtn = document.getElementById("emojiBtn");

// ✅ deterministic chatId for 1-to-1 chat
const makeChatId = (a, b) => [a, b].sort().join("_");

// 🔐 auth gate
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
    // 🔒 validate participants
    if (!data.participants.includes(me.uid)) {
      alert("You are not authorized to view this chat.");
      location.href = "home.html";
      return;
    }
  } else {
    // ✅ create new chat (with both participants)
    await setDoc(chatRef, {
      participants: [me.uid, otherUid],
      updatedAt: serverTimestamp()
    });
  }

  // header UI
  chatTop.innerHTML = `
    <img src="${other.photoURL || ""}" alt="">
    <div>
      <div style="font-weight:700">${other.username || other.email}</div>
      <div style="font-size:.9rem; opacity:.7">${other.email}</div>
    </div>
  `;

  // 📩 send message
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || !me || !chatId) return;

    await addDoc(collection(db, "conversations", chatId, "messages"), {
      text,
      senderId: me.uid,
      senderName: me.displayName || "",
      senderPhoto: me.photoURL || "",
      status: "sent", // ✅ added for read receipt
      createdAt: serverTimestamp()
    });

    // ✅ update chat timestamp
    await updateDoc(doc(db, "conversations", chatId), {
      updatedAt: serverTimestamp()
    });

    input.value = "";
  }

  // send button + enter key
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  const emojiPicker = document.getElementById("emojiPicker");

// list of emojis
const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪"];

emojis.forEach(emoji => {
  const span = document.createElement("span");
  span.textContent = emoji;
  span.addEventListener("click", () => {
    input.value += emoji;
    input.focus();
  });
  emojiPicker.appendChild(span);
});

emojiBtn.addEventListener("click", () => {
  if(emojiPicker.style.display === "none") {
    emojiPicker.style.display = "grid";
  } else {
    emojiPicker.style.display = "none";
  }
});

document.addEventListener("click", (e) => {
  if(!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
    emojiPicker.style.display = "none";
  }
});


  // live messages listener with read receipts
  const msgsRef = collection(db, "conversations", chatId, "messages");
  const q = query(msgsRef, orderBy("createdAt"));
  onSnapshot(q, async (snap) => {
    messagesEl.innerHTML = "";

    snap.forEach((m) => {
      const d = m.data();
      const div = document.createElement("div");
      div.className = "bubble " + (d.senderId === me.uid ? "mine" : "theirs");
      div.textContent = d.text;

      // ✅ show read receipt for messages sent by me
      if (d.senderId === me.uid && d.status === "read") {
        const tick = document.createElement("span");
        tick.textContent = "✔✔";
        tick.style.marginLeft = "5px";
        tick.style.fontSize = "0.8rem";
        div.appendChild(tick);
      }

      messagesEl.appendChild(div);
    });

    messagesEl.scrollTop = messagesEl.scrollHeight;

    // mark messages as read if I am the recipient
    snap.docs.forEach(async (m) => {
      const d = m.data();
      if (d.senderId !== me.uid && d.status !== "read") {
        await updateDoc(m.ref, { status: "read" });
      }
    });
  });
}); // 🔥 end of auth listener
