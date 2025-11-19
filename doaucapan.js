// ============================
// doaucapan.js – Versi FINAL & SIAP PAKAI
// ============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
import imageCompression from "https://cdn.jsdelivr.net/npm/browser-image-compression@1.0.18/dist/browser-image-compression.js";

// ===== 1. Firebase Config =====
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

// ===== 2. Fungsi kirim ucapan =====
export async function kirimUcapan() {
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
  const doa  = document.getElementById("doa").value.trim();
  const fotoFile = document.getElementById("foto")?.files[0];

  if (!nama || !doa) {
    alert("Nama dan ucapan wajib diisi ya 🙏");
    resetBtn();
    return;
  }

  let fotoURL = "";
  try {
    if (fotoFile) {
      let fileToUpload = fotoFile;
      if (fotoFile.size > 2 * 1024 * 1024) {
        fileToUpload = await imageCompression(fotoFile, { maxSizeMB: 1.5, maxWidthOrHeight: 800 });
      }
      const storageRef = ref(storage, `ucapan/${Date.now()}_${fileToUpload.name}`);
      await uploadBytes(storageRef, fileToUpload);
      fotoURL = await getDownloadURL(storageRef);
    }

    await addDoc(ucapanRef, {
      nama,
      doa,
      fotoURL,
      waktu: serverTimestamp(),
      userAgent: navigator.userAgent
    });

    // Simpan ke localStorage biar ga bisa kirim lagi
    localStorage.setItem("ucapanUser", JSON.stringify({ nama, doa, fotoURL, waktu: new Date().toLocaleString('id-ID') }));
    
    document.getElementById("nama").value = "";
    document.getElementById("doa").value = "";
    document.getElementById("foto").value = "";

    alert("Terima kasih! Ucapanmu sudah terkirim 🎉");
    btn.innerText = "Terkirim ✓";
    btn.style.opacity = "0.6";
  } catch (err) {
    console.error("Error:", err);
    alert("Gagal mengirim ucapan, coba lagi ya 🙏");
    resetBtn();
  } finally {
    isSending = false;
  }

  function resetBtn() {
    btn.disabled = false;
    btn.innerText = "Kirim Ucapan";
  }
}

// ===== 3. Render satu ucapan (dipakai real-time & local) =====
function renderUcapan(data, id) {
  const { nama, doa, fotoURL, waktu } = data;
  const div = document.createElement("div");
  div.className = "ucapan-item";
  div.dataset.id = id;

  const waktuStr = waktu?.seconds
    ? new Date(waktu.seconds * 1000).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
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

// ===== 4. Load semua ucapan real-time =====
export function loadUcapanRealtime() {
  const list = document.getElementById("listUcapan");
  list.innerHTML = '<p style="text-align:center;color:#999;">Memuat ucapan...</p>';

  const q = query(ucapanRef, orderBy("waktu", "desc"));
  onSnapshot(q, (snapshot) => {
    list.innerHTML = "";
    if (snapshot.empty) {
      list.innerHTML = '<p style="text-align:center;color:#aaa;font-style:italic;">Belum ada ucapan nih...</p>';
      return;
    }

    snapshot.forEach(doc => {
      const el = renderUcapan(doc.data(), doc.id);
      list.appendChild(el);
    });
  }, (err) => {
    console.error(err);
    list.innerHTML = '<p style="color:#faa;">Gagal memuat ucapan</p>';
  });
}

// ===== 5. Cek ucapan user sendiri (localStorage) & pasang event =====
document.addEventListener("DOMContentLoaded", () => {
  // Pasang klik tombol
  document.querySelector(".btn-kirim")?.addEventListener("click", kirimUcapan);

  // Load real-time semua ucapan
  loadUcapanRealtime();

  // Kalau user sudah pernah kirim, tampilkan + disable tombol
  const saved = localStorage.getItem("ucapanUser");
  if (saved) {
    const u = JSON.parse(saved);
    const btn = document.querySelector(".btn-kirim");
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Terkirim ✓";
      btn.style.opacity = "0.6";
    }
    // Tampilkan ucapan dia di paling atas (biar keliatan)
    const list = document.getElementById("listUcapan");
    const div = renderUcapan(u, "local");
    div.style.border = "2px solid #d4af37";
    div.style.borderRadius = "15px";
    list.prepend(div);
  }
});