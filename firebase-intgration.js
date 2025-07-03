// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, onDisconnect, serverTimestamp, update, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

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

// Utility: Save List
function saveList(refName, inputId) {
  const text = document.getElementById(inputId).value.trim();
  const items = text.split(",").map(t => t.trim()).filter(Boolean);
  set(ref(db, refName), items);
}

// Save Common Likes
window.saveLikes = () => saveList('likes', 'likesInput');
window.saveAnkiiLikes = () => saveList('ankiiLikes', 'ankiiLikesInput');
window.saveAshuLikes = () => saveList('ashuLikes', 'ashuLikesInput');
window.saveDislikes = () => saveList('dislikes', 'dislikesInput');

// Save Comment
window.saveComment = function () {
  const text = document.getElementById("commentInput").value.trim();
  if (!text) return;
  const timestamp = new Date().getTime();
  set(ref(db, 'comments/' + timestamp), {
    text: text,
    time: new Date().toLocaleString()
  });
  document.getElementById("commentInput").value = '';
};

// Download JSON
window.downloadList = function () {
  get(ref(db)).then(snapshot => {
    const blob = new Blob([JSON.stringify(snapshot.val(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anki-memories.json';
    a.click();
  });
};

// Render List
function renderList(elId, items, dbPath) {
  const list = document.getElementById(elId);
  list.innerHTML = '';
  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.textContent = item + ' ';
    const delBtn = document.createElement('button');
    delBtn.textContent = '❌';
    delBtn.style.marginLeft = '8px';
    delBtn.onclick = () => {
      const updated = items.filter((_, idx) => idx !== i);
      set(ref(db, dbPath), updated);
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

function renderComments(snapshot) {
  const display = document.getElementById('commentsDisplay');
  const comments = snapshot.val();
  display.innerHTML = '';
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
onValue(ref(db, 'likes'), snap => {
  const data = snap.val() || [];
  document.getElementById("likesInput").value = data.join(', ');
  renderList('likesList', data, 'likes');
});

onValue(ref(db, 'ankiiLikes'), snap => {
  const data = snap.val() || [];
  document.getElementById("ankiiLikesInput").value = data.join(', ');
  renderList('ankiiLikesList', data, 'ankiiLikes');
});

onValue(ref(db, 'ashuLikes'), snap => {
  const data = snap.val() || [];
  document.getElementById("ashuLikesInput").value = data.join(', ');
  renderList('ashuLikesList', data, 'ashuLikes');
});

onValue(ref(db, 'dislikes'), snap => {
  const data = snap.val() || [];
  document.getElementById("dislikesInput").value = data.join(', ');
  renderList('dislikesList', data, 'dislikes');
});

onValue(ref(db, 'comments'), renderComments);

// 🎂 Birthday Countdown
window.addEventListener('load', () => {
  const today = new Date();
  const nextBday = new Date(today.getFullYear(), 1, 4);
  if (today > nextBday) nextBday.setFullYear(today.getFullYear() + 1);
  const bdayDiff = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));
  const bdayEl = document.getElementById('bdayCounter');
  if (bdayEl) bdayEl.textContent = `🎂 ${bdayDiff} days until Ankii's Birthday!`;

  const userId = 'user_' + Math.random().toString(36).substring(2);
  const userRef = ref(db, `status/${userId}`);
  const isOnline = { online: true, lastSeen: serverTimestamp() };
  const isOffline = { online: false, lastSeen: serverTimestamp() };
  onDisconnect(userRef).set(isOffline).then(() => {
    set(userRef, isOnline);
  });
});

// 🔔 Notifications
onValue(ref(db, 'comments'), snapshot => {
  const latest = Object.values(snapshot.val() || {});
  const last = latest[latest.length - 1];
  if (last && Notification.permission === "granted") {
    new Notification("New comment 💬", {
      body: last.text,
      icon: "https://cdn-icons-png.flaticon.com/512/733/733585.png"
    });
  }
});

if (Notification.permission !== "granted") {
  Notification.requestPermission();
}
