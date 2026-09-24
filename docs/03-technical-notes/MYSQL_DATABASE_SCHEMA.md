# 🗄️ Spesifikasi Teknis Basis Data MySQL 8.x
## Work Tracker Pro (TrackerKerja) v3.6

Dokumen ini mendokumentasikan spesifikasi teknis lengkap 21 tabel basis data relasional MySQL 8.4 LTS (InnoDB Engine, `utf8mb4_unicode_ci`) yang dikonversi dari spesifikasi TSD SQLite.

---

### 1. Karakteristik Basis Data MySQL
- **Storage Engine**: `InnoDB` (ACID Compliant, Row-level Locking, Foreign Key Constraints).
- **Default Charset & Collation**: `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` (dukungan penuh emoji, karakter multibahasa, dan teks teknis).
- **ORM**: Entity Framework Core 8.0 dengan driver `Pomelo.EntityFrameworkCore.MySql` (v8.x).
- **Strategi Audit**: Seluruh entitas bisnis utama memiliki kolom `CreatedAt` dan `UpdatedAt` bertipe `DATETIME(6)`.
- **Isolasi Multi-Tenancy**: Seluruh entitas kerja terikat dengan `CompanyId` (Foreign Key ke tabel `Companies`).

---

### 2. Katalog 21 Tabel MySQL

#### Modul Identitas & Organisasi
```sql
-- 1. Tabel Tenant / Organisasi Perusahaan
CREATE TABLE Companies (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Code VARCHAR(50) NULL,
    Description VARCHAR(500) NULL,
    Address VARCHAR(300) NULL,
    ContactEmail VARCHAR(150) NULL,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_companies_code (Code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Akun & Profil Pengguna (ASP.NET Identity Extended)
CREATE TABLE AspNetUsers (
    Id VARCHAR(36) PRIMARY KEY,
    FullName VARCHAR(150) NOT NULL,
    JobTitle VARCHAR(100) NOT NULL,
    AvatarColor VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    ProfilePictureUrl VARCHAR(300) NULL,
    CoverPictureUrl VARCHAR(300) NULL,
    CompanyId INT NULL,
    IsApproved TINYINT(1) NOT NULL DEFAULT 0,
    ApprovedAt DATETIME(6) NULL,
    ApprovedByUserId VARCHAR(36) NULL,
    RejectionReason VARCHAR(500) NULL,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UserName VARCHAR(256) NULL,
    NormalizedUserName VARCHAR(256) NULL,
    Email VARCHAR(256) NULL,
    NormalizedEmail VARCHAR(256) NULL,
    EmailConfirmed TINYINT(1) NOT NULL DEFAULT 0,
    PasswordHash LONGTEXT NULL,
    SecurityStamp LONGTEXT NULL,
    ConcurrencyStamp LONGTEXT NULL,
    PhoneNumber VARCHAR(50) NULL,
    PhoneNumberConfirmed TINYINT(1) NOT NULL DEFAULT 0,
    TwoFactorEnabled TINYINT(1) NOT NULL DEFAULT 0,
    LockoutEnd DATETIME(6) NULL,
    LockoutEnabled TINYINT(1) NOT NULL DEFAULT 1,
    AccessFailedCount INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_users_company FOREIGN KEY (CompanyId) REFERENCES Companies(Id) ON DELETE SET NULL,
    INDEX idx_users_email (NormalizedEmail),
    INDEX idx_users_company (CompanyId),
    INDEX idx_users_approved (IsApproved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Peran Sistem (ASP.NET Identity Roles)
CREATE TABLE AspNetRoles (
    Id VARCHAR(36) PRIMARY KEY,
    Name VARCHAR(256) NULL,
    NormalizedName VARCHAR(256) NULL,
    ConcurrencyStamp LONGTEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Relasi Pengguna & Peran
CREATE TABLE AspNetUserRoles (
    UserId VARCHAR(36) NOT NULL,
    RoleId VARCHAR(36) NOT NULL,
    PRIMARY KEY (UserId, RoleId),
    CONSTRAINT fk_userroles_user FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    CONSTRAINT fk_userroles_role FOREIGN KEY (RoleId) REFERENCES AspNetRoles(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Modul Inti Operasional (Projects, Tasks, Categories, Sessions)
```sql
-- 5. Tabel Proyek
CREATE TABLE Projects (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(200) NOT NULL,
    Description VARCHAR(1000) NULL,
    Color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    Deadline DATETIME(6) NULL,
    Status INT NOT NULL DEFAULT 0, -- 0=Active, 1=Completed, 2=Archived
    CompanyId INT NULL,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_projects_company FOREIGN KEY (CompanyId) REFERENCES Companies(Id) ON DELETE SET NULL,
    INDEX idx_projects_company (CompanyId),
    INDEX idx_projects_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Kategori Pekerjaan
CREATE TABLE Categories (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    Description VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel Tugas & Sub-Tugas (Parent-Child Hierarchy)
CREATE TABLE Tasks (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(300) NOT NULL,
    Description LONGTEXT NULL,
    Status INT NOT NULL DEFAULT 0, -- 0=Todo, 1=InProgress, 2=Done, 3=Overdue
    Priority INT NOT NULL DEFAULT 1, -- 0=Low, 1=Medium, 2=High, 3=Critical
    Progress INT NOT NULL DEFAULT 0, -- 0 to 100
    ProjectId INT NULL,
    CategoryId INT NULL,
    CompanyId INT NULL,
    AssignedToUserId VARCHAR(36) NULL,
    ParentTaskId INT NULL,
    Milestone VARCHAR(100) NULL DEFAULT 'Implementation',
    Obstacle LONGTEXT NULL,
    Solution LONGTEXT NULL,
    StartDate DATETIME(6) NULL,
    DueDate DATETIME(6) NULL,
    Tags LONGTEXT NULL, -- JSON Array of string tags
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UpdatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_tasks_project FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE NO ACTION,
    CONSTRAINT fk_tasks_category FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_company FOREIGN KEY (CompanyId) REFERENCES Companies(Id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_assignee FOREIGN KEY (AssignedToUserId) REFERENCES AspNetUsers(Id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_parent FOREIGN KEY (ParentTaskId) REFERENCES Tasks(Id) ON DELETE SET NULL,
    INDEX idx_tasks_project (ProjectId),
    INDEX idx_tasks_assignee (AssignedToUserId),
    INDEX idx_tasks_parent (ParentTaskId),
    INDEX idx_tasks_status (Status),
    INDEX idx_tasks_priority (Priority),
    INDEX idx_tasks_duedate (DueDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel Sesi Jam Kerja (Timesheet & Multi-Timer)
CREATE TABLE Sessions (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    TaskId INT NOT NULL,
    UserId VARCHAR(36) NULL,
    StartTime DATETIME(6) NOT NULL,
    EndTime DATETIME(6) NULL, -- NULL jika timer sedang aktif berjalan
    Duration BIGINT NOT NULL DEFAULT 0, -- Durasi dalam detik
    Notes VARCHAR(1000) NULL,
    CONSTRAINT fk_sessions_task FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_user FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE SET NULL,
    INDEX idx_sessions_task (TaskId),
    INDEX idx_sessions_user (UserId),
    INDEX idx_sessions_active (EndTime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Modul Presensi, Catatan Kerja & Lampiran Berkas
```sql
-- 9. Tabel Absensi & Presensi Kerja Harian
CREATE TABLE Attendances (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(36) NOT NULL,
    Date DATE NOT NULL,
    Type INT NOT NULL DEFAULT 1, -- 1=Hadir, 2=Cuti, 3=Sakit, 4=Izin, 5=Dinas, 6=Libur
    WorkLocation INT NOT NULL DEFAULT 1, -- 1=WFO, 2=WFH, 3=Dinas, 4=Remote
    ClockIn DATETIME(6) NULL,
    ClockOut DATETIME(6) NULL,
    TotalHours DOUBLE NOT NULL DEFAULT 0.0,
    LeaveReason VARCHAR(200) NULL,
    Notes VARCHAR(1000) NULL,
    Location VARCHAR(200) NULL,
    Status INT NOT NULL DEFAULT 1, -- 1=Approved, 2=Pending, 3=Rejected
    ApprovedByUserId VARCHAR(36) NULL,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UpdatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_attendances_user FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    CONSTRAINT fk_attendances_approver FOREIGN KEY (ApprovedByUserId) REFERENCES AspNetUsers(Id) ON DELETE SET NULL,
    INDEX idx_attendances_user_date (UserId, Date),
    INDEX idx_attendances_date (Date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabel Catatan Kerja Pengembang (Rich-Text WYSIWYG)
CREATE TABLE Notes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(200) NOT NULL,
    ContentHtml LONGTEXT NOT NULL,
    Category VARCHAR(50) NOT NULL DEFAULT 'General',
    Color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    IsPinned TINYINT(1) NOT NULL DEFAULT 0,
    AuthorUserId VARCHAR(36) NULL,
    TaskId INT NULL,
    CompanyId INT NULL,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UpdatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_notes_author FOREIGN KEY (AuthorUserId) REFERENCES AspNetUsers(Id) ON DELETE SET NULL,
    CONSTRAINT fk_notes_task FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE SET NULL,
    CONSTRAINT fk_notes_company FOREIGN KEY (CompanyId) REFERENCES Companies(Id) ON DELETE SET NULL,
    INDEX idx_notes_task (TaskId),
    INDEX idx_notes_author (AuthorUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabel Lampiran Berkas Fisik Catatan
CREATE TABLE NoteAttachments (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    NoteId INT NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    FileSize BIGINT NOT NULL,
    ContentType VARCHAR(100) NULL,
    FileExtension VARCHAR(20) NULL,
    UploadedByUserId VARCHAR(36) NULL,
    UploadedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_attachments_note FOREIGN KEY (NoteId) REFERENCES Notes(Id) ON DELETE CASCADE,
    CONSTRAINT fk_attachments_user FOREIGN KEY (UploadedByUserId) REFERENCES AspNetUsers(Id) ON DELETE SET NULL,
    INDEX idx_attachments_note (NoteId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Modul Gamifikasi, Master Data & Konfigurasi Sistem
```sql
-- 12. Tabel Master Badge / Lencana Penghargaan
CREATE TABLE MasterBadges (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Code VARCHAR(50) NOT NULL UNIQUE,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(255) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    Icon VARCHAR(100) NOT NULL,
    Color VARCHAR(50) NOT NULL,
    Points INT NOT NULL DEFAULT 0,
    Rarity INT NOT NULL DEFAULT 1, -- 1=Common, 2=Rare, 3=Epic, 4=Legendary
    TriggerType INT NOT NULL DEFAULT 0,
    TriggerThreshold INT NOT NULL DEFAULT 0,
    IsActive TINYINT(1) NOT NULL DEFAULT 1,
    OrderIndex INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Tabel Lencana yang Dimiliki Pengguna
CREATE TABLE UserBadges (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(36) NOT NULL,
    BadgeId INT NOT NULL,
    UnlockedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsFeatured TINYINT(1) NOT NULL DEFAULT 0,
    AwardedBy VARCHAR(150) NULL,
    CONSTRAINT fk_userbadges_user FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    CONSTRAINT fk_userbadges_badge FOREIGN KEY (BadgeId) REFERENCES MasterBadges(Id) ON DELETE CASCADE,
    INDEX idx_userbadges_user (UserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Tabel Master Prioritas Tugas
CREATE TABLE MasterPriorities (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Color VARCHAR(7) NOT NULL,
    Icon VARCHAR(50) NULL,
    OrderIndex INT NOT NULL DEFAULT 0,
    Description VARCHAR(200) NULL,
    IsDefault TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Tabel Master Status Tugas
CREATE TABLE MasterStatuses (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Color VARCHAR(7) NOT NULL,
    IsDoneState TINYINT(1) NOT NULL DEFAULT 0,
    OrderIndex INT NOT NULL DEFAULT 0,
    Description VARCHAR(200) NULL,
    IsDefault TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Tabel Master Milestone SDLC Waterfall
CREATE TABLE MasterMilestones (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Phase VARCHAR(50) NOT NULL,
    Color VARCHAR(7) NOT NULL,
    Icon VARCHAR(50) NULL,
    OrderIndex INT NOT NULL DEFAULT 0,
    Description VARCHAR(200) NULL,
    IsDefault TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Tabel Konfigurasi Dinamis Aplikasi
CREATE TABLE SystemSettings (
    `Key` VARCHAR(100) PRIMARY KEY,
    `Value` LONGTEXT NOT NULL,
    Description VARCHAR(250) NULL,
    UpdatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Tabel Template Email HTML Berbasis Event
CREATE TABLE EmailTemplates (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    EventCode VARCHAR(100) NOT NULL UNIQUE,
    EventName VARCHAR(200) NOT NULL,
    Category VARCHAR(50) NULL,
    Subject VARCHAR(300) NOT NULL,
    BodyHtml LONGTEXT NOT NULL,
    AvailableVariables VARCHAR(1000) NULL,
    IsActive TINYINT(1) NOT NULL DEFAULT 1,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UpdatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UpdatedByUserId VARCHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Modul Audit, Logging & Riwayat Developer Tools
```sql
-- 19. Tabel Log Audit Mutasi Sistem
CREATE TABLE AuditLogs (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(36) NULL,
    UserEmail VARCHAR(256) NULL,
    UserName VARCHAR(150) NULL,
    ControllerName VARCHAR(100) NULL,
    ActionName VARCHAR(100) NULL,
    HttpMethod VARCHAR(10) NOT NULL,
    Path VARCHAR(500) NOT NULL,
    QueryString VARCHAR(1000) NULL,
    IpAddress VARCHAR(50) NULL,
    StatusCode INT NOT NULL,
    DurationMs INT NOT NULL DEFAULT 0,
    Timestamp DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    Details LONGTEXT NULL,
    INDEX idx_auditlogs_timestamp (Timestamp),
    INDEX idx_auditlogs_user (UserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Tabel Riwayat Impor Data Spreadsheet
CREATE TABLE ImportLogs (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    FileName VARCHAR(255) NOT NULL,
    TotalRows INT NOT NULL DEFAULT 0,
    SuccessRows INT NOT NULL DEFAULT 0,
    FailedRows INT NOT NULL DEFAULT 0,
    Errors LONGTEXT NULL,
    ImportedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ImportedBy VARCHAR(150) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Tabel Riwayat Developer Tools (SQL & JSON History)
CREATE TABLE SqlHistories (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Content LONGTEXT NOT NULL,
    Dialect VARCHAR(50) NOT NULL DEFAULT 'mysql',
    TaskId INT NULL,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_sqlhistories_task FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE JsonHistories (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Content LONGTEXT NOT NULL,
    TaskId INT NULL,
    CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_jsonhistories_task FOREIGN KEY (TaskId) REFERENCES Tasks(Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3. Data Awal Seeding Otomatis (`DatabaseSeeder.cs`)
1. **Perusahaan Default**: `PT Elistec Teknologi` (`Code = 'ELISTEC'`).
2. **Peran Bawaan**: `Admin`, `User`, `System Analyst`, `Technical Writer`.
3. **Akun Administrator**: `admin@trackerkerja.com` (`Password = Admin@123!`, `IsApproved = true`).
4. **Master Statuses**: `Todo` (#94a3b8), `In Progress` (#3b82f6), `Review` (#eab308), `Done` (#22c55e, IsDone=true), `Overdue` (#ef4444).
5. **Master Priorities**: `Low` (#10b981), `Medium` (#3b82f6), `High` (#f59e0b), `Critical` (#ef4444).
6. **Master Milestones**: 6 Fase SDLC Waterfall (*Requirement Analysis*, *System Design*, *Implementation*, *Testing & QA*, *Deployment*, *Maintenance*).
7. **7 Template Email Event**: `USER_REGISTERED`, `ADMIN_NEW_USER_ALERT`, `USER_APPROVED`, `USER_REJECTED`, `PASSWORD_RESET_NOTIFICATION`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`.
