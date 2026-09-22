// app.js - Logika Utama PRACI SIAGA
// Mengelola: render kartu, filter, search, GPS, modal WhatsApp, copy, toast, animasi

// ============================================================
// STATE
// ============================================================
let currentCategory = "semua";
let searchQuery = "";
let userLocation = null;

// ============================================================
// HELPERS
// ============================================================

/** Format nomor WA: hilangkan +, spasi, tanda baca */
function cleanWaNumber(num) {
  return num.replace(/[^0-9]/g, "");
}

/** Buka WhatsApp dengan pesan */
function waOpen(waNumber, message) {
  const clean = cleanWaNumber(waNumber);
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

/** Buka modal laporan WA */
function openWhatsApp(serviceId) {
  const service = EMERGENCY_SERVICES.find((s) => s.id === serviceId);
  if (!service || !service.whatsapp) return;
  showWhatsAppModal(service);
}

// ============================================================
// RENDER KARTU INSTANSI
// ============================================================
function buildActionButtons(s) {
  const callBtn = `
    <a href="tel:${s.phoneRaw}"
       class="btn btn-call"
       id="call-${s.id}"
       aria-label="Panggil telepon ${s.name}"
       onclick="trackAction('call','${s.name}')">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
      Panggil Sekarang
    </a>`;

  if (!s.whatsapp) {
    // Tombol penuh untuk telepon saja, WA tidak tersedia
    return `
      <div class="action-buttons action-buttons--single">
        ${callBtn}
        <span class="no-wa-note">Hubungi via telepon</span>
      </div>`;
  }

  const waBtn = `
    <button class="btn btn-whatsapp"
            id="wa-${s.id}"
            aria-label="Chat WhatsApp ${s.name}"
            onclick="openWhatsApp('${s.id}')">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
      Chat WhatsApp
    </button>`;

  return `
    <div class="action-buttons">
      ${callBtn}
      ${waBtn}
    </div>`;
}

function renderServiceCards(services) {
  const grid = document.getElementById("service-grid");
  const noResult = document.getElementById("no-result");

  if (services.length === 0) {
    grid.innerHTML = "";
    noResult.style.display = "flex";
    return;
  }

  noResult.style.display = "none";

  grid.innerHTML = services
    .map(
      (s) => `
    <article class="service-card" id="card-${s.id}" style="border-color:${s.borderColor};">
      <div class="card-header" style="background:${s.bgColor};">
        <div class="card-icon">${s.icon}</div>
        <div class="card-meta">
          <span class="category-badge"
                style="background:${s.color}18;color:${s.color};border-color:${s.color}35;">
            ${s.categoryLabel}
          </span>
          <h2 class="card-title">${s.name}</h2>
        </div>
      </div>

      <div class="card-body">
        <p class="card-desc">${s.description}</p>

        <div class="phone-row" style="border-color:${s.borderColor};">
          <img src="assets/telepon.png" alt="" class="phone-icon" aria-hidden="true" />
          <span class="phone-number" id="phone-${s.id}" style="color:${s.color};">
            ${s.phoneDisplay || s.phone}
          </span>
          <button class="copy-btn"
                  onclick="copyPhone('${s.phoneDisplay || s.phone}','${s.id}')"
                  title="Salin nomor"
                  aria-label="Salin nomor telepon ${s.name}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>

        ${buildActionButtons(s)}
      </div>
    </article>
  `
    )
    .join("");

  // Re-observe new cards for animation
  observeCards();
}

// ============================================================
// RENDER KATEGORI FILTER
// ============================================================
function renderCategories() {
  const container = document.getElementById("category-filters");
  container.innerHTML = CATEGORIES.map(
    (c) => `
    <button class="filter-btn ${c.id === currentCategory ? "active" : ""}"
            id="filter-${c.id}"
            onclick="setCategory('${c.id}')"
            aria-pressed="${c.id === currentCategory}">
      ${c.icon ? `<span aria-hidden="true">${c.icon}</span> ` : ""}${c.label}
    </button>
  `
  ).join("");
}

// ============================================================
// FILTER & SEARCH
// ============================================================
function setCategory(catId) {
  currentCategory = catId;
  renderCategories();
  applyFilters();
}

function applyFilters() {
  let filtered = EMERGENCY_SERVICES;

  if (currentCategory !== "semua") {
    filtered = filtered.filter((s) => s.category === currentCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.includes(q))
    );
  }

  renderServiceCards(filtered);
}

