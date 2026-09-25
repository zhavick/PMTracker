# 🚀 Work Tracker Pro (TrackerKerja)

> **Enterprise Work Task Management, Multi-Timer Timesheet Tracking, Attendance Management, Technical Documentation, Ticketing & Helpdesk, Gamification & Team Performance Analytics Platform (v3.7 Enterprise Edition)**

[![ASP.NET Core 8.0](https://img.shields.io/badge/ASP.NET%20Core-8.0%20Web%20API-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React 18](https://img.shields.io/badge/React-18%20SPA-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![REST API](https://img.shields.io/badge/REST%20API-100%2B%20Endpoints-85EA2D?logo=swagger&logoColor=black)](http://localhost:5000/swagger)
[![JWT Bearer](https://img.shields.io/badge/Auth-JWT%20Bearer-orange?logo=jsonwebtokens&logoColor=white)](http://localhost:5000/swagger)
[![Themes & Fonts](https://img.shields.io/badge/Themes%20%26%20Fonts-40%20Themes%20%7C%205%20Fonts-pink)](http://localhost:5173)
[![GitHub](https://img.shields.io/badge/GitHub-zhavick%2FPMTracker-181717?logo=github&logoColor=white)](https://github.com/zhavick/PMTracker.git)

---

## 🌟 Fitur Unggulan Sistem (v3.7)

### 🔐 1. Keamanan Enterprise & Autentikasi JWT Bearer
- **React 18 SPA + ASP.NET Core 8.0 REST API**: Arsitektur modern decoupled — frontend React SPA berkomunikasi dengan backend via REST API berstandar JSON.
- **JWT Bearer Token Authentication**: Autentikasi stateless berbasis token untuk seluruh endpoint API.
- **Strict Swagger JWT Authorization**: Dokumentasi OpenAPI/Swagger UI di `/swagger` dilengkapi tombol modal **Authorize** untuk menguji endpoint berotentikasi Bearer JWT.
- **Keamanan Sesi & Auto-Logout Inaktivitas 1 Jam**: Pemantauan idle real-time via React `AuthContext`, dialog peringatan interaktif 5 menit dengan hitung mundur detik, dan proteksi redirect otomatis.
- **Admin Approval Workflow**: Akun baru memerlukan persetujuan Administrator sebelum dapat login.

### 🎨 2. 40 Tema Eye-Friendly & 5 Google Fonts Switcher
- **40 Tema Tampilan Dinamis**: 22 Tema Terang + 18 Tema Gelap ramah mata (*eye-friendly* dengan kontras seimbang) bertenaga CSS custom tokens.
- **Global Font Switcher**: 5 opsi Google Fonts pilihan (*Inter, Plus Jakarta Sans, Outfit, Poppins, Roboto*) yang dapat diganti secara instan tanpa reload halaman dan tersimpan di `localStorage` (*Anti-FOUC*).
- **Tur Interaktif Layar (*Interactive Onboarding Tour*)**: Panduan interaktif yang memandu pengguna baru memahami alur operasional aplikasi.
- **Paginasi Grid Tabel (Client-Side React)**: Navigasi tabel instan tanpa reload untuk semua modul utama.

### 👥 3. Direktori Anggota Tim, Banner Cover Profil & Hapus Akun Permanen
- **Pure Grid Card Layout**: Kartu anggota tim berstruktur grid responsif dengan proteksi anti-overflow (*text-ellipsis* dan tooltip hover).
- **Kustomisasi Banner Sampul Profil (`CoverPictureUrl`)**: Unggah gambar cover banner profil atau gunakan template vektor SVG default (`default-profile-cover.svg`).
- **Fitur Hapus Permanen Akun (*Permanent User Deletion*)**: Khusus peran Administrator dengan proteksi konfirmasi ganda verifikasi nama target dan kata sandi admin.
- **Admin Password Reset**: Fasilitas reset kata sandi langsung dari kartu anggota disertai notifikasi email otomatis.

### ⏱️ 4. Timesheet, Multi-Timer & Penyatuan Form Edit Tugas
- **Penyatuan Formulir Edit Tugas & Timesheet Manual (`SaveTaskAndSession`)**: Satu tombol simpan terpadu untuk memperbarui detail tugas dan mencatat sesi jam kerja manual baru sekaligus.
- **Multi-Timer Serentak**: Menjalankan beberapa timer tugas bersamaan tanpa saling mengganggu antar pengguna.
- **Laporan Excel Timesheet Resmi (ClosedXML)**: Ekspor multi-sheet dengan rincian harian, rekapitulasi per proyek, konversi Man-Days, dan formula otomatis.

### 🎫 5. Ticketing & Helpdesk Internal
- **Sistem Tiket Dukungan Teknis Internal**: Pengguna dapat melaporkan kendala sistem, permintaan fitur, atau kebutuhan bantuan teknis langsung dari dalam aplikasi.
- **Kategori Tiket Komprehensif**: Bug, Feature Request, Support, Infrastructure, Account Access, Other.
- **Alur Status Tiket**: Open → In Progress → Pending User → Resolved → Closed.
- **Komentar & Catatan Internal**: Komunikasi dua arah antara pelapor dan tim penanganan dengan dukungan komentar internal (admin-only).
- **Nomor Tiket Otomatis**: Format `TCK-YYYYMM-NNNN`.

### 🏆 6. Gamifikasi, Badge Prestasi & Sistem Reward Poin
- **Sistem Badge Otomatis**: Badge dibuka otomatis saat pengguna mencapai milestone produktivitas (tugas selesai, jam kerja, catatan, dll).
- **Tingkat Kelangkaan Badge**: Common, Rare, Epic, Legendary.
- **Sistem Poin & Reward Claim**: Pengguna dapat menukar poin dengan reward nyata (1 Poin = Rp 100) via transfer bank/e-wallet atau traktiran.
- **Leaderboard Tim**: Peringkat poin produktivitas seluruh anggota tim.

### 🔄 7. Sinkronisasi Multi-Instance Host Induk & File Attachments
- **Online Push & Pull Sync dengan File Streaming**: Sinkronisasi transaksi database dan seluruh berkas fisik lampiran (`uploads/notes/*`, `uploads/avatars/*`, `uploads/covers/*`) menggunakan Base64 streaming melalui REST API.
- **Paket ZIP Offline Mandiri**: Ekspor dan impor paket arsip lengkap (`manifest.json`, `sync_data.sql`, folder `uploads/`) untuk instalasi jaringan tertutup (*air-gapped*).

### 📧 8. Integrasi Server Email (SMTP) & 7 Template Event
- **Konfigurasi SMTP Dinamis**: Pengaturan host mail, port, kredensial, dan SSL/TLS tersimpan di database MySQL tanpa perlu restart aplikasi.
- **Uji Koneksi Mandiri**: Live diagnostik handshake SMTP dan pengukuran latensi koneksi.
- **7 Template Email Event**: Template pendaftaran, persetujuan akun, penolakan, reset password, penugasan tugas, dan perubahan status dengan live HTML rendering preview.

### 📋 9. Manajemen Tugas, Proyek, Presensi & Developer Tools
- **Hierarki Parent-Child Tasks & Kanban Board** (drag-and-drop SortableJS).
- **Pencatatan Kendala (Obstacle) & Solusi (Solution)** untuk evaluasi sprint.
- **Presensi Terintegrasi (Check In/Out, WFH, Sakit, Izin, Cuti)** & Rekonsiliasi Tim.
- **Developer Tools Terpadu**: SQL Beautifier/Formatter mendukung 15+ dialek database dan JSON Payload Tools.
- **Ekspor/Impor Excel Ganda**: Format Standar 9-kolom dan Format ARMS 21-kolom.

---

## 🛠️ Teknologi & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework Backend** | ASP.NET Core 8.0 Web API | C# 12, Kestrel Web Server, .NET 8 LTS |
| **Framework Frontend** | React 18 SPA (Vite) | JavaScript ES2024, React Router v6 |
| **Database & ORM** | MySQL 8.x + Entity Framework Core 8.0 | Pomelo MySQL Provider, Auto-migration & Database Seeder |
| **Autentikasi & Keamanan** | JWT Bearer Token | HMAC-SHA256, Strict Swagger JWT, Inactivity Guard (60 min) |
| **Containerization** | Docker & Docker Compose | Multi-stage build, persistent volumes (`./uploads`, `mysql_data`) |
| **Engine Spreadsheet** | ClosedXML 0.104.2 | Format ARMS 21-kolom, Timesheet multi-sheet, Standard 9-kolom |
| **Dokumentasi API** | Swashbuckle OpenAPI (Swagger v3.0) | 100+ Endpoints terproteksi dengan Authorize Bearer Modal |
| **Styling & Theme** | Vanilla CSS + CSS Custom Tokens | 40 Dynamic Themes (22 Light + 18 Dark), 5 Google Fonts |
| **Client Libraries** | SortableJS, FullCalendar, Chart.js, Quill.js | Interaktivitas UI modern dan responsif |

---

## 🚀 Panduan Menjalankan Aplikasi

### 🐳 1. Menjalankan Menggunakan Docker (Sangat Disarankan)

Aplikasi telah dikemas siap pakai dengan Docker & Docker Compose. Database MySQL dan file upload tetap tersimpan secara persisten pada host machine.

```bash
# Menjalankan container di background (auto-build & auto-migrate DB)
docker compose up -d --build
```

> ⚠️ Pastikan file `.env` sudah dikonfigurasi dengan variabel `DB_PASSWORD`, `DB_ROOT_PASSWORD`, dan `JWT_KEY` sebelum menjalankan Docker Compose.

---

### 💻 2. Menjalankan Mode Development

Aplikasi terdiri dari dua komponen yang dijalankan secara bersamaan:

**Backend (ASP.NET Core API):**
Pastikan [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) telah terinstal.

```bash
# Clone repository
git clone https://github.com/zhavick/PMTracker.git
cd PMTracker

# Jalankan backend API
cd backend/WorkTracker.Api
dotnet run
# API berjalan di http://localhost:5000
```

**Frontend (React SPA):**
Pastikan [Node.js 18+](https://nodejs.org/) telah terinstal.

```bash
# Dari root folder project
cd frontend
npm install
npm run dev
# Frontend berjalan di http://localhost:5173
```

---

## 🐙 Repositori GitHub

Repositori proyek: 👉 **[https://github.com/zhavick/PMTracker.git](https://github.com/zhavick/PMTracker.git)**

---

## 🌐 Endpoint & Akses Cepat

- **Frontend Web App**: [http://localhost:5173](http://localhost:5173) (Development)
- **Backend REST API**: [http://localhost:5000](http://localhost:5000)
- **Swagger REST API Documentation**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **OpenAPI JSON Spec**: [http://localhost:5000/swagger/v1/swagger.json](http://localhost:5000/swagger/v1/swagger.json)

---

## 📚 Referensi Dokumentasi Lengkap

### Format Markdown (.md)
- 📐 **[FSD_WORK_TRACKER_PRO.md](FSD_WORK_TRACKER_PRO.md)**: Dokumen Spesifikasi Fungsional (FSD), arsitektur modul, diagram Mermaid, dan alur bisnis.
- 📘 **[TSD_WORK_TRACKER_PRO.md](TSD_WORK_TRACKER_PRO.md)**: Dokumen Spesifikasi Teknis (TSD), controller & API retrieval procedures, arsitektur basis data, ERD, dan sample data.
- 📖 **[USER_GUIDE.md](USER_GUIDE.md)**: Panduan pengguna menyeluruh dengan alur kerja seluruh fitur dan modul.

### Format Microsoft Word (.docx - Tampilan Eksekutif & Profesional)
- 📄 **[FSD_WORK_TRACKER_PRO.docx](FSD_WORK_TRACKER_PRO.docx)**: Dokumen FSD resmi berformat Microsoft Word.
- 📄 **[TSD_WORK_TRACKER_PRO.docx](TSD_WORK_TRACKER_PRO.docx)**: Dokumen TSD resmi berformat Microsoft Word.
- 📄 **[USER_GUIDE_WORK_TRACKER_PRO.docx](USER_GUIDE_WORK_TRACKER_PRO.docx)**: Buku panduan operasional pengguna lengkap siap cetak/distribusi.
