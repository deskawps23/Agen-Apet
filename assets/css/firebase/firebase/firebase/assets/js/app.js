/* =========================
FILE: assets/js/app.js
========================= */
import {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "../../firebase/auth.js";

import { db } from "../../firebase/firestore.js";
import { storage } from "../../firebase/storage.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const loginSection = document.getElementById("loginSection");
const sessionSection = document.getElementById("sessionSection");
const appSection = document.getElementById("appSection");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const fillDemoBtn = document.getElementById("fillDemoBtn");
const refreshDataBtn = document.getElementById("refreshDataBtn");
const loadDataBtn = document.getElementById("loadDataBtn");

const sessionTitle = document.getElementById("sessionTitle");
const sessionDesc = document.getElementById("sessionDesc");
const sessionBadge = document.getElementById("sessionBadge");
const currentRoleTitle = document.getElementById("currentRoleTitle");
const currentRoleDesc = document.getElementById("currentRoleDesc");
const connectionInfo = document.getElementById("connectionInfo");
const myStokisId = document.getElementById("myStokisId");
const stokisSessionState = document.getElementById("stokisSessionState");

const countUsers = document.getElementById("countUsers");
const countStokis = document.getElementById("countStokis");
const countKurir = document.getElementById("countKurir");
const countWilayah = document.getElementById("countWilayah");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const statusFilter = document.getElementById("statusFilter");
const exportBtn = document.getElementById("exportBtn");
const datasetInfo = document.getElementById("datasetInfo");
const dataBody = document.getElementById("dataBody");
const mobileCardList = document.getElementById("mobileCardList");

const roleSwitches = document.querySelectorAll(".role-switch");
const superView = document.getElementById("superView");
const stokisView = document.getElementById("stokisView");

const editModal = document.getElementById("editModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const openEditBtn = document.getElementById("openEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
const deleteEditBtn = document.getElementById("deleteEditBtn");

let currentUser = null;
let currentProfile = null;
let rawData = [];

function toast(message, type = "info") {
  const wrap = document.getElementById("toastWrap");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-6px)";
  }, 2600);
  setTimeout(() => el.remove(), 3200);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setVisible(el, visible) {
  el.classList.toggle("hidden", !visible);
}

function statusClass(value) {
  const v = String(value).toLowerCase();
  if (v.includes("pending")) return "pill warn";
  if (v.includes("nonaktif") || v.includes("batal")) return "pill danger";
  return "pill";
}

function fillDemoLogin() {
  document.getElementById("loginEmail").value = "admin@apet.local";
  document.getElementById("loginPassword").value = "123456";
}
fillDemoBtn.addEventListener("click", fillDemoLogin);

async function loginApp() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  if (!email || !password) {
    toast("Email dan password wajib diisi.", "error");
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    toast("Login berhasil.", "ok");
  } catch (error) {
    console.error(error);
    toast("Login gagal: " + error.message, "error");
  }
}

async function logoutApp() {
  try {
    await signOut(auth);
    toast("Logout berhasil.", "info");
  } catch (error) {
    toast("Logout gagal.", "error");
  }
}

function applyRoleUI(profile) {
  currentRoleTitle.textContent = `Role: ${profile.role || "-"}`;
  currentRoleDesc.textContent = `Nama: ${profile.nama || "-"} • Email: ${profile.email || "-"} • Stokis: ${profile.stokisId || "-"}`;
  myStokisId.value = profile.stokisId || "";
  stokisSessionState.value = "Login aktif";
  sessionTitle.textContent = `Sesi aktif: ${profile.nama || profile.email || "-"}`;
  sessionDesc.textContent = `Role ${profile.role || "-"} • UID ${currentUser?.uid || "-"}`;
  sessionBadge.textContent = profile.role || "Logged In";
  connectionInfo.textContent = "Tersambung ke Firebase.";

  if (profile.role === "admin_stokis") {
    switchView("stokis");
  } else {
    switchView("super");
  }
}

function switchView(mode) {
  roleSwitches.forEach(btn => btn.classList.toggle("active", btn.dataset.view === mode));
  if (mode === "super") {
    superView.classList.remove("hidden");
    stokisView.classList.add("hidden");
  } else {
    superView.classList.add("hidden");
    stokisView.classList.remove("hidden");
  }
}
roleSwitches.forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

document.querySelectorAll(".tabs").forEach(tabWrap => {
  const buttons = tabWrap.querySelectorAll(".tab-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const root = tabWrap.parentElement;
      root.querySelectorAll(".form-panel").forEach(panel => panel.classList.remove("active"));
      const target = document.getElementById(btn.dataset.panel);
      if (target) target.classList.add("active");
    });
  });
});

function nowInputValue() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function resetForm(panelId) {
  const root = document.getElementById(panelId);
  if (!root) return;
  root.querySelectorAll("input, textarea, select").forEach(el => {
    if (el.type === "file") el.value = "";
    else if (el.tagName === "SELECT") el.selectedIndex = 0;
    else if (!el.readOnly) el.value = "";
  });
}
window.resetForm = resetForm;

document.querySelectorAll("[data-reset-panel]").forEach(btn => {
  btn.addEventListener("click", () => resetForm(btn.dataset.resetPanel));
});

async function uploadFileIfAny(fileInput, folder, code) {
  const file = fileInput?.files?.[0];
  if (!file) return { url: "", path: "" };
  const path = `${folder}/${code}/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, path };
}

function getGps(target) {
  if (!navigator.geolocation) {
    toast("Browser tidak mendukung GPS.", "error");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (target === "stokis") {
        document.getElementById("stokisLat").value = lat;
        document.getElementById("stokisLng").value = lng;
      } else if (target === "kurir") {
        document.getElementById("kurirLat").value = lat;
        document.getElementById("kurirLng").value = lng;
      } else if (target === "wilayah") {
        document.getElementById("wilayahLat").value = lat;
        document.getElementById("wilayahLng").value = lng;
      } else if (target === "edit") {
        document.getElementById("editLat").value = lat;
        document.getElementById("editLng").value = lng;
      }
      toast("Lokasi GPS berhasil diambil.", "ok");
    },
    err => {
      let msg = "Gagal mengambil lokasi.";
      if (err.code === 1) msg = "Izin lokasi ditolak.";
      if (err.code === 2) msg = "Lokasi tidak tersedia.";
      if (err.code === 3) msg = "Permintaan lokasi timeout.";
      toast(msg, "error");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}
document.querySelectorAll("[data-gps]").forEach(btn => {
  btn.addEventListener("click", () => getGps(btn.dataset.gps));
});

function canAccessStokisId(stokisId) {
  if (!currentProfile) return false;
  if (currentProfile.role === "super_admin") return true;
  if (currentProfile.role === "admin_stokis") return (currentProfile.stokisId || "") === (stokisId || "");
  return false;
}

async function saveUser() {
  if (currentProfile?.role !== "super_admin") {
    toast("Hanya super admin yang bisa membuat user.", "error");
    return;
  }
  const nama = document.getElementById("userNama").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("userPassword").value.trim();
  const role = document.getElementById("userRole").value;
  const stokisId = document.getElementById("userStokisId").value.trim();
  const aktif = document.getElementById("userAktif").value === "true";

  if (!nama || !email || !password) {
    toast("Nama, email, dan password wajib diisi.", "error");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      nama, email, role, stokisId, aktif,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    toast("User berhasil dibuat. Sesi berpindah ke user baru, login ulang jika perlu.", "ok");
    await loadAllData();
  } catch (error) {
    console.error(error);
    toast("Gagal membuat user: " + error.message, "error");
  }
}

async function saveStokis() {
  if (!currentProfile) return;
  const kodeStokis = document.getElementById("stokisKode").value.trim();
  const namaStokis = document.getElementById("stokisNama").value.trim();
  if (!kodeStokis || !namaStokis) {
    toast("Kode dan nama stokis wajib diisi.", "error");
    return;
  }

  if (currentProfile.role === "admin_stokis" && currentProfile.stokisId && currentProfile.stokisId !== kodeStokis) {
    toast("Admin stokis hanya boleh mengelola stokis miliknya.", "error");
    return;
  }

  try {
    const photo = await uploadFileIfAny(document.getElementById("stokisFoto"), "stokis", kodeStokis);
    await addDoc(collection(db, "stokis"), {
      kodeStokis,
      namaStokis,
      kecamatanId: document.getElementById("stokisKecamatanId").value.trim(),
      kecamatanNama: document.getElementById("stokisKecamatanNama").value.trim(),
      desaId: document.getElementById("stokisDesaId").value.trim(),
      desaNama: document.getElementById("stokisDesaNama").value.trim(),
      penanggungJawab: document.getElementById("stokisPj").value.trim(),
      noHp: document.getElementById("stokisHp").value.trim(),
      alamat: document.getElementById("stokisAlamat").value.trim(),
      status: document.getElementById("stokisStatus").value,
      totalStok: Number(document.getElementById("stokisTotalStok").value || 0),
      latitude: document.getElementById("stokisLat").value.trim(),
      longitude: document.getElementById("stokisLng").value.trim(),
      fotoURL: photo.url || "",
      fotoPath: photo.path || "",
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    toast("Stokis berhasil disimpan.", "ok");
    resetForm("stokisPanel");
    await loadAllData();
  } catch (error) {
    console.error(error);
    toast("Gagal simpan stokis: " + error.message, "error");
  }
}

async function saveKurir() {
  if (!currentProfile) return;

  const kodeKurir = document.getElementById("kurirKode").value.trim();
  const namaKurir = document.getElementById("kurirNama").value.trim();
  let stokisId = document.getElementById("kurirStokisId").value.trim();

  if (currentProfile.role === "admin_stokis") {
    stokisId = currentProfile.stokisId || stokisId;
    document.getElementById("kurirStokisId").value = stokisId;
  }

  if (!kodeKurir || !namaKurir || !stokisId) {
    toast("Kode, nama kurir, dan stokisId wajib diisi.", "error");
    return;
  }

  if (!canAccessStokisId(stokisId)) {
    toast("Anda tidak berhak menambah kurir untuk stokis ini.", "error");
    return;
  }

  try {
    const photo = await uploadFileIfAny(document.getElementById("kurirFoto"), "kurir", kodeKurir);
    await addDoc(collection(db, "kurir"), {
      kodeKurir,
      namaKurir,
      stokisId,
      noHp: document.getElementById("kurirHp").value.trim(),
      kendaraan: document.getElementById("kurirKendaraan").value,
      status: document.getElementById("kurirStatus").value,
      areaLayanan: document.getElementById("kurirArea").value.trim(),
      latitude: document.getElementById("kurirLat").value.trim(),
      longitude: document.getElementById("kurirLng").value.trim(),
      fotoURL: photo.url || "",
      fotoPath: photo.path || "",
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    toast("Kurir berhasil disimpan.", "ok");
    resetForm("kurirPanel");
    await loadAllData();
  } catch (error) {
    console.error(error);
    toast("Gagal simpan kurir: " + error.message, "error");
  }
}

async function saveWilayah() {
  if (currentProfile?.role !== "super_admin") {
    toast("Hanya super admin yang bisa mengelola wilayah.", "error");
    return;
  }
  const kodeWilayah = document.getElementById("wilayahKode").value.trim();
  const namaWilayah = document.getElementById("wilayahNama").value.trim();
  if (!kodeWilayah || !namaWilayah) {
    toast("Kode dan nama wilayah wajib diisi.", "error");
    return;
  }

  let metadata = {};
  try {
    metadata = document.getElementById("wilayahMeta").value.trim()
      ? JSON.parse(document.getElementById("wilayahMeta").value.trim())
      : {};
  } catch (e) {
    toast("Metadata wilayah harus berupa JSON valid.", "error");
    return;
  }

  try {
    await addDoc(collection(db, "wilayah"), {
      kodeWilayah,
      namaWilayah,
      jenis: document.getElementById("wilayahJenis").value,
      parentId: document.getElementById("wilayahParentId").value.trim(),
      parentNama: document.getElementById("wilayahParentNama").value.trim(),
      aktif: document.getElementById("wilayahAktif").value === "true",
      latitude: document.getElementById("wilayahLat").value.trim(),
      longitude: document.getElementById("wilayahLng").value.trim(),
      metadata,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    toast("Wilayah berhasil disimpan.", "ok");
    resetForm("wilayahPanel");
    await loadAllData();
  } catch (error) {
    console.error(error);
    toast("Gagal simpan wilayah: " + error.message, "error");
  }
}

async function saveDistribusi() {
  if (!currentProfile) return;
  let stokisId = document.getElementById("distribusiStokisId").value.trim();
  if (currentProfile.role === "admin_stokis") stokisId = currentProfile.stokisId || stokisId;

  if (!stokisId) {
    toast("stokisId distribusi wajib diisi.", "error");
    return;
  }
  if (!canAccessStokisId(stokisId)) {
    toast("Anda tidak berhak menambah distribusi untuk stokis ini.", "error");
    return;
  }

  try {
    await addDoc(collection(db, "distribusi"), {
      kodeDistribusi: document.getElementById("distribusiKode").value.trim(),
      stokisId,
      kurirId: document.getElementById("distribusiKurirId").value.trim(),
      tujuan: document.getElementById("distribusiTujuan").value,
      namaPenerima: document.getElementById("distribusiPenerima").value.trim(),
      jumlah: Number(document.getElementById("distribusiJumlah").value || 0),
      statusPengiriman: document.getElementById("distribusiStatus").value,
      tanggalKirim: document.getElementById("distribusiTanggal").value || nowInputValue(),
      catatan: document.getElementById("distribusiCatatan").value.trim(),
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    toast("Distribusi berhasil disimpan.", "ok");
    resetForm("distribusiPanel");
    document.getElementById("distribusiTanggal").value = nowInputValue();
    await loadAllData();
  } catch (error) {
    console.error(error);
    toast("Gagal simpan distribusi: " + error.message, "error");
  }
}

async function loadCollection(name) {
  const snap = await getDocs(query(collection(db, name), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, collection: name, ...d.data() }));
}

function scopeAllowed(item) {
  if (!currentProfile) return false;
  if (currentProfile.role === "super_admin") return true;
  if (currentProfile.role === "admin_stokis") {
    if (item.collection === "users") return item.stokisId === currentProfile.stokisId || item.id === currentUser.uid;
    if (item.collection === "stokis") return item.kodeStokis === currentProfile.stokisId || item.stokisId === currentProfile.stokisId;
    if (item.collection === "kurir") return item.stokisId === currentProfile.stokisId;
    if (item.collection === "distribusi") return item.stokisId === currentProfile.stokisId;
    return false;
  }
  return false;
}

function normalizeItem(item) {
  return {
    collection: item.collection,
    id: item.id,
    type: item.collection,
    code: item.kodeStokis || item.kodeKurir || item.kodeWilayah || item.kodeDistribusi || item.email || item.id,
    name: item.nama || item.namaStokis || item.namaKurir || item.namaWilayah || item.namaPenerima || "-",
    status: item.role || item.status || item.statusPengiriman || item.jenis || (typeof item.aktif === "boolean" ? (item.aktif ? "Aktif" : "Nonaktif") : "-"),
    scope: item.stokisId || item.kecamatanNama || item.parentNama || item.tujuan || item.email || "-",
    geo: item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : "-",
    foto: item.fotoURL || "",
    fotoPath: item.fotoPath || "",
    raw: item
  };
}

async function loadAllData() {
  if (!currentProfile) return;
  datasetInfo.textContent = "Memuat data dari Firestore...";
  try {
    const names = ["users","stokis","kurir","wilayah","distribusi"];
    const results = await Promise.all(names.map(loadCollection));
    rawData = results.flat().filter(scopeAllowed).map(normalizeItem);

    countUsers.textContent = rawData.filter(x => x.collection === "users").length;
    countStokis.textContent = rawData.filter(x => x.collection === "stokis").length;
    countKurir.textContent = rawData.filter(x => x.collection === "kurir").length;
    countWilayah.textContent = rawData.filter(x => x.collection === "wilayah").length;

    renderAll();
    datasetInfo.textContent = `Data dimuat: ${rawData.length} item.`;
  } catch (error) {
    console.error(error);
    datasetInfo.textContent = "Gagal memuat data Firestore.";
    toast("Gagal memuat data: " + error.message, "error");
  }
}

function getFilteredRows() {
  const q = searchInput.value.trim().toLowerCase();
  const t = typeFilter.value;
  const s = statusFilter.value;

  return rawData.filter(item => {
    const text = Object.values(item).join(" ").toLowerCase();
    const matchQ = !q || text.includes(q);
    const matchT = t === "all" || item.type === t;
    const matchS = s === "all" || String(item.status).toLowerCase().includes(s);
    return matchQ && matchT && matchS;
  });
}

function renderDesktopTable(filtered) {
  if (!filtered.length) {
    dataBody.innerHTML = `<tr><td colspan="8" class="empty">Tidak ada data yang cocok.</td></tr>`;
    return;
  }

  dataBody.innerHTML = filtered.map(item => `
    <tr>
      <td><span class="pill">${escapeHtml(item.type)}</span></td>
      <td><strong>${escapeHtml(item.code)}</strong><div style="margin-top:4px;color:var(--muted);font-size:.82rem">${escapeHtml(item.id)}</div></td>
      <td>${escapeHtml(item.name)}</td>
      <td><span class="${statusClass(item.status)}">${escapeHtml(item.status)}</span></td>
      <td>${escapeHtml(item.scope)}</td>
      <td>${escapeHtml(item.geo)}</td>
      <td><div class="photo-preview">${item.foto ? `<img src="${item.foto}" alt="foto">` : "No photo"}</div></td>
      <td>
        <div class="actions">
          <button class="btn-sm sm-primary" onclick="openEditDoc('${item.collection}','${item.id}')">Edit</button>
          <button class="btn-sm sm-secondary" onclick="showDetail('${item.collection}','${item.id}')">Detail</button>
          <button class="btn-sm sm-danger" onclick="deleteDocWithConfirm('${item.collection}','${item.id}', \`${item.fotoPath || ""}\`)">Hapus</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderMobileCards(filtered) {
  if (!filtered.length) {
    mobileCardList.innerHTML = `<div class="empty">Tidak ada data yang cocok.</div>`;
    return;
  }

  mobileCardList.innerHTML = filtered.map(item => `
    <article class="mobile-card">
      <div class="mobile-card-top">
        <div style="min-width:0">
          <h3 class="mobile-title">${escapeHtml(item.name)}</h3>
          <div class="mobile-sub">${escapeHtml(item.code)} • ${escapeHtml(item.id)}</div>
        </div>
        <span class="${statusClass(item.status)}">${escapeHtml(item.type)}</span>
      </div>

      <div class="photo-preview" style="width:100%;max-width:100%">
        ${item.foto ? `<img src="${item.foto}" alt="foto">` : "No photo"}
      </div>

      <div class="mobile-grid">
        <div class="meta"><small>Status</small><strong>${escapeHtml(item.status)}</strong></div>
        <div class="meta"><small>Scope</small><strong>${escapeHtml(item.scope)}</strong></div>
        <div class="meta"><small>Geo</small><strong>${escapeHtml(item.geo)}</strong></div>
        <div class="meta"><small>Jenis</small><strong>${escapeHtml(item.type)}</strong></div>
      </div>

      <div class="actions">
        <button class="btn-sm sm-primary" onclick="openEditDoc('${item.collection}','${item.id}')">Edit</button>
        <button class="btn-sm sm-secondary" onclick="showDetail('${item.collection}','${item.id}')">Detail</button>
        <button class="btn-sm sm-danger" onclick="deleteDocWithConfirm('${item.collection}','${item.id}', \`${item.fotoPath || ""}\`)">Hapus</button>
      </div>
    </article>
  `).join("");
}

function renderAll() {
  const filtered = getFilteredRows();
  renderDesktopTable(filtered);
  renderMobileCards(filtered);
}

function openModal() { editModal.style.display = "flex"; }
function closeModal() { editModal.style.display = "none"; }

async function openEditDoc(collectionName, id) {
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    if (!snap.exists()) {
      toast("Data tidak ditemukan.", "error");
      return;
    }
    const data = snap.data();
    document.getElementById("editCollection").value = collectionName;
    document.getElementById("editDocId").value = id;
    document.getElementById("editCollectionLabel").value = collectionName;
    document.getElementById("editFotoPath").value = data.fotoPath || "";
    document.getElementById("editCode").value = data.kodeStokis || data.kodeKurir || data.kodeWilayah || data.kodeDistribusi || data.email || "";
    document.getElementById("editStatus").value = data.role || data.status || data.statusPengiriman || data.jenis || (typeof data.aktif === "boolean" ? (data.aktif ? "Aktif" : "Nonaktif") : "");
    document.getElementById("editName").value = data.nama || data.namaStokis || data.namaKurir || data.namaWilayah || data.namaPenerima || "";
    document.getElementById("editLat").value = data.latitude || "";
    document.getElementById("editLng").value = data.longitude || "";
    document.getElementById("editJson").value = JSON.stringify(data, null, 2);
    document.getElementById("editFotoFile").value = "";
    openModal();
  } catch (error) {
    console.error(error);
    toast("Gagal membuka data edit.", "error");
  }
}
window.openEditDoc = openEditDoc;

async function saveEditedDoc() {
  const collectionName = document.getElementById("editCollection").value;
  const id = document.getElementById("editDocId").value;
  if (!collectionName || !id) {
    toast("Dokumen edit tidak valid.", "error");
    return;
  }

  try {
    const snap = await getDoc(doc(db, collectionName, id));
    if (!snap.exists()) {
      toast("Dokumen tidak ditemukan.", "error");
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse(document.getElementById("editJson").value.trim() || "{}");
    } catch (e) {
      toast("Metadata JSON tidak valid.", "error");
      return;
    }

    const oldData = snap.data();
    const editFile = document.getElementById("editFotoFile");
    let fotoURL = oldData.fotoURL || "";
    let fotoPath = oldData.fotoPath || "";

    if (editFile.files[0]) {
      if (fotoPath) {
        try { await deleteObject(ref(storage, fotoPath)); } catch (e) {}
      }
      const uploaded = await uploadFileIfAny(editFile, collectionName, document.getElementById("editCode").value.trim() || id);
      fotoURL = uploaded.url;
      fotoPath = uploaded.path;
    }

    parsed.fotoURL = fotoURL;
    parsed.fotoPath = fotoPath;
    parsed.latitude = document.getElementById("editLat").value.trim();
    parsed.longitude = document.getElementById("editLng").value.trim();
    parsed.updatedAt = serverTimestamp();

    await updateDoc(doc(db, collectionName, id), parsed);
    closeModal();
    toast("Data berhasil diperbarui.", "ok");
    await loadAllData();
  } catch (error) {
    console.error(error);
    toast("Gagal menyimpan edit: " + error.message, "error");
  }
}

async function deleteDocWithConfirm(collectionName, id, fotoPath = "") {
  const ok = confirm("Hapus data ini?");
  if (!ok) return;

  try {
    if (fotoPath) {
      try { await deleteObject(ref(storage, fotoPath)); } catch (e) {}
    }
    await deleteDoc(doc(db, collectionName, id));
    toast("Data berhasil dihapus.", "ok");
    await loadAllData();
  } catch (error) {
    console.error(error);
    toast("Gagal menghapus data: " + error.message, "error");
  }
}
window.deleteDocWithConfirm = deleteDocWithConfirm;

async function showDetail(collectionName, id) {
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    if (!snap.exists()) {
      toast("Data tidak ditemukan.", "error");
      return;
    }
    alert(JSON.stringify({ id, collection: collectionName, ...snap.data() }, null, 2));
  } catch (error) {
    toast("Gagal membaca detail.", "error");
  }
}
window.showDetail = showDetail;

loginBtn.addEventListener("click", loginApp);
logoutBtn.addEventListener("click", logoutApp);
refreshDataBtn.addEventListener("click", loadAllData);
loadDataBtn.addEventListener("click", loadAllData);

document.getElementById("saveUserBtn").addEventListener("click", saveUser);
document.getElementById("saveStokisBtn").addEventListener("click", saveStokis);
document.getElementById("saveKurirBtn").addEventListener("click", saveKurir);
document.getElementById("saveWilayahBtn").addEventListener("click", saveWilayah);
document.getElementById("saveDistribusiBtn").addEventListener("click", saveDistribusi);

searchInput.addEventListener("input", renderAll);
typeFilter.addEventListener("change", renderAll);
statusFilter.addEventListener("change", renderAll);

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "apet-firebase-data.json";
  a.click();
  URL.revokeObjectURL(url);
});

openEditBtn.addEventListener("click", () => {
  const first = rawData[0];
  if (!first) {
    toast("Belum ada data untuk diedit.", "info");
    return;
  }
  openEditDoc(first.collection, first.id);
});

closeModalBtn.addEventListener("click", closeModal);
saveEditBtn.addEventListener("click", saveEditedDoc);
deleteEditBtn.addEventListener("click", () => {
  const collectionName = document.getElementById("editCollection").value;
  const id = document.getElementById("editDocId").value;
  const fotoPath = document.getElementById("editFotoPath").value;
  if (!collectionName || !id) return;
  closeModal();
  deleteDocWithConfirm(collectionName, id, fotoPath);
});
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeModal();
});

document.querySelectorAll(".bottom-nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".bottom-nav a").forEach(a => a.classList.remove("active"));
    link.classList.add("active");
  });
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    currentProfile = null;
    setVisible(loginSection, true);
    setVisible(sessionSection, false);
    setVisible(appSection, false);
    currentRoleTitle.textContent = "Role: -";
    currentRoleDesc.textContent = "Belum ada sesi aktif.";
    connectionInfo.textContent = "Menunggu autentikasi Firebase.";
    rawData = [];
    renderAll();
    return;
  }

  currentUser = user;
  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (!userSnap.exists()) {
      toast("Profil user belum ada di collection users.", "error");
      await signOut(auth);
      return;
    }

    currentProfile = userSnap.data();
    if (currentProfile.aktif === false) {
      toast("User nonaktif. Login ditolak.", "error");
      await signOut(auth);
      return;
    }

    applyRoleUI(currentProfile);
    setVisible(loginSection, false);
    setVisible(sessionSection, true);
    setVisible(appSection, true);
    await loadAllData();
  } catch (error) {
    console.error(error);
    toast("Gagal memuat profil user.", "error");
  }
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold:.14 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
document.getElementById("distribusiTanggal").value = nowInputValue();
renderAll();
