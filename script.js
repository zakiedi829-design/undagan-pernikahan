// ================================================================
// FIREBASE — inisialisasi (config reuse dari project existing developer)
// ================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHW9qNpvbb3H8147u_MQ0iKPC3yHzcZSc",
  authDomain: "nikah-3d7ff.firebaseapp.com",
  databaseURL: "https://nikah-3d7ff-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nikah-3d7ff",
  storageBucket: "nikah-3d7ff.firebasestorage.app",
  messagingSenderId: "17637828840",
  appId: "1:17637828840:web:bda8b4ece47b30c6f4415d",
  measurementId: "G-1B2BY6PDPE",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const rsvpRef = ref(db, "rsvp");

// ================================================================
// UTIL
// ================================================================
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad2 = (n) => String(Math.max(n, 0)).padStart(2, "0");

// ================================================================
// NAMA TAMU DARI URL (?to=NamaTamu) — dipertahankan dari kode lama
// ================================================================
function initGuestName() {
  const params = new URLSearchParams(window.location.search);
  const guest = params.get("to");
  const guestEl = document.getElementById("guestName");
  if (guest && guestEl) {
    guestEl.textContent = decodeURIComponent(guest.replace(/\+/g, " "));
  }
}

// ================================================================
// SONGKET DIVIDER — signature element (motif pucuk rebung)
// Di-inject via JS (bukan hardcode di HTML) supaya tiap instance
// punya <path> unik yang bisa jadi target animasi GSAP terpisah.
// ================================================================
const SONGKET_PATH_D =
  "M0,45 L37.5,15 L75,45 L112.5,15 L150,45 L187.5,15 L225,45 L262.5,15 L300,45 " +
  "L337.5,15 L375,45 L412.5,15 L450,45 L487.5,15 L525,45 L562.5,15 L600,45";
const SONGKET_DOTS_X = [37.5, 112.5, 187.5, 262.5, 337.5, 412.5, 487.5, 562.5];

function buildSongketSVG(uniqueId) {
  const dots = SONGKET_DOTS_X.map((x) => `<circle cx="${x}" cy="15" r="2.5"></circle>`).join("");
  return `
    <svg viewBox="0 0 600 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path id="${uniqueId}" d="${SONGKET_PATH_D}"></path>
      <g>${dots}</g>
    </svg>
  `;
}

function initSongketDividers() {
  const dividers = document.querySelectorAll("[data-songket]");
  dividers.forEach((el, i) => {
    const id = `songket-path-${i}`;
    el.innerHTML = buildSongketSVG(id);
  });
  return dividers;
}

// ================================================================
// GSAP SCROLL REVEAL + SONGKET DRAW-IN
// (mengganti mekanisme manual getBoundingClientRect dari kode lama)
// ================================================================
function initScrollAnimations(dividers) {
  if (prefersReducedMotion || typeof gsap === "undefined") {
    document.body.classList.add("reveal-fallback");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Variasi animasi reveal per elemen, berdasarkan atribut data-reveal
  // (fade-up default, fade-left, fade-right, scale) — supaya tiap section
  // terasa beda, tidak monoton fade-up semua.
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    const type = el.dataset.reveal || "fade-up";
    let fromVars = { opacity: 0, y: 28 };
    if (type === "fade-left") fromVars = { opacity: 0, x: -32 };
    if (type === "fade-right") fromVars = { opacity: 0, x: 32 };
    if (type === "scale") fromVars = { opacity: 0, scale: 0.92 };

    gsap.fromTo(el, fromVars, {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });

  // Stagger reveal untuk grup elemen (mis. grid foto Moments)
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    gsap.fromTo(
      group.children,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: group,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  // Songket-line draw (stroke-dasharray reveal) tiap pembatas section
  dividers.forEach((el) => {
    const path = el.querySelector("path");
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.4,
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });
  });

  // Catatan: parallax hero sudah ditangani CSS (animasi Ken Burns pada .hero__layer--bg),
  // sengaja tidak dobel-animasikan lewat GSAP supaya transform tidak saling menimpa.
}

// ================================================================
// HERO INTRO — animasi saat halaman pertama kali dibuka (bukan scroll-based)
// Background muncul duluan, lalu beberapa milidetik kemudian "Dear" box
// dan teks "The wedding of / N & Y / nama / tanggal" muncul menyusul.
// ================================================================
function initHeroIntro() {
  if (prefersReducedMotion || typeof gsap === "undefined") {
    document.querySelectorAll("[data-reveal-intro]").forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
    return;
  }

  const guest = document.querySelector('[data-reveal-intro="scale"]');
  const textItems = document.querySelectorAll(".hero__text-card [data-reveal-intro]");

  const tl = gsap.timeline({ delay: 0.4 }); // <- jeda 400ms sebelum teks mulai muncul

  tl.fromTo(
    guest,
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
  ).fromTo(
    textItems,
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out" },
    "-=0.4" // sedikit overlap dengan animasi "Dear" biar tidak kaku
  );
}

// ================================================================
// HERO — buka undangan + trigger musik (bagian 10)
// ================================================================
function initHeroOpen() {
  const body = document.body;
  const openBtn = document.getElementById("openInvitation");
  const audio = document.getElementById("backsound");

  body.classList.add("is-locked");

  const introVideo = document.querySelector("#video video");

  openBtn.addEventListener("click", () => {
    body.classList.remove("is-locked");
    body.classList.add("is-open");

    // Refresh posisi ScrollTrigger DULU sebelum scroll — supaya posisi section
    // video sudah akurat (sebelumnya body masih terkunci/overflow hidden,
    // jadi posisi lama belum tentu benar). Kalau refresh dipanggil SETELAH
    // scrollIntoView, animasi smooth-scroll-nya keburu keinterupsi/reset.
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();

    // Browser modern butuh trigger klik untuk autoplay audio/video — tombol ini triggernya
    audio.play().catch(() => {
      // Jika browser tetap memblokir (kebijakan autoplay lebih ketat), abaikan diam-diam;
      // tamu masih bisa menyalakan lewat tombol speaker mengambang.
    });

    // Scroll halus ke section video setelah undangan "dimulai"
    document.getElementById("video")?.scrollIntoView({ behavior: "smooth" });

    // Delay video play agar scroll sudah selesai terlebih dahulu
    setTimeout(() => {
      if (introVideo) {
        introVideo.muted = false; // gesture klik ini sudah cukup untuk izinkan audio video juga
        introVideo.play().catch(() => {
          // fallback: kalau browser tetap menolak audio video autoplay, coba mode mute
          introVideo.muted = true;
          introVideo.play().catch(() => {});
        });
      }
    }, 600);

    openBtn.disabled = true;
    openBtn.style.display = "none";
  });
}

// ================================================================
// KONTROL MUSIK MENGAMBANG (mute/unmute)
// ================================================================
function initSoundToggle() {
  const btn = document.getElementById("soundToggle");
  const icon = document.getElementById("soundIcon");
  const audio = document.getElementById("backsound");

  btn.addEventListener("click", () => {
    const nowMuted = !audio.muted;
    audio.muted = nowMuted;
    btn.setAttribute("aria-pressed", String(!nowMuted));
    btn.setAttribute("aria-label", nowMuted ? "Nyalakan musik" : "Matikan musik");
    icon.src = nowMuted ? "assets/images/speaker-off.svg" : "assets/images/speaker-on.svg";
  });
}

// ================================================================
// AUTO-ADVANCE SCROLL (semi-otomatis) — bagian 11
// Scroll dilakukan bertahap per 1 layar (bukan loncat antar-section),
// jadi section yang lebih tinggi dari 1 layar (mis. profil) tetap
// terlewati sepenuhnya, tidak ada bagian yang ke-skip.
// Animasi scroll pakai easing custom (bukan scrollIntoView bawaan browser)
// supaya gerakannya halus & perlahan, bukan "loncat/maksa".
// Berhenti otomatis begitu tamu scroll/swipe/keyboard sendiri (permanen).
// ================================================================
function initAutoAdvance() {
  const STOP_BEFORE_ID = "ucapan"; // auto-scroll berhenti begitu sampai section ini (rsvp selesai)
  const STEP_DELAY = 1500;         // ms — jeda sebelum tiap langkah scroll (bisa diubah)
  const SCROLL_DURATION = 1800;    // ms — durasi animasi tiap langkah scroll (biar halus)
  const STEP_FRACTION = 0.3;      // seberapa jauh tiap langkah (92% tinggi layar, sedikit overlap)

  let userTookControl = false;
  let timer = null;

  function stopAuto() {
    userTookControl = true;
    clearTimeout(timer);
  }
  ["wheel", "touchmove", "keydown"].forEach((evt) => {
    window.addEventListener(evt, stopAuto, { passive: true });
  });

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothScrollBy(deltaY, duration) {
    return new Promise((resolve) => {
      const startY = window.scrollY;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      const targetY = Math.min(startY + deltaY, maxY);
      const startTime = performance.now();

      function step(now) {
        if (userTookControl) return resolve();
        const progress = Math.min((now - startTime) / duration, 1);
        window.scrollTo(0, startY + (targetY - startY) * easeInOutCubic(progress));
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  async function loop() {
    if (userTookControl) return;

    const stopEl = document.getElementById(STOP_BEFORE_ID);
    const stopY = stopEl ? stopEl.offsetTop : document.documentElement.scrollHeight;

    if (window.scrollY + window.innerHeight >= stopY) return; // sudah sampai batas berhenti

    await smoothScrollBy(window.innerHeight * STEP_FRACTION, SCROLL_DURATION);
    if (userTookControl) return;

    timer = setTimeout(loop, STEP_DELAY);
  }

  function startWhenVideoReady() {
    const videoSection = document.getElementById("video");
    const introVideo = document.querySelector("#video video");
    if (!videoSection || !introVideo) {
      loop();
      return;
    }

    const beginLoop = () => {
      if (!userTookControl) timer = setTimeout(loop, 2000); // jeda 2 detik setelah video selesai
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            obs.disconnect();
            introVideo.ended
              ? beginLoop()
              : introVideo.addEventListener("ended", beginLoop, { once: true });
          }
        });
      },
      { threshold: [0.6] }
    );
    obs.observe(videoSection);
  }

  startWhenVideoReady();
}
// ================================================================
// COUNTDOWN SECTION
// ================================================================
function initCountdown() {
  const grid = document.getElementById("countdownGrid");
  if (!grid) return;

  const targetDate = new Date(grid.dataset.weddingDate).getTime();
  const dEl = document.getElementById("cdDays");
  const hEl = document.getElementById("cdHours");
  const mEl = document.getElementById("cdMinutes");
  const sEl = document.getElementById("cdSeconds");

  function tick() {
    const diff = targetDate - Date.now();
    if (diff <= 0) {
      dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = "00";
      clearInterval(timer);
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    dEl.textContent = pad2(days);
    hEl.textContent = pad2(hours);
    mEl.textContent = pad2(minutes);
    sEl.textContent = pad2(seconds);
  }

  tick();
  const timer = setInterval(tick, 1000);
}

// ================================================================
// SAVE THE DATE -> GOOGLE CALENDAR LINK
// ================================================================
function initSaveCalendar() {
  const btn = document.getElementById("saveCalendar");
  const grid = document.getElementById("countdownGrid");
  if (!btn || !grid) return;

  btn.addEventListener("click", () => {
    const start = new Date(grid.dataset.weddingDate);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // asumsi durasi acara 3 jam

    const toGCalFormat = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: "Pernikahan Nadia & Rachman",
      dates: `${toGCalFormat(start)}/${toGCalFormat(end)}`,
      details: "Dengan penuh syukur, kami mengundang Anda untuk turut mendoakan dan menyaksikan hari bahagia kami.",
      location: "Surabaya, Jawa Timur", // GANTI: alamat lengkap lokasi akad/resepsi asli
    });

    window.open(`https://www.google.com/calendar/render?${params.toString()}`, "_blank", "noopener,noreferrer");
  });
}

// ================================================================
// SALIN REKENING (Kado Digital)
// ================================================================
function initCopyAccount() {
  document.querySelectorAll(".kado__copy").forEach((btn) => {
    const originalLabel = btn.textContent;
    btn.addEventListener("click", async () => {
      const number = btn.dataset.copyTarget;
      try {
        await navigator.clipboard.writeText(number);
        btn.textContent = "Tersalin!";
        btn.classList.add("is-copied");
      } catch {
        btn.textContent = "Gagal, salin manual";
      }
      setTimeout(() => {
        btn.textContent = originalLabel;
        btn.classList.remove("is-copied");
      }, 2000);
    });
  });
}

// ================================================================
// RSVP — SUBMIT KE FIREBASE (path: rsvp)
// ================================================================
function initRsvpForm() {
  const form = document.getElementById("rsvpForm");
  const submitBtn = document.getElementById("rsvpSubmit");
  const errorEl = document.getElementById("rsvpError");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const nama = form.nama.value.trim();
    const ucapan = form.ucapan.value.trim();
    const hadirInput = form.querySelector('input[name="hadir"]:checked');

    if (!nama || !ucapan || !hadirInput) {
      errorEl.textContent = "Mohon lengkapi nama, ucapan, dan status kehadiran.";
      errorEl.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";

    try {
      await push(rsvpRef, {
        nama,
        ucapan,
        hadir: hadirInput.value,
        created_at: Date.now(),
      });
      form.reset();
    } catch (err) {
      if (err && err.code === "PERMISSION_DENIED") {
        errorEl.textContent =
          "Pengiriman ditolak server. Developer: cek Firebase Console > Realtime Database > Rules (write belum diizinkan).";
      } else {
        errorEl.textContent = "Terjadi kesalahan saat mengirim. Silakan coba lagi.";
      }
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Kirim RSVP";
    }
  });
}

