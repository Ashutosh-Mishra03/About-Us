// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  onDisconnect,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBFruYoYJEXHUFB0bw4A-WqJ9A3gg8retc",
  authDomain: "sorry-project-b9cdb.firebaseapp.com",
  projectId: "sorry-project-b9cdb",
  databaseURL: "https://sorry-project-b9cdb-default-rtdb.firebaseio.com",
  storageBucket: "sorry-project-b9cdb.appspot.com",
  messagingSenderId: "482945510805",
  appId: "1:482945510805:web:fc8ac372590215a266da9c",
  measurementId: "G-CVNDT9T56M"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Save Likes
window.saveLikes = function (key) {
  const text = document.getElementById(`${key}Input`).value.trim();
  const items = text.split(",").map(t => t.trim());
  set(ref(db, `likes/${key}`), items);
};

// Save Dislikes
window.saveDislikes = function (key) {
  const text = document.getElementById(`${key}DislikeInput`).value.trim();
  const items = text.split(",").map(t => t.trim());
  set(ref(db, `dislikes/${key}`), items);
};

// Save Comment
window.saveComment = function () {
  const text = document.getElementById("commentInput").value.trim();
  if (!text) return;
  const timestamp = new Date().getTime();
  set(ref(db, "comments/" + timestamp), {
    text: text,
    time: new Date().toLocaleString()
  });
  document.getElementById("commentInput").value = "";
};

// Render Lists
function renderList(elId, items) {
  const list = document.getElementById(elId);
  list.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

// Render Comments
function renderComments(snapshot) {
  const display = document.getElementById("commentsDisplay");
  const comments = snapshot.val();
  display.innerHTML = "";
  for (const key in comments) {
    const c = comments[key];
    display.innerHTML += `
      <div class="p-3 bg-pink-50 rounded-xl shadow-sm">
        <p class="text-pink-800">${c.text}</p>
        <p class="text-xs text-gray-400 text-right mt-1">${c.time}</p>
      </div>`;
  }
}

// Realtime Listeners
["ashu", "ankii", "both"].forEach(user => {
  onValue(ref(db, `likes/${user}`), snapshot => {
    const data = snapshot.val() || [];
    document.getElementById(`${user}Input`).value = data.join(", ");
    renderList(`${user}LikesList`, data);
  });

  onValue(ref(db, `dislikes/${user}`), snapshot => {
    const data = snapshot.val() || [];
    document.getElementById(`${user}DislikeInput`).value = data.join(", ");
    renderList(`${user}DislikesList`, data);
  });
});

onValue(ref(db, "comments"), renderComments);

// 🎂 Birthday Countdown
window.addEventListener("load", () => {
  const today = new Date();
  const nextBday = new Date(today.getFullYear(), 1, 4);
  if (today > nextBday) nextBday.setFullYear(today.getFullYear() + 1);
  const bdayDiff = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));
  const bdayEl = document.getElementById("bdayCounter");
  if (bdayEl) bdayEl.textContent = `🎂 ${bdayDiff} days until Ankii's Birthday!`;

  // Track online status
  const userId = "user_" + Math.random().toString(36).substring(2);
  const userRef = ref(db, `status/${userId}`);
  const isOnline = { online: true, lastSeen: serverTimestamp() };
  const isOffline = { online: false, lastSeen: serverTimestamp() };
  onDisconnect(userRef).set(isOffline).then(() => {
    set(userRef, isOnline);
  });
});

// 🔔 Notifications
onValue(ref(db, "comments"), snapshot => {
  const latest = Object.values(snapshot.val() || {});
  const last = latest[latest.length - 1];
  if (last) {
    if (Notification.permission === "granted") {
      new Notification("New comment 💬", {
        body: last.text,
        icon: "https://cdn-icons-png.flaticon.com/512/733/733585.png"
      });
    }
  }
});

// Ask permission for notifications
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}
