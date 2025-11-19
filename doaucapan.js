// doaucapan.js — VERSI 100% JALAN PAKAI FIREBASE 12.6.0 (COMPATIBILITY MODE)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore-compat.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage-compat.js";
import imageCompression from "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js";

// === Firebase Config (sama persis) ===
const firebaseConfig = {
  apiKey: "AIzaSyCBNM5NpBwHOwyla5LcBZId7SCUIBgthnw",
  authDomain: "ertiawed.firebaseapp.com",
  projectId: "ertiawed",
  storageBucket: "ertiawed.firebasestorage.app",
  messagingSenderId: "580476029012",
  appId: "1:580476029012:web:266389781d60b1bad4c5c1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const ucapanRef = collection(db, "ucapan");

let isSending = false;

// === Render ucapan ===
function renderUcapan(data, isLocal = false) {
  const { nama, doa, fotoURL, waktu } = data;
  const div = document.createElement("div");
  div.className = "ucapan-item";
  if (isLocal) div.style.cssText += "border: 2px solid #d4af37; border-radius: 15px;";

  const waktuStr = waktu?.seconds
    ? new Date(waktu.seconds * 1000).toLocaleString("id-ID", {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : waktu || "Baru saja";

  div.innerHTML = `
    ${fotoURL ? `<img src="${fotoURL}" loading="lazy" style="width:50px;height:50px;border-radius:50%;object-fit:cover;margin-right:12px;float:left;">` : ""}
    <div style="${fotoURL ? 'overflow:hidden;' : ''}">
      <strong style="color:#d4af37;font-size:1.1em;">${nama}</strong>
      <small style="color:#ccc;display:block;margin:4px 0;font-size:0.9em;">${waktuStr}</small>
      <p style="margin:6px 0;line-height:1.7;word-break:break-word;">${doa.replace(/\n/g, "<br>")}</p>
    </div>
    <div style="clear:both;"></div>
  `;
  return div;
}

// === Kirim ucapan (anti-spam utuh) ===
async function kirimUcapan() {
  if (localStorage.getItem("ucapanUser")) {
    alert("Kamu sudah mengirim ucapan. Terima kasih ya ❤️");
    return;
  }
  if (isSending) return;
  isSending = true;

  const btn = document.querySelector(".btn-kirim");
  btn.disabled = true;
  btn.innerText = "Mengirim...";

  const nama = document.getElementById("nama").value.trim();
  const doa = document.getElementById("doa").value.trim();
  const fotoFile = document.getElementById("foto")?.files[0];

  if (!nama || !doa) {
    alert("Nama dan ucapan harus diisi ya 🙏");
    btn.disabled = false;
    btn.innerText = "Kirim Ucapan";
    is Sending = false;
    return;
  }

  let fotoURL = "";
  try {
    if (fotoFile) {
      let file = fotoFile;
      if (fotoFile.size > 2 * 1024 * 102 Visions) {
        file = await imageCompression(fotoFile, { maxSizeMB: 1.5, maxWidthOrHeight: 800, useWebWorker: true });
      }
      const storageRef = ref(storage, `ucapan/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      fotoURL = await getDownloadURL(storageRef);
    }

    await addDoc(ucapanRef, {
      nama, doa, fotoURL,
      waktu: serverTimestamp(),
      userAgent: navigator.userAgent
    });

    localStorage.setItem("ucapanUser", JSON.stringify({ nama, doa, fotoURL, waktu: new Date().toLocaleString('id-ID') }));

    document.getElementById("nama").value = "";
    document.getElementById("doa").value = "";
    document.getElementById("foto").value = "";

    alert("Terima kasih! Ucapanmu sudah terkirim dan langsung muncul di bawah 🎉");
    btn.innerText = "Terkirim ✓";
    btn.style.opacity = "0.6";
  } catch (err) {
    console.error("Error:", err);
    alert("Gagal mengirim ucapan. Coba lagi ya 🙏");
    btn.disabled = false;
    btn.innerText = "Kirim Ucapan";
  }
  isSending = false;
}

// === Load real-time ucapan ===
function loadRealtimeUcapan() {
  const list = document.getElementById("listUcapan");
  list.innerHTML = '<p style="text-align:center;color:#999;padding:20px 0;">Memuat ucapan...</p>';

  const q = query(ucapanRef, orderBy("waktu", "desc"));
  onSnapshot(q, (snapshot) => {
    list.innerHTML = "";
    if (snapshot.empty) {
      list.innerHTML = '<p style="text-align:center;color:#aaa;font-style:italic;padding:30px 0;">Belum ada ucapan nih...</p>';
      return;
    }
    snapshot.forEach(doc => list.appendChild(renderUcapan(doc.data())));
  });
}

// === DOM Loaded ===
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".btn-kirim")?.addEventListener("click", kirimUcapan);
  loadRealtimeUcapan();

  // Cek user sudah kirim belum
  const saved = localStorage.getItem("ucapanUser");
  if (saved) {
    const u = JSON.parse(saved);
    const btn = document.querySelector(".btn-kirim");
    btn.disabled = true;
    btn.innerText = "Terkirim ✓";
    btn.style.opacity = "0.6";

    const list = document.getElementById("listUcapan");
    list.prepend(renderUcapan(u, true)); // border gold biar keliatan punya dia
  }
});