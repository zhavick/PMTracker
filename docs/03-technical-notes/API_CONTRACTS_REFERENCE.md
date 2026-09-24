# 🌐 Referensi Kontrak RESTful Web API
## Work Tracker Pro (TrackerKerja) v3.6

Dokumen ini mendokumentasikan spesifikasi kontrak API RESTful, skema header otentikasi JWT Bearer, format respon terstandarisasi, dan daftar endpoint utama.

---

### 1. Format Respon JSON Standar
Seluruh endpoint API mengembalikan struktur data seragam `ApiResponse<T>`:

```json
{
  "isSuccess": true,
  "message": "Operasi berhasil dieksekusi.",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-09-24T14:30:00.000Z"
}
```

Format respon untuk data berpaginasi `PagedResult<T>`:
```json
{
  "isSuccess": true,
  "message": "Data berhasil diambil.",
  "data": {
    "items": [ ... ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalItems": 150,
    "totalPages": 15,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "errors": null,
  "timestamp": "2026-09-24T14:30:00.000Z"
}
```

---

### 2. Standar Header & Autentikasi
Kecuali endpoint publik (`/api/auth/login`, `/api/auth/register`, `/api/sync/receive`), seluruh endpoint mewajibkan header JWT Bearer Token:

```http
Authorization: Bearer <jwt_token_string>
Content-Type: application/json
```

---

### 3. Matriks Endpoint Utama per Modul

#### A. Autentikasi & Akun (`/api/auth`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login via email & password. Mengembalikan JWT Bearer token |
| `POST` | `/api/auth/register` | Pendaftaran akun baru (`IsApproved = false`) |
| `GET` | `/api/auth/me` | Mengambil data profil pengguna yang sedang login |
| `PUT` | `/api/auth/profile` | Memperbarui profil (nama, avatar color, job title) |
| `POST` | `/api/auth/change-password` | Mengubah kata sandi akun sendiri |

#### B. Tugas & Kanban (`/api/tasks`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | Mengambil daftar tugas terpaginasi (filter status, priority, PIC, milestone, search) |
| `GET` | `/api/tasks/{id}` | Detail tugas beserta sub-tugas dan riwayat sesi kerja |
| `POST` | `/api/tasks` | Membuat tugas baru |
| `PUT` | `/api/tasks/{id}` | Memperbarui atribut tugas |
| `PUT` | `/api/tasks/{id}/unified-save`| **Unified Save**: Update tugas + catat sesi jam kerja manual baru sekaligus |
| `PUT` | `/api/tasks/{id}/status` | Mengubah status tugas via drag & drop Kanban |
| `PUT` | `/api/tasks/{id}/progress` | Mengubah nilai progress slider (0-100%) |
| `DELETE` | `/api/tasks/{id}` | Menghapus tugas |
| `GET` | `/api/tasks/kanban` | Mengambil data tugas terformat per 4 kolom Kanban |
| `GET` | `/api/tasks/summary` | Ringkasan metrik (Total, Selesai, In Progress, Overdue) |

#### C. Proyek & Kategori (`/api/projects` & `/api/categories`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/projects` | Daftar seluruh proyek beserta persentase progres agregat |
| `GET` | `/api/projects/{id}` | Detail proyek beserta daftar tugas terkait |
| `POST` | `/api/projects` | Membuat proyek baru |
| `PUT` | `/api/projects/{id}` | Memperbarui data proyek |
| `DELETE` | `/api/projects/{id}` | Menghapus proyek |
| `GET` | `/api/categories` | Daftar master kategori pekerjaan |

#### D. Timesheet & Multi-Timer (`/api/timesheets`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/timesheets` | Mengambil riwayat sesi jam kerja terpaginasi |
| `GET` | `/api/timesheets/active` | Mengambil daftar seluruh timer yang sedang aktif berjalan (`EndTime == null`) |
| `POST` | `/api/timesheets/start` | Memulai timer baru pada tugas tertentu |
| `POST` | `/api/timesheets/{id}/stop` | Menghentikan timer aktif dan menyimpan durasi |
| `POST` | `/api/timesheets/manual` | Mencatat sesi jam kerja manual |
| `GET` | `/api/timesheets/export` | Mengunduh laporan timesheet Excel resmi multi-sheet (.xlsx) |

#### E. Presensi & Kehadiran (`/api/attendance`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/attendance/today` | Status presensi hari ini untuk pengguna aktif |
| `POST` | `/api/attendance/check-in` | Melakukan Clock-In harian (Hadir, WFH, Sakit, Izin, Cuti) |
| `POST` | `/api/attendance/check-out`| Melakukan Clock-Out dan menghitung total jam kerja |
| `GET` | `/api/attendance/monthly` | Data absensi bulanan untuk kalender atau matriks tim |
| `POST` | `/api/attendance/reconcile`| Rekonsiliasi data presensi oleh Admin |

#### F. Kalender Kerja (`/api/calendar`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/calendar/events` | Mengambil event tugas kalender dengan parameter `start`, `end`, dan `filter=mine|all` |

#### G. Catatan Kerja & Berkas (`/api/notes`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/notes` | Daftar catatan kerja (dengan pencarian, kategori, pinned) |
| `GET` | `/api/notes/{id}` | Detail catatan beserta lampiran berkas |
| `POST` | `/api/notes` | Membuat catatan baru |
| `PUT` | `/api/notes/{id}` | Mengedit catatan |
| `DELETE` | `/api/notes/{id}` | Menghapus catatan beserta berkas lampirannya |
| `POST` | `/api/notes/{id}/attachments`| Mengunggah berkas lampiran |
| `GET` | `/api/notes/attachments/{id}/download`| Mengunduh berkas fisik lampiran |

#### H. Developer Tools (`/api/sqltools` & `/api/jsontools`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `POST` | `/api/sqltools/format` | Format kueri SQL mendukung 15+ dialek database |
| `POST` | `/api/sqltools/minify` | Minifikasi kueri SQL satu baris |
| `POST` | `/api/sqltools/validate` | Validasi sintaks klausa dan tanda kurung SQL |
| `GET` | `/api/sqltools/history` | Riwayat kueri SQL tersimpan |
| `POST` | `/api/jsontools/format` | Format dan validasi sintaks JSON |

#### I. Anggota Tim & Manajemen User (`/api/members`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/members` | Direktori anggota tim (filter approval & search) |
| `GET` | `/api/members/{id}` | Detail profil anggota dan statistik jam kerja |
| `POST` | `/api/members/{id}/approve` | Persetujuan pendaftaran akun oleh Admin |
| `POST` | `/api/members/{id}/reject` | Penolakan pendaftaran disertai catatan alasan |
| `POST` | `/api/members/{id}/reset-password`| Reset kata sandi anggota langsung oleh Admin |
| `DELETE` | `/api/members/{id}` | Hapus permanen akun pengguna (Double Confirmation) |

#### J. Konfigurasi Email & Sistem (`/api/email-config` & `/api/configuration`)
| Method | Route | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/email-config` | Pengaturan server SMTP saat ini |
| `PUT` | `/api/email-config` | Memperbarui pengaturan SMTP |
| `POST` | `/api/email-config/test` | Uji koneksi diagnostik live dan latensi handshake SMTP |
| `GET` | `/api/email-config/templates`| Daftar 7 template email event |
| `PUT` | `/api/email-config/templates/{id}`| Edit subjek dan isi template HTML email |
| `POST` | `/api/email-config/templates/{id}/preview`| Render pratinjau live template dengan variabel mockup |
