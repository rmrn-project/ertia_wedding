// doaucapan.js – VERSI FIX 100% JALAN (Firebase 12.6.0 Compatibility)
// Copy paste SELURUHNYA, ganti yang lama

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
import imageCompression from "https://cdn.jsdelivr.net/npm/browser-image-compression@1.0.18/dist/browser-image-compression.js";

// ===== Firebase Config =====
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

// ===== Render ucapan (real-time + local) =====
function renderUcapan(data, id = "") {
  const { nama, doa, fotoURL, waktu } = data;
  const div = document.createElement("div");
  div.className = "ucapan-item";
  if (id === "local") div.style.border = "2px solid #d4af37";

  const waktuStr = waktu?.seconds 
    ? new Date(waktu.seconds * 1000).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
    : waktu || "";

  div.innerHTML = `
    ${fotoURL ? `<img src="${fotoURL}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;margin-right:12px;float:left;">` : ""}
    <div style="${fotoURL ? "overflow:hidden;" : ""}">
      <strong style="color:#d4af37;">${nama}</strong>
      <small style="color:#ccc;display:block;margin:4px 0;">${waktuStr}</small>
      <p style="margin:6px 0;line-height:1.6;word-break:break-word;">${doa.replace(/\n/g, "<br>")}</p>
    </div>
    <div style="clear:both;"></div>
  `;
  return div;
}

// ===== Kirim ucapan (dengan anti-spam tetap utuh) =====
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
    alert("Nama dan ucapan wajib diisi ya 🙏");
    btn.disabled = false;
    btn.innerText = "Kirim Ucapan";
    isSending = false;
    return;
  }

  let fotoURL = "";
  try {
    if (fotoFile) {
      let file = fotoFile;
      if (fotoFile.size > 2 * 1024 * 1024) {
        file = await imageCompression(fotoFile, { maxSizeMB: 1.5, maxWidthOrHeight: 800 });
      }
      const storageRef = ref(storage, `ucapan/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      fotoURL = await getDownloadURL(storageRef);
    }

    await addDoc(ucapanRef, {
      nama,
      doa,
      fotoURL,
      waktu: serverTimestamp()
    });

    localStorage.setItem("ucapanUser", JSON.stringify({ nama, doa, fotoURL, waktu: new Date().toLocaleString('id-ID') }));

    document.getElementById("nama").value = "";
    document.getElementById("doa").value = "";
    document.getElementById("foto").value = "";

    alert("Terima kasih! Ucapanmu sudah terkirim 🎉");
    btn.innerText = "Terkirim ✓";
    btn.style.opacity = "0.6";
  } catch (err) {
    console.error(err);
    alert("Gagal mengirim, coba lagi ya");
    btn.disabled = false;
    btn.innerText = "Kirim Ucapan";
  }
  isSending = false;
}

// ===== Load real-time + local ucapan =====
function loadAllUcapan() {
  const list = document.getElementById("listUcapan");
  list.innerHTML = '<p style="text-align:center;color:#999;">Memuat ucapan...</p>';

  const q = query(ucapanRef, orderBy("waktu", "desc"));
  onSnapshot(q, (snapshot) => {
    list.innerHTML = "";
    if (snapshot.empty) {
      list.innerHTML = '<p style="text-align:center;color:#aaa;font-style:italic;">Belum ada ucapan nih...</p>';
    }
    snapshot.forEach(doc => list.appendChild(renderUcapan(doc.data())));
  });
}

// ===== DOM Loaded =====
document.addEventListener("DOMContentLoaded", () => {
  // Pasang tombol
  document.querySelector(".btn-kirim")?.addEventListener("click", kirimUcapan);

  // Load semua ucapan real-time
  loadAllUcapan();

  // Cek kalau user sudah pernah kirim
  const saved = localStorage.getItem("ucapanUser");
  if (saved) {
    const u = JSON.parse(saved);
    const btn = document.querySelector(".btn-kirim");
    btn.disabled = true;
    btn.innerText = "Terkirim ✓";
    btn.style.opacity = "0.6";

    // Tampilkan ucapan dia di atas (dengan border gold)
    const list = document.getElementById("listUcapan");
    list.prepend(renderUcapan(u, "local"));
  }
});