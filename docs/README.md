# 📚 Dokumentasi Terpadu Work Tracker Pro (TrackerKerja) v3.6
## Full-Stack .NET 8 Web API (MySQL) & React Single Page Application (SPA)

Selamat datang di pusat dokumentasi terpadu proyek **Work Tracker Pro (TrackerKerja) v3.6**. Seluruh dokumen spesifikasi permintaan (*requirements*), hasil analisis arsitektur (*design & decisions*), dan catatan teknis operasional (*technical notes*) telah disusun secara terorganisir di dalam folder `/docs` ini.

---

### 🗂️ Struktur Direktori Dokumentasi

```text
docs/
├── README.md                                          # [Indeks Utama Dokumentasi]
│
├── 01-requests-and-specifications/                    # [DOKUMEN REQUEST & SPESIFIKASI ASLI]
│   ├── FSD_WORK_TRACKER_PRO.md                        # Functional Specification Document (FSD v3.6)
│   ├── FSD_WORK_TRACKER_PRO.docx                      # FSD Format Dokumen Resmi Microsoft Word
│   ├── TSD_WORK_TRACKER_PRO.md                        # Technical Specification Document (TSD v3.6)
│   ├── TSD_WORK_TRACKER_PRO.docx                      # TSD Format Dokumen Resmi Microsoft Word
│   ├── USER_GUIDE.md                                  # Panduan Pengguna Lengkap Sistem
│   └── USER_GUIDE.docx                                # Panduan Pengguna Format Microsoft Word
│
├── 02-architecture-and-design/                        # [HASIL ANALISIS ARSITEKTUR & RESPON]
│   ├── USER_REQUESTS_AND_DESIGN_DECISIONS.md          # Rangkuman Request, Tanya Jawab & Keputusan Desain
│   ├── SYSTEM_ARCHITECTURE_DESIGN.md                  # Dokumen Spesifikasi Desain Arsitektur Sistem (.NET 8 + MySQL + React)
│   └── IMPLEMENTATION_PLAN.md                         # Master Rencana Kerja Eksekusi Bertahap (Tasks 1 s/d 17)
│
└── 03-technical-notes/                                # [CATATAN TEKNIS, DATABASE & INFRASTRUKTUR]
    ├── MYSQL_DATABASE_SCHEMA.md                       # Katalog Lengkap 21 Skema Tabel MySQL 8.x
    ├── DOCKER_AND_ENVIRONMENT_SETUP.md                # Panduan Menjalankan Docker Compose & Port Mapping
    └── API_CONTRACTS_REFERENCE.md                     # Daftar Endpoint REST API, DTO & JWT Bearer Header
```

---

### 📖 Panduan Membaca & Tautan Cepat

#### 1. Memahami Alur Bisnis & Kebutuhan Pengguna
- Pelajari alur operasional 19 modul pada [FSD_WORK_TRACKER_PRO.md](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/01-requests-and-specifications/FSD_WORK_TRACKER_PRO.md).
- Pelajari tata cara dan skenario penggunaan aplikasi pada [USER_GUIDE.md](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/01-requests-and-specifications/USER_GUIDE.md).

#### 2. Memahami Keputusan Desain Arsitektur Baru
- Baca rangkuman diskusi dan parameter yang disepakati pengguna pada [USER_REQUESTS_AND_DESIGN_DECISIONS.md](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/02-architecture-and-design/USER_REQUESTS_AND_DESIGN_DECISIONS.md).
- Baca arsitektur Clean Monorepo, alur autentikasi JWT, sistem 40 tema & 5 fonts, serta strategi responsivitas pada [SYSTEM_ARCHITECTURE_DESIGN.md](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/02-architecture-and-design/SYSTEM_ARCHITECTURE_DESIGN.md).

#### 3. Catatan Teknis & Panduan Implementasi
- Rujukan skema 21 tabel MySQL, relasi foreign key, tipe data, dan indexing: [MYSQL_DATABASE_SCHEMA.md](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/03-technical-notes/MYSQL_DATABASE_SCHEMA.md).
- Tata cara menjalankan database MySQL di Docker dan menjalankan backend/frontend: [DOCKER_AND_ENVIRONMENT_SETUP.md](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/03-technical-notes/DOCKER_AND_ENVIRONMENT_SETUP.md).
- Rujukan lengkap rute endpoint RESTful API, DTO, dan format respon JSON: [API_CONTRACTS_REFERENCE.md](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/03-technical-notes/API_CONTRACTS_REFERENCE.md).