function handleSearch(e) {
  searchQuery = e.target.value;
  applyFilters();
}

// ============================================================
// COPY TO CLIPBOARD
// ============================================================
function copyPhone(phone, id) {
  const doCopy = () => {
    const btn = document.querySelector(`#card-${id} .copy-btn`);
    showToast(`Nomor ${phone} berhasil disalin! 📋`, "success");
    if (btn) {
      btn.classList.add("copied");
      setTimeout(() => btn.classList.remove("copied"), 2000);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(phone).then(doCopy).catch(() => {
      fallbackCopy(phone);
      doCopy();
    });
  } else {
    fallbackCopy(phone);
    doCopy();
  }
}

function fallbackCopy(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;top:-9999px;left:-9999px;";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("toast-visible"));
  });

  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// ============================================================
// FOTO PREVIEW & BATAL (X)
// ============================================================

/** Tampilkan preview file foto yang dipilih */
function handlePhotoSelect(e) {
  const file = e.target.files[0];
  const container = document.getElementById("photo-preview-container");
  const img = document.getElementById("photo-preview-img");
  const nameEl = document.getElementById("photo-file-name");
  const sizeEl = document.getElementById("photo-file-size");

  if (!file) {
    if (container) container.classList.add("hidden");
    return;
  }

  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";

  const reader = new FileReader();
  reader.onload = function (evt) {
    if (img) img.src = evt.target.result;
    if (container) container.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

/** Hapus/batalkan file foto yang diupload */
function clearSelectedPhoto() {
  const photoInput = document.getElementById("wa-photo");
  const container = document.getElementById("photo-preview-container");
  const img = document.getElementById("photo-preview-img");

  if (photoInput) photoInput.value = "";
  if (img) img.src = "";
  if (container) container.classList.add("hidden");
}

// ============================================================
// INTERACTIVE MAP PICKER & REVERSE GEOCODING
// ============================================================
let pickerMap = null;
let pickerMarker = null;
let currentPickedLocation = {
  lat: -8.055570,
  lng: 110.808121,
  address: "Pracimantoro, Wonogiri, Jawa Tengah, Indonesia",
};

/** Buka peta interaktif untuk memilih titik lokasi secara manual */
function openManualMaps() {
  const mapModal = document.getElementById("map-picker-modal");
  if (!mapModal) return;

  mapModal.classList.add("modal-visible");

  setTimeout(() => {
    initLeafletPickerMap();
  }, 150);
}

function closeMapPickerModal() {
  const mapModal = document.getElementById("map-picker-modal");
  if (mapModal) mapModal.classList.remove("modal-visible");
}

function initLeafletPickerMap() {
  const mapContainer = document.getElementById("map-container");
  if (!mapContainer) return;

  // Default titik awal: Pracimantoro, Wonogiri, Jawa Tengah, Indonesia
  const defaultLat = -8.055570;
  const defaultLng = 110.808121;
  const startLat = userLocation ? parseFloat(userLocation.lat) : defaultLat;
  const startLng = userLocation ? parseFloat(userLocation.lng) : defaultLng;

  if (!pickerMap) {
    pickerMap = L.map("map-container", {
      center: [startLat, startLng],
      zoom: 15,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Tampilan: OpenFreeMap',
      maxZoom: 19,
    }).addTo(pickerMap);

    pickerMarker = L.marker([startLat, startLng], { draggable: true }).addTo(pickerMap);

    pickerMap.on("click", function (e) {
      updatePickerLocation(e.latlng.lat, e.latlng.lng);
    });

    pickerMarker.on("dragend", function () {
      const coord = pickerMarker.getLatLng();
      updatePickerLocation(coord.lat, coord.lng);
    });
  } else {
    pickerMap.invalidateSize();
    pickerMap.setView([startLat, startLng], 15);
    pickerMarker.setLatLng([startLat, startLng]);
  }

  updatePickerLocation(startLat, startLng);
}

function updatePickerLocation(lat, lng) {
  if (pickerMarker) pickerMarker.setLatLng([lat, lng]);

  const titleEl = document.getElementById("map-selected-title");
  const addrEl = document.getElementById("map-selected-address");

  if (titleEl) titleEl.textContent = "Mendeteksi Alamat Lengkap...";
  if (addrEl) addrEl.textContent = `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // Reverse geocoding via OpenStreetMap Nominatim
  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`)
    .then((res) => res.json())
    .then((data) => {
      let addr = data.display_name;
      if (!addr && data.address) {
        const parts = [
          data.address.road,
          data.address.village || data.address.suburb,
          data.address.town || data.address.city_district || "Pracimantoro",
          data.address.county || "Wonogiri",
          data.address.state || "Jawa Tengah",
        ].filter(Boolean);
        addr = parts.join(", ");
      }
      if (!addr) addr = `Pracimantoro, Wonogiri (${lat.toFixed(6)}, ${lng.toFixed(6)})`;

      currentPickedLocation = {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        address: addr,
      };

      if (titleEl) titleEl.textContent = "Alamat Terpilih:";
      if (addrEl) addrEl.textContent = addr;
    })
    .catch(() => {
      const fallbackAddr = `Kecamatan Pracimantoro, Wonogiri (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      currentPickedLocation = {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        address: fallbackAddr,
      };
      if (titleEl) titleEl.textContent = "Titik Terpilih:";
      if (addrEl) addrEl.textContent = fallbackAddr;
    });
}

function confirmMapLocation() {
  const locInput = document.getElementById("wa-location");
  if (locInput && currentPickedLocation.address) {
    locInput.value = `${currentPickedLocation.address} (https://maps.google.com/?q=${currentPickedLocation.lat},${currentPickedLocation.lng})`;
    showToast("Alamat lengkap berhasil ditandai & terhubung ke laporan!", "success");
  }
  closeMapPickerModal();
}

/** Ambil lokasi GPS presisi tinggi untuk modal WhatsApp */
function requestWaLocation() {
  const btn = document.getElementById("btn-wa-gps");
  const locInput = document.getElementById("wa-location");

  if (!navigator.geolocation) {
    showToast("GPS tidak didukung pada perangkat ini.", "error");
    return;
  }

  if (btn) {
    btn.innerHTML = `Mendeteksi lokasi...`;
    btn.disabled = true;
  }

  const TARGET_ACCURACY = 50; // meter
  const MAX_WAIT_MS = 20000;  // 20 detik max
  let watchId = null;
  let bestPos = null;
  let timeoutHandle = null;

  function finalize(pos) {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (timeoutHandle !== null) clearTimeout(timeoutHandle);

    userLocation = {
      lat: pos.coords.latitude.toFixed(6),
      lng: pos.coords.longitude.toFixed(6),
    };
    const accuracy = Math.round(pos.coords.accuracy);
    const mapsUrl = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;

    // Reverse geocode untuk nama alamat
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${userLocation.lat}&lon=${userLocation.lng}&accept-language=id`)
      .then(r => r.json())
      .then(data => {
        const addr = data.display_name || `Pracimantoro, Wonogiri`;
        if (locInput) locInput.value = `${addr} (${mapsUrl})`;
      })
      .catch(() => {
        if (locInput) locInput.value = mapsUrl;
      });

    if (btn) {
      btn.innerHTML = `Lokasi Terdeteksi (±${accuracy}m)`;
      btn.disabled = false;
    }
    showToast(`Lokasi ditemukan! Akurasi ±${accuracy} meter.`, "success");
  }

  // Timeout paksa setelah MAX_WAIT_MS — gunakan posisi terbaik sejauh ini
  timeoutHandle = setTimeout(() => {
    if (bestPos) {
      finalize(bestPos);
    } else {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (btn) {
        btn.innerHTML = `Lokasi Anda Saat Ini`;
        btn.disabled = false;
      }
      showToast("Waktu habis. Pastikan GPS aktif dan coba lagi.", "error");
    }
  }, MAX_WAIT_MS);

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const acc = pos.coords.accuracy;
      // Simpan posisi terbaik (akurasi terkecil)
      if (!bestPos || acc < bestPos.coords.accuracy) {
        bestPos = pos;
        if (btn) btn.innerHTML = `Mendeteksi... (±${Math.round(acc)}m)`;
      }
      // Selesai jika sudah cukup presisi
      if (acc <= TARGET_ACCURACY) {
        finalize(pos);
      }
    },
    (err) => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
      if (btn) {
        btn.innerHTML = `Lokasi Anda Saat Ini`;
        btn.disabled = false;
      }
      const msg = err.code === 1
        ? "Izin GPS ditolak. Aktifkan izin lokasi di pengaturan browser."
        : "Gagal mendeteksi GPS. Coba lagi atau ketik manual.";
      showToast(msg, "error");
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
  );
}

function showWhatsAppModal(service) {
  const modal       = document.getElementById("wa-modal");
  const title       = document.getElementById("wa-modal-title");
  const serviceInfo = document.getElementById("wa-service-info");

  title.textContent = `Lapor ke ${service.name}`;
  serviceInfo.innerHTML = `
    <span class="category-badge"
          style="background:${service.color}18;color:${service.color};border-color:${service.color}35;">
      ${service.categoryLabel}
    </span>
    <strong style="color:${service.color};">${service.name}</strong>`;

  modal.dataset.waNumber   = service.whatsapp;
  modal.dataset.serviceName= service.name;

  // Reset form inputs
  document.getElementById("wa-reporter").value = "";
  document.getElementById("wa-incident").value = "";

  if (userLocation) {
    document.getElementById("wa-location").value =
      `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
  } else {
    document.getElementById("wa-location").value = "";
  }

  // Clear photo selection & preview
  clearSelectedPhoto();

  const btnGps = document.getElementById("btn-wa-gps");
  if (btnGps) {
    btnGps.innerHTML = "Lokasi Anda Saat Ini";
    btnGps.disabled = false;
  }

  document.getElementById("wa-notes").value = "";

  modal.classList.add("modal-visible");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("wa-reporter").focus(), 100);
}

function closeWhatsAppModal() {
  document.getElementById("wa-modal").classList.remove("modal-visible");
  document.body.style.overflow = "";
}

function submitWhatsAppReport() {
  const modal       = document.getElementById("wa-modal");
  const waNumber    = modal.dataset.waNumber;
  const serviceName = modal.dataset.serviceName;

  const reporter    = document.getElementById("wa-reporter").value.trim();
  const incident    = document.getElementById("wa-incident").value.trim();
  const location    = document.getElementById("wa-location").value.trim();
  const photoInput  = document.getElementById("wa-photo");
  const notes       = document.getElementById("wa-notes").value.trim();

  // Validasi 3 Wajib Diisi
  if (!reporter) {
    showToast("Harap isi Nama Pelapor (Wajib).", "error");
    document.getElementById("wa-reporter").focus();
    return;
  }

  if (!incident) {
    showToast("Harap isi Jenis Kejadian (Wajib).", "error");
    document.getElementById("wa-incident").focus();
    return;
  }

  if (!location) {
    showToast("Harap isi Lokasi Kejadian (Wajib).", "error");
    document.getElementById("wa-location").focus();
    return;
  }

  const hasPhoto    = photoInput && photoInput.files && photoInput.files.length > 0;
  const photoFile   = hasPhoto ? photoInput.files[0] : null;

  const now = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  let photoText;
  if (hasPhoto) {
    photoText = `⚠️ Foto disertakan — lihat foto yang dikirim bersamaan`;
  } else {
    photoText = "Tidak ada";
  }

  const message =
`🚨 *LAPORAN DARURAT — PRACI SIAGA* 🚨

📋 *Kepada:* ${serviceName}
👤 *Pelapor:* ${reporter}
🔴 *Jenis Kejadian:* ${incident}
📍 *Lokasi:* ${location}
📷 *Foto Kejadian:* ${photoText}
📝 *Keterangan Tambahan:* ${notes || "-"}
⏰ *Waktu:* ${now} WIB

_Pesan ini dikirim via aplikasi PRACI SIAGA_
_Layanan Darurat Terintegrasi Kecamatan Pracimantoro_`;

  if (hasPhoto) {
    tryWebShare(waNumber, message, serviceName, photoFile);
  } else {
    waOpen(waNumber, message);
    closeWhatsAppModal();
    showToast(`Membuka WhatsApp ${serviceName}...`, "success");
    trackAction("whatsapp_report", serviceName);
  }
}

// ============================================================
// WEB SHARE API + FALLBACK KE MODAL PANDUAN FOTO
// ============================================================

/**
 * Coba bagikan foto + pesan via Web Share API (native share sheet).
 * Jika tidak didukung (desktop / HTTP) → fallback ke modal panduan foto manual.
 * @param {string}  waNumber    - Nomor WA tujuan (format +62...)
 * @param {string}  message     - Teks pesan laporan
 * @param {string}  serviceName - Nama instansi
 * @param {File}    file        - File foto dari input
 * @param {boolean} skipClose   - Jika true, modal WA sudah ditutup sebelumnya
 */
function tryWebShare(waNumber, message, serviceName, file, skipClose = false) {
  const shareData = {
    title: 'Laporan Darurat PRACI SIAGA',
    text: message,
    files: [file],
  };

  const webShareSupported =
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare(shareData);

  if (webShareSupported) {
    // ✅ Web Share API didukung — buka share sheet native
    navigator.share(shareData)
      .then(() => {
        if (!skipClose) closeWhatsAppModal();
        showToast(`📎 Foto + pesan laporan berhasil dibagikan ke WhatsApp!`, "success");
        trackAction("web_share_api", serviceName);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          // User membatalkan share sheet — kembalikan ke modal panduan
          showToast("Berbagi dibatalkan.", "error");
        } else {
          // Error lain — fallback ke modal panduan
          showPhotoGuideModal(waNumber, message, serviceName, file);
        }
      });
  } else {
    // ❌ Tidak didukung (desktop / HTTP) — fallback ke modal panduan
    showPhotoGuideModal(waNumber, message, serviceName, file);
  }
}

/**
 * Tampilkan modal preview foto + instruksi cara melampirkan ke WA.
 * Fallback jika Web Share API tidak tersedia.
 */
function showPhotoGuideModal(waNumber, message, serviceName, file) {
  const modal    = document.getElementById("photo-guide-modal");
  const imgEl    = document.getElementById("pg-preview-img");
  const nameEl   = document.getElementById("pg-file-name");
  const sizeEl   = document.getElementById("pg-file-size");
  const saveBtn  = document.getElementById("pg-save-btn");

  if (!modal) return;

  // Simpan data untuk digunakan saat tombol "Buka WhatsApp" diklik
  modal.dataset.waNumber    = waNumber;
  modal.dataset.message     = message;
  modal.dataset.serviceName = serviceName;

  // Simpan referensi file asli di DOM modal agar bisa diakses saat konfirmasi
  modal._photoFile = file;

  // Tampilkan nama & ukuran file
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";

  // Render preview foto
  const reader = new FileReader();
  reader.onload = function (e) {
    if (imgEl) {
      imgEl.src = e.target.result;
      imgEl.dataset.dataUrl = e.target.result;
    }

    // Siapkan tombol simpan/unduh
    if (saveBtn) {
      saveBtn.onclick = function () {
        const a = document.createElement("a");
        a.href = e.target.result;
        a.download = file.name || "foto-laporan.jpg";
        a.click();
        showToast("Foto berhasil diunduh ke perangkat Anda 📥", "success");
      };
    }
  };
  reader.readAsDataURL(file);

  modal.classList.add("modal-visible");
}

function closePhotoGuideModal() {
  const modal = document.getElementById("photo-guide-modal");
  if (modal) modal.classList.remove("modal-visible");
}

function confirmSendWithPhoto() {
  const modal       = document.getElementById("photo-guide-modal");
  const waNumber    = modal.dataset.waNumber;
  const message     = modal.dataset.message;
  const serviceName = modal.dataset.serviceName;
  const imgEl       = document.getElementById("pg-preview-img");

  closePhotoGuideModal();
  closeWhatsAppModal();

  // Jika ada file asli tersimpan di modal, coba Web Share API lagi
  if (modal._photoFile) {
    setTimeout(() => tryWebShare(waNumber, message, serviceName, modal._photoFile, true), 200);
  } else {
    // Fallback ke wa.me URL saja (tanpa foto)
    setTimeout(() => {
      waOpen(waNumber, message);
      showToast(`Membuka WhatsApp ${serviceName}...`, "success");
      trackAction("whatsapp_report_with_photo", serviceName);
    }, 200);
  }
}

// ============================================================
// GPS GEOLOCATION
// ============================================================
function requestLocation() {
  const btn    = document.getElementById("gps-btn");
  const status = document.getElementById("gps-status");

  if (!navigator.geolocation) {
    showToast("Browser Anda tidak mendukung GPS. Gunakan browser modern.", "error");
    return;
  }

  btn.innerHTML = `<span class="spinner" aria-hidden="true"></span> Mengambil lokasi...`;
  btn.disabled  = true;
  status.textContent = "Mendeteksi lokasi GPS Anda, harap tunggu...";

  const TARGET_ACCURACY = 50; // meter
  const MAX_WAIT_MS = 20000;  // 20 detik
  let watchId = null;
  let bestPos = null;
  let timeoutHandle = null;

  function finalize(pos) {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (timeoutHandle !== null) clearTimeout(timeoutHandle);

    userLocation = {
      lat: pos.coords.latitude.toFixed(6),
      lng: pos.coords.longitude.toFixed(6),
    };
    const accuracy = Math.round(pos.coords.accuracy);
    const mapsUrl = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;

    status.innerHTML = `<img src="assets/centang-hijau.png" alt="" class="gps-status-icon" /> Lokasi terdeteksi dengan akurasi ±${accuracy}m. <a href="${mapsUrl}" target="_blank" rel="noopener" class="gps-link"><img src="assets/pin-lokasi.png" alt="" class="gps-link-icon" /> Lihat di Google Maps</a>`;
    btn.innerHTML    = `<img src="assets/pin-lokasi.png" alt="" class="gps-btn-icon" /> Lokasi Aktif (±${accuracy}m)`;
    btn.disabled     = false;
    btn.classList.add("located");

    // Auto-isi field di modal jika sudah terbuka
    const locField = document.getElementById("wa-location");
    if (locField && !locField.value) locField.value = mapsUrl;

    showToast(`Lokasi ditemukan! Akurasi ±${accuracy} meter.`, "success");
    trackAction("gps", `lokasi diambil akurasi ${accuracy}m`);
  }

  // Timeout paksa — gunakan posisi terbaik yang sudah dikumpulkan
  timeoutHandle = setTimeout(() => {
    if (bestPos) {
      finalize(bestPos);
    } else {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      btn.innerHTML = `<img src="assets/pin-lokasi.png" alt="" class="gps-btn-icon" /> Ambil Lokasi GPS Saya`;
      btn.disabled  = false;
      const msg = "Waktu habis. Pastikan GPS aktif dan coba lagi.";
      status.textContent = "⚠️ " + msg;
      showToast(msg, "error");
    }
  }, MAX_WAIT_MS);

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const acc = pos.coords.accuracy;
      // Simpan posisi terbaik (akurasi terkecil)
      if (!bestPos || acc < bestPos.coords.accuracy) {
        bestPos = pos;
        status.textContent = `Mendeteksi... akurasi saat ini ±${Math.round(acc)}m`;
        btn.innerHTML = `<span class="spinner" aria-hidden="true"></span> ±${Math.round(acc)}m`;
      }
      // Selesai jika sudah cukup presisi
      if (acc <= TARGET_ACCURACY) {
        finalize(pos);
      }
    },
    (err) => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
      btn.innerHTML = `<img src="assets/pin-lokasi.png" alt="" class="gps-btn-icon" /> Ambil Lokasi GPS Saya`;
      btn.disabled  = false;
      const msg =
        err.code === 1
          ? "Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser."
          : "Gagal mendapatkan lokasi. Coba lagi atau isi manual.";
      status.textContent = "⚠️ " + msg;
      showToast(msg, "error");
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
  );
}

// ============================================================
// INFORMASI PENTING TABS & FLOWS
// ============================================================
function selectInfoTopic(topicId) {
  document.querySelectorAll(".info-topic-btn").forEach((btn) => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
  });
  document.querySelectorAll(".info-topic-panel").forEach((panel) => {
    panel.classList.add("hidden");
  });

  const activeBtn = document.getElementById(`tab-topic-${topicId}`);
  const activePanel = document.getElementById(`panel-topic-${topicId}`);

  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.setAttribute("aria-selected", "true");
  }
  if (activePanel) {
    activePanel.classList.remove("hidden");
    observeCards();
  }
}

function selectSpktFlow(flowId) {
  document.querySelectorAll(".spkt-flow-tab-btn").forEach((btn) => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
  });
  document.querySelectorAll(".spkt-flow-content").forEach((content) => {
    content.classList.add("hidden");
  });

  const activeBtn = document.getElementById(`spkt-tab-${flowId}`);
  const activeContent = document.getElementById(`spkt-flow-${flowId}`);

  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.setAttribute("aria-selected", "true");
  }
  if (activeContent) {
    activeContent.classList.remove("hidden");
  }
}

// ============================================================
// FIRST AID GUIDES
// ============================================================
function renderFirstAidGuides() {
  const container = document.getElementById("first-aid-container");
  if (!container) return;
  container.innerHTML = FIRST_AID_GUIDES.map(
    (guide) => `
    <div class="first-aid-card" role="listitem"
         style="border-left-color:${guide.color};background:${guide.bgColor};">
      <div class="first-aid-header">
        <span class="first-aid-icon" aria-hidden="true">${guide.icon}</span>
        <h3 class="first-aid-title" style="color:${guide.color};">${guide.title}</h3>
      </div>
      <ol class="first-aid-steps">
        ${guide.steps.map((step) => `<li>${step}</li>`).join("")}
      </ol>
    </div>
  `
  ).join("");
}

// ============================================================
// PANIC BUTTON MODAL
// ============================================================
function handlePanicButton() {
  document.getElementById("panic-modal").classList.add("modal-visible");
  document.body.style.overflow = "hidden";
}

function closePanicModal() {
  document.getElementById("panic-modal").classList.remove("modal-visible");
  document.body.style.overflow = "";
}

// ============================================================
// TRACKING (console only — no external dependency)
// ============================================================
function trackAction(type, name) {
  console.log(`[PRACI SIAGA] ${type.toUpperCase()} | ${name} | ${new Date().toLocaleTimeString("id-ID")}`);
}

// ============================================================
// SMOOTH SCROLL
// ============================================================
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
// INTERSECTION OBSERVER — kartu animasi masuk
// ============================================================
let cardObserver = null;

function observeCards() {
  if (cardObserver) cardObserver.disconnect();
  cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("animate-in");
          }, idx * 60);
          cardObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".service-card, .first-aid-card").forEach((el) =>
    cardObserver.observe(el)
  );
}

// Counter animation untuk hero stats
function animateCounter(el, target, suffix) {
  let cur = 0;
  const step = Math.ceil(target / 40);
  const run = () => {
    cur = Math.min(cur + step, target);
    el.textContent = cur + suffix;
    if (cur < target) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

function setupCounters() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || "";
          animateCounter(el, target, suffix);
          obs.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll(".stat-number[data-count], .stat-plain-number[data-count]").forEach((el) => obs.observe(el));
}

// ============================================================
// CLOSE MODAL ON BACKDROP CLICK / ESC
// ============================================================
document.addEventListener("click", (e) => {
  if (e.target.id === "wa-modal")          closeWhatsAppModal();
  if (e.target.id === "panic-modal")       closePanicModal();
  if (e.target.id === "photo-guide-modal") closePhotoGuideModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeWhatsAppModal(); closePanicModal(); closePhotoGuideModal(); }
});

