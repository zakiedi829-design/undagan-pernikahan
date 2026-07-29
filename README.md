# Undangan Pernikahan Digital — Nadia & Yusuf

Website undangan pernikahan tema Melayu-Islami. HTML/CSS/JS vanilla (tanpa build tool),
data RSVP realtime lewat Firebase Realtime Database, siap deploy ke Netlify.

## Struktur file

```
index.html      -> semua 11 section (skeleton lengkap)
style.css       -> design token + layout + responsive
script.js       -> ES module: hero/musik, GSAP scroll reveal, countdown,
                   save-to-calendar, salin rekening, RSVP + realtime Firebase
netlify.toml    -> config header/cache untuk Netlify (opsional)
assets/
  images/       -> ikon, songket-pattern.svg, placeholder foto
  music/        -> backsound.mp3 (taruh file musik kamu di sini)
  video/        -> wedding-video.mp4 (opsional)
```

## Yang WAJIB kamu ganti sebelum publish

Semua titik ini sudah ditandai komentar `<!-- GANTI: ... -->` langsung di `index.html`.
Ringkasannya:

| Lokasi | Ganti apa |
|---|---|
| `assets/images/hero-bg.jpg` + `hero-boat.webp` + `hero-plants.webp` + `hero-frame.webp` + `hero-birds.webp` + `hero-particles.webp` | Hero sekarang pakai foto asli hasil AI generate, dipisah 6 layer supaya tiap elemen (perahu, tanaman, bingkai, burung, partikel) bisa dianimasikan sendiri-sendiri. Kalau mau ganti kualitas/versi baru, timpa file dengan nama yang sama persis, tidak perlu ubah kode |
| `assets/images/bride-illustration-placeholder.svg` | Ilustrasi wajah mempelai wanita (`bride-illustration.png`) — **bukan foto asli** |
| `assets/images/groom-illustration-placeholder.svg` | Ilustrasi wajah mempelai pria (`groom-illustration.png`) — **bukan foto asli** |
| `assets/images/moments/moment-N-placeholder.svg` | Foto real dari klien (gallery Moments — ini section yang boleh pakai foto asli) |
| `assets/video/wedding-video.mp4` + poster | Video final (section 2, opsional) |
| Section Profil — link Instagram (2 buah) | Link IG asli kedua mempelai |
| Section Countdown — `data-wedding-date` di `#countdownGrid` | Tanggal & jam pernikahan asli (format ISO, contoh: `2026-11-21T08:00:00+07:00`) |
| Section Wedding Event — nama lokasi, alamat, link Google Maps (Akad & Resepsi) | Data lokasi asli |
| Section Kado Digital — nomor rekening & nama bank (2 kartu) | Rekening asli |
| Footer — link Instagram & TikTok | Akun IG/TikTok kamu sendiri (pembuat website, bukan mempelai) |
| `og:image` di `<head>` | Gambar preview 1200x630 untuk share link WhatsApp |

Nama tamu di Hero otomatis terisi dari parameter URL, contoh:
`https://domainmu.netlify.app/?to=Budi+Santoso`

## Firebase Realtime Database — WAJIB dicek

Config yang dipakai adalah project Firebase yang sudah ada (`nikah-3d7ff`) — config client-side
memang publik by design, keamanan diatur lewat **Rules**, bukan dengan menyembunyikan config.

Cek di Firebase Console → Realtime Database → Rules. Contoh rules yang aman untuk kasus ini
(read publik boleh, write dibatasi field wajib terisi):

```json
{
  "rules": {
    "rsvp": {
      ".read": true,
      ".write": true,
      "$entry": {
        ".validate": "newData.hasChildren(['nama', 'ucapan', 'hadir', 'created_at'])"
      }
    }
  }
}
```

Sesuaikan lagi kalau kamu mau lebih ketat (misalnya batasi panjang string, rate limit via
App Check, dll) — di luar scope prototype ini.

## Menjalankan lokal

Karena pakai ES Modules (`type="module"`), buka file `index.html` langsung dari `file://`
kadang diblokir browser (CORS). Jalankan local server sederhana, misalnya:

```bash
npx serve .
# atau
python3 -m http.server 8080
```

## Deploy ke Netlify

1. Drag-drop folder ini ke [app.netlify.com/drop](https://app.netlify.com/drop), **atau**
2. Push ke Git repo lalu connect repo tersebut di Netlify (build command kosong, publish
   directory `.`).

## Catatan desain

- Design token (warna, font) ada di `:root` paling atas `style.css` — semua warna/font di
  file ini WAJIB ambil dari token itu, jangan hardcode hex/font baru di tempat lain.
- Signature element (garis motif songket "pucuk rebung") di-generate lewat JS
  (`initSongketDividers` di `script.js`), bukan hardcode SVG per section, supaya tiap
  instance punya `<path>` unik untuk animasi draw-in GSAP.
- Section Love Story sengaja tanpa foto (murni teks timeline), sesuai referensi gaya yang
  diminta.
