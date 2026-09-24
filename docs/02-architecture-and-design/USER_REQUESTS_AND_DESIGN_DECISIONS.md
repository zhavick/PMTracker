# 📋 Catatan Dokumen Request, Hasil Respon & Keputusan Desain
## Proyek: Work Tracker Pro (TrackerKerja) v3.6 - .NET Core & React

Dokumen ini mendokumentasikan permintaan pengguna (*user requests*), hasil diskusi perancangan (*clarifications & responses*), dan keputusan arsitektur (*architectural decisions*) yang telah disepakati bersama.

---

### 1. Ringkasan Permintaan Pengguna (User Request)

> **User Prompt Asli:**  
> *"saya ingin membuat project management baru dengan menggunakan teknologi backend : .net core dengan database mysql, untuk frontend : react.*  
> *untuk spesifikasi pelajari FSD, TSD, dan user guide dari dokumen tersebut"*

#### Permintaan Tambahan & Klarifikasi Pengguna:
1. **Lingkungan Database MySQL**: Menggunakan **Docker Compose** untuk menjalankan container MySQL 8.4 LTS dengan persistent volume.
2. **Teknologi Frontend React**: Menggunakan kombinasi **JavaScript + Vite + Tailwind CSS + Lucide Icons**.
3. **Cakupan & Strategi Implementasi**: Merancang arsitektur lengkap seluruh modul sesuai FSD/TSD, dieksekusi secara bertahap dimulai dari Foundation (Auth, DB MySQL, Theme Engine, Layout) -> Tasks/Kanban/Projects -> Timesheet/Attendance -> Enterprise/Admin Tools.
4. **Pendekatan Arsitektur**: Disetujui menggunakan **Opsi 1: Modern Clean Architecture Monorepo** (`backend/` + `frontend/` + root `docker-compose.yml`).
5. **Autentikasi**: Disetujui menggunakan **JWT (JSON Web Token)** Bearer Authentication murni untuk komunikasi React SPA dengan REST API.
6. **Tampilan Tugas**: **Tampilan Grid (Tabel Dinamis) sebagai tampilan default/utama**, dengan opsi tombol beralih ke papan **Kanban**.
7. **Responsivitas**: Penekanan khusus agar antarmuka **sebisa mungkin sangat responsif** di seluruh resolusi layar (Mobile, Tablet, Desktop).

---

### 2. Matriks Keputusan Desain (Design Decisions)

| No | Aspek | Keputusan yang Disepakati | Rationale & Dampak Teknis |
| :--- | :--- | :--- | :--- |
| 1 | **Struktur Repositori** | Monorepo Bersih (`backend/`, `frontend/`, `docs/`, `docker-compose.yml`) | Menjaga kode backend dan frontend tetap terpisah secara elegan namun berada dalam satu repositori yang mudah di-orchestrate dan diuji. |
| 2 | **Backend API** | ASP.NET Core 8 Web API (C# 12, .NET 8 LTS) | Performa tinggi, native dependency injection, pipeline middleware terstruktur, dan dukungan jangka panjang (LTS). |
| 3 | **Database Engine** | MySQL 8.4 LTS via `Pomelo.EntityFrameworkCore.MySql` | Menggantikan SQLite pada versi sebelumnya, dikonfigurasi dengan engine InnoDB, `utf8mb4_unicode_ci`, dan auto-migration. |
| 4 | **Frontend Stack** | React 18 + Vite + Tailwind CSS + Lucide Icons | Waktu build dan HMR sangat cepat, fleksibilitas CSS tinggi tanpa framework berat, dan ikon modern yang serasi. |
| 5 | **Skema Autentikasi** | Stateless JWT Bearer Token (HMAC-SHA256) | Standard de-facto untuk SPA + Web API. Token membawa klaim: `sub`, `email`, `name`, `role`, `companyId`, `jobTitle`. |
| 6 | **Persetujuan Akun** | Admin Approval Workflow (`IsApproved == false`) | Pengguna baru tidak dapat login sampai disetujui Admin. Mencegah akses liar pada instalasi perusahaan. |
| 7 | **Keamanan Sesi** | Session Inactivity Guard (60 Menit Timeout) | Client-side tracking di React dengan peringatan interaktif hitung mundur 300 detik pada menit ke-55 sebelum auto-logout. |
| 8 | **Tampilan Modul Task** | **Grid Table sebagai Default**, Kanban sebagai Toggle | Pengguna lebih memprioritaskan densitas informasi dan kemudahan pencarian tabular tugas, dengan fleksibilitas Kanban saat dibutuhkan. |
| 9 | **Penyatuan Edit Tugas**| Unified Save (`SaveTaskAndSession`) | Memungkinkan pengisian catatan jam kerja (timesheet) langsung dari formulir edit tugas dalam 1 transaksi atomik. |
| 10 | **Pelacakan Waktu** | Concurrent Active Multi-Timer | Pengguna dapat menjalankan beberapa timer tugas sekaligus tanpa saling mengunci (*non-blocking*). |
| 11 | **Responsivitas UI** | Desktop Sidebar + Mobile Off-Canvas Drawer + Glassmorphic Bottom Nav | Navigasi bawah melayang khusus layar < 768px, safe-area insets untuk notch/gesture bar, dan target sentuh >= 44px. |
| 12 | **Sistem Desain & Tema**| 40 Tema Eye-Friendly + 5 Google Fonts Switcher | 22 tema terang + 18 tema gelap ramah mata via CSS custom tokens, 5 Google Fonts instan, dan script Anti-FOUC di `index.html`. |
| 13 | **Spreadsheet Engine** | ClosedXML 0.104.2 | Mendukung ekspor Timesheet multi-sheet dengan formula `=SUM(...)`, format Standar (9 kolom), dan format ARMS (21 kolom). |
| 14 | **Integrasi Email** | MailKit SMTP + 7 Dynamic HTML Event Templates | Konfigurasi dinamis di database, live diagnostics box (latensi ms), dan pengiriman background-safe asinkron. |
| 15 | **Sinkronisasi Multi-Node** | Host Induk Push/Pull & ZIP Package | Mendukung sinkronisasi delta online (streaming Base64) dan paket offline `.zip` untuk lingkungan *air-gapped*. |

---

### 3. Tautan Dokumen Terkait
- 📐 [Dokumen Desain Sistem Lengkap (SYSTEM_ARCHITECTURE_DESIGN.md)](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/02-architecture-and-design/SYSTEM_ARCHITECTURE_DESIGN.md)
- 🗄️ [Katalog Skema Basis Data MySQL (MYSQL_DATABASE_SCHEMA.md)](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/03-technical-notes/MYSQL_DATABASE_SCHEMA.md)
- 🐳 [Panduan Docker & Setup Lingkungan (DOCKER_AND_ENVIRONMENT_SETUP.md)](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/03-technical-notes/DOCKER_AND_ENVIRONMENT_SETUP.md)
- 🌐 [Spesifikasi Kontrak REST API (API_CONTRACTS_REFERENCE.md)](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/03-technical-notes/API_CONTRACTS_REFERENCE.md)