// ============================================================
// BANNER SLIDER
// ============================================================
function initBannerSlider() {
  const track    = document.getElementById('banner-track');
  const dotsEl   = document.getElementById('banner-dots');
  if (!track || !dotsEl) return;

  const originalSlides = Array.from(track.querySelectorAll('.banner-slide'));
  const dots           = dotsEl.querySelectorAll('.banner-dot');
  const COUNT          = originalSlides.length; // 7 banner
  const INTERVAL       = 4000;                  // 4 detik
  if (COUNT === 0) return;

  // Clone slide pertama untuk transisi loop tak terbatas yang mulus
  const firstClone = originalSlides[0].cloneNode(true);
  firstClone.setAttribute('aria-hidden', 'true');
  track.appendChild(firstClone);

  let current = 0;
  let timer   = null;
  let paused  = false;

  function updateDots(idx) {
    const activeIdx = idx % COUNT;
    dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
  }

  function goTo(idx, animated = true) {
    current = idx;
    track.style.transition = animated ? '' : 'none';
    track.style.transform  = `translateX(-${current * 100}%)`;
    updateDots(current);
  }

  function next() {
    goTo(current + 1, true);
  }

  function prev() {
    if (current === 0) {
      goTo(COUNT, false);
      void track.offsetWidth;
      goTo(COUNT - 1, true);
    } else {
      goTo(current - 1, true);
    }
  }

  // Reset tanpa kedip saat animasi selesai pada clone slide
  track.addEventListener('transitionend', (e) => {
    if (e.target !== track) return;
    if (current >= COUNT) {
      goTo(0, false);
    }
  });

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      if (!paused) next();
    }, INTERVAL);
  }

  // Klik pada indikator dot
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetIdx = parseInt(dot.dataset.idx, 10);
      if (!isNaN(targetIdx)) {
        goTo(targetIdx, true);
        startTimer();
      }
    });
  });

  // Pause saat kursor hover & swipe di mobile
  const slider = document.getElementById('banner-slider');
  if (slider) {
    slider.addEventListener('mouseenter', () => { paused = true; });
    slider.addEventListener('mouseleave', () => { paused = false; });

    let touchStartX = 0;
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        if (dx < 0) {
          next();
        } else {
          prev();
        }
        startTimer();
      }
    }, { passive: true });
  }

  goTo(0, false);
  startTimer();
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  applyFilters();         // renders cards & calls observeCards()
  renderFirstAidGuides();
  setupCounters();
  initBannerSlider();

  // Search
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.addEventListener("input", handleSearch);

  // GPS
  const gpsBtn = document.getElementById("gps-btn");
  if (gpsBtn) gpsBtn.addEventListener("click", requestLocation);

  // WA form
  const waForm = document.getElementById("wa-form");
  if (waForm) waForm.addEventListener("submit", (e) => { e.preventDefault(); submitWhatsAppReport(); });

  // Footer year
  const yr = document.getElementById("current-year");
  if (yr) yr.textContent = new Date().getFullYear();

  // Stat cards observe
  const statObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("animate-in"); statObs.unobserve(e.target); } }),
    { threshold: 0.1 }
  );
  document.querySelectorAll(".stat-card").forEach((el) => statObs.observe(el));
});
