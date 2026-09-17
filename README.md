# Englisify

**Englisify** adalah aplikasi web untuk membantu mahasiswa baru (Maba) belajar Bahasa Inggris secara mandiri, bertahap dari level pemula (A1) sampai mahir (C2) mengikuti standar CEFR. Dibangun sebagai website statis (HTML, CSS, JavaScript vanilla) dengan [Supabase](https://supabase.com) sebagai backend (autentikasi & database).

## ✨ Fitur

- **Autentikasi** — Registrasi & login pengguna via Supabase Auth (`login.html`, `register.html`).
- **Beranda / Dashboard** — Ringkasan statistik belajar (kata dipelajari, level saat ini, progres) (`beranda.html`).
- **Flashcard** — Belajar kosakata dengan kartu bolak-balik, per level, sesi acak (`flashcard.html`).
- **Kosakata** — Daftar kosakata (kata benda, kata kerja, kata sifat) lengkap dengan riwayat belajar; pengguna juga bisa menambah kata sendiri (`kosakata.html`).
- **Ujian Level** — Tes evaluasi tiap level (A1–C2) dengan bank soal kosakata & tata bahasa untuk naik ke level berikutnya (`ujian-level.html`).
- **Reading Test** — Latihan pemahaman bacaan per level (`reading-test.html`).
- **Kalender Aktivitas** — Melacak hari-hari aktif belajar pengguna (`kalender.html`).
- **Profil & Pengaturan** — Kelola profil, tema (mode terang/gelap), target harian, suara, dsb. (`profile.html`, `settings.html`).

## 🧱 Level Bahasa (CEFR)

| Kode | Nama | Deskripsi |
|------|------|-----------|
| A1 | Pemula | Kosakata dasar & kalimat sederhana |
| A2 | Dasar | Bahasa Inggris sehari-hari & ekspresi umum |
| B1 | Menengah | Memahami percakapan dan teks sehari-hari |
| B2 | Menengah Atas | Berkomunikasi dengan lebih lancar |
| C1 | Mahir | Memahami bahasa Inggris kompleks |
| C2 | Master | Penguasaan bahasa Inggris tingkat tinggi |

## 🗂️ Struktur Proyek

```
Maba-Polnes-2026/
├── index.html               # Landing page
├── beranda.html             # Dashboard setelah login
├── login.html / register.html
├── flashcard.html           # Latihan flashcard kosakata
├── kosakata.html            # Daftar & manajemen kosakata
├── ujian-level.html         # Ujian kenaikan level
├── reading-test.html        # Latihan membaca
├── kalender.html            # Kalender aktivitas belajar
├── profile.html / settings.html
├── css/
│   └── style.css            # Seluruh styling (tema terang/gelap)
├── js/
│   ├── main.js               # Logika bersama (tema, nav mobile, data level, statistik)
│   ├── supabase.js           # Adapter REST/Auth ke Supabase
│   ├── auth.js                # Guard halaman & sesi login
│   ├── login.js / register.js
│   ├── dashboard.js           # Logika Beranda
│   ├── flashcard.js
│   ├── kosakata.js
│   ├── ujian.js                # Logika ujian level
│   ├── exam-questions-bank.js  # Bank soal ujian A1–C2
│   ├── reading-test.js
│   ├── kalender.js
│   ├── profile.js / settings.js
│   └── theme-init.js           # Set tema sebelum halaman render (anti-flicker)
└── *.md                        # Catatan pengembangan (lihat bagian Dokumentasi)
```

## 🚀 Menjalankan Secara Lokal

Karena ini website statis, cukup buka dengan live server, contoh:

```bash
# Dengan Python
python -m http.server 8000

# atau dengan VS Code Live Server extension
```

Lalu akses `http://localhost:8000/index.html`.

## ⚙️ Konfigurasi Supabase

Koneksi ke Supabase (URL project & anon key) sudah dikonfigurasi langsung di `js/supabase.js`. Jika ingin memakai project Supabase sendiri, ganti nilai `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di file tersebut, lalu sesuaikan skema tabel (flashcard, riwayat belajar, dll.) di Supabase Anda.

## 📄 Dokumentasi Tambahan

Beberapa file markdown lain di root project berisi catatan pengembangan/riwayat perbaikan fitur, bukan bagian dari dokumentasi utama:

- `DEPLOYMENT-CHECKLIST.md` — checklist sebelum deploy.
- `QUICK-FIX.md`, `FLASHCARD-KOSAKATA-FIX.md` — catatan perbaikan bug.
- `VOCABULARY-*.md` — catatan integrasi fitur kosakata dengan Supabase.

File-file `test-*.html`, `debug-flashcards.html`, dan `verify-vocabulary-setup.html` adalah halaman bantu untuk pengujian/debugging manual selama pengembangan, bukan bagian dari alur pengguna akhir.

## 🛠️ Teknologi

- HTML5, CSS3 (custom, tanpa framework CSS)
- JavaScript (vanilla, tanpa framework)
- [Supabase](https://supabase.com) (Auth + Database via REST)
- `localStorage` untuk cache sesi, preferensi tema, dan statistik lokal