// ================================================================
// HASIL RSVP — LISTENER REAL-TIME (onValue)
// ================================================================
const UCAPAN_PAGE_SIZE = 5;
let ucapanAllItems = [];
let ucapanCurrentPage = 1;

function renderUcapanCard(item) {
  const card = document.createElement("article");
  card.className = "ucapan-card";
  const statusClass = item.hadir === "Hadir" ? "ucapan-card__status--hadir" : "ucapan-card__status--tidak";

  const nameEl = document.createElement("div");
  nameEl.className = "ucapan-card__top";

  const nameSpan = document.createElement("span");
  nameSpan.className = "ucapan-card__name";
  nameSpan.textContent = item.nama || "Tamu";

  const statusSpan = document.createElement("span");
  statusSpan.className = `ucapan-card__status ${statusClass}`;
  statusSpan.textContent = item.hadir || "-";

  nameEl.append(nameSpan, statusSpan);

  const textEl = document.createElement("p");
  textEl.className = "ucapan-card__text";
  textEl.textContent = item.ucapan || "";

  card.append(nameEl, textEl);
  return card;
}

function renderUcapanPage() {
  const listEl = document.getElementById("ucapanList");
  const emptyEl = document.getElementById("ucapanEmpty");
  const paginationEl = document.getElementById("ucapanPagination");
  const prevBtn = document.getElementById("ucapanPrev");
  const nextBtn = document.getElementById("ucapanNext");
  const pageInfo = document.getElementById("ucapanPageInfo");

  listEl.querySelectorAll(".ucapan-card").forEach((el) => el.remove());

  const totalItems = ucapanAllItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / UCAPAN_PAGE_SIZE));
  ucapanCurrentPage = Math.min(ucapanCurrentPage, totalPages);

  if (totalItems === 0) {
    emptyEl.hidden = false;
    paginationEl.hidden = true;
    return;
  }
  emptyEl.hidden = true;
  paginationEl.hidden = totalPages <= 1;

  const start = (ucapanCurrentPage - 1) * UCAPAN_PAGE_SIZE;
  const pageItems = ucapanAllItems.slice(start, start + UCAPAN_PAGE_SIZE);
  pageItems.forEach((item) => listEl.appendChild(renderUcapanCard(item)));

  pageInfo.textContent = `${ucapanCurrentPage} / ${totalPages}`;
  prevBtn.disabled = ucapanCurrentPage <= 1;
  nextBtn.disabled = ucapanCurrentPage >= totalPages;
}

function initUcapanList() {
  const listEl = document.getElementById("ucapanList");
  const emptyEl = document.getElementById("ucapanEmpty");
  const prevBtn = document.getElementById("ucapanPrev");
  const nextBtn = document.getElementById("ucapanNext");
  if (!listEl) return;

  prevBtn.addEventListener("click", () => {
    ucapanCurrentPage = Math.max(1, ucapanCurrentPage - 1);
    renderUcapanPage();
  });
  nextBtn.addEventListener("click", () => {
    ucapanCurrentPage += 1;
    renderUcapanPage();
  });

  onValue(
    rsvpRef,
    (snapshot) => {
      const data = snapshot.val();
      ucapanAllItems = data
        ? Object.values(data).sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
        : [];
      ucapanCurrentPage = 1; // data baru masuk -> kembali ke halaman terbaru
      renderUcapanPage();
    },
    (error) => {
      emptyEl.hidden = false;
      emptyEl.textContent =
        error.code === "PERMISSION_DENIED"
          ? "Belum bisa menampilkan ucapan (cek Firebase Rules: read belum diizinkan)."
          : "Belum bisa memuat ucapan saat ini.";
    }
  );
}

// ================================================================
// INIT
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  initGuestName();
  const dividers = initSongketDividers();
  initScrollAnimations(dividers);
  initHeroIntro();
  initHeroOpen();
  initSoundToggle();
  initAutoAdvance();
  initCountdown();
  initSaveCalendar();
  initCopyAccount();
  initRsvpForm();
  initUcapanList();
});
