// ============================
// script.js - Doa & Ucapan
// ============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import imageCompression from "https://cdn.jsdelivr.net/npm/browser-image-compression@1.0.18/dist/browser-image-compression.js";

// ===== 1. Firebase config =====
const firebaseConfig = {
    apiKey: "API_KEY_KAMU",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let isSending = false;

// ===== 2. Fungsi kirim ucapan =====
async function kirimUcapan() {
    if (localStorage.getItem("ucapanUser")) {
        alert("Kamu sudah mengirim 1 ucapan. Terima kasih 🙏");
        return;
    }
    if (isSending) return;
    isSending = true;

    const btn = document.querySelector(".btn-kirim");
    btn.disabled = true;
    btn.innerText = "Mengirim...";

    const nama = document.getElementById("nama").value.trim();
    const doa = document.getElementById("doa").value.trim();
    const fotoFile = document.getElementById("foto")?.files[0]; // opsional
    const waktu = new Date().toLocaleString('id-ID');

    if (!nama || !doa) {
        alert("Masukkan nama & doa dulu ya 🙏");
        isSending = false;
        btn.disabled = false;
        btn.innerText = "Kirim Ucapan";
        return;
    }

    let fotoURL = "";
    try {
        if (fotoFile) {
            let fileToUpload = fotoFile;

            // compress otomatis jika >2MB
            if (fotoFile.size > 2 * 1024 * 1024) {
                fileToUpload = await imageCompression(fotoFile, { maxSizeMB: 2, maxWidthOrHeight: 800 });
            }

            const storageRef = ref(storage, `ucapan/${Date.now()}_${fileToUpload.name}`);
            await uploadBytes(storageRef, fileToUpload);
            fotoURL = await getDownloadURL(storageRef);
        }

        // simpan ke Firestore
        await addDoc(collection(db, "ucapan"), {
            nama,
            doa,
            fotoURL,
            waktu,
            userAgent: navigator.userAgent
        });

        console.log("Terkirim ke Firestore.");
    } catch (err) {
        console.error("Gagal kirim ke Firestore:", err);
    }

    // ===== 3. Tampilkan langsung di halaman =====
    const div = document.createElement("div");
    div.className = "ucapan-item";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.marginBottom = "15px";
    div.style.background = "#f0f0f0";
    div.style.padding = "10px";
    div.style.borderRadius = "10px";

    div.innerHTML = `
        ${fotoURL ? `<img src="${fotoURL}" style="width:50px;height:50px;border-radius:50%;margin-right:10px;">` : ""}
        <div>
            <strong>${nama}</strong><br>
            <small>${waktu}</small><br>
            ${doa}
        </div>
    `;

    document.getElementById("listUcapan").prepend(div);

    // ===== 4. Simpan ke localStorage & lock tombol =====
    localStorage.setItem("ucapanUser", JSON.stringify({ nama, doa, waktu, fotoURL }));

    document.getElementById("nama").value = "";
    document.getElementById("doa").value = "";
    document.getElementById("foto").value = "";

    btn.innerText = "Sudah Mengirim";
    btn.style.opacity = 0.6;
}

// ===== 5. Load ucapan user dari localStorage =====
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".btn-kirim");
    btn.addEventListener("click", kirimUcapan);

    const data = localStorage.getItem("ucapanUser");
    if (data) {
        const u = JSON.parse(data);
        const div = document.createElement("div");
        div.className = "ucapan-item";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.marginBottom = "15px";
        div.style.background = "#f0f0f0";
        div.style.padding = "10px";
        div.style.borderRadius = "10px";

        div.innerHTML = `
            ${u.fotoURL ? `<img src="${u.fotoURL}" style="width:50px;height:50px;border-radius:50%;margin-right:10px;">` : ""}
            <div>
                <strong>${u.nama}</strong><br>
                <small>${u.waktu}</small><br>
                ${u.doa}
            </div>
        `;
        document.getElementById("listUcapan").append(div);

        btn.disabled = true;
        btn.innerText = "Sudah Mengirim";
        btn.style.opacity = 0.6;
    }
});

export { kirimUcapan };