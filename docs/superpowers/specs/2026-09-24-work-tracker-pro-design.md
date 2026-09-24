# 📐 Work Tracker Pro v3.6 - Architecture & Design Specification
## Full-Stack .NET 8 Web API (MySQL) + React SPA (Vite, Tailwind CSS, Lucide Icons)

---

### 1. Document Overview & Metadata
- **Project Name**: Work Tracker Pro (TrackerKerja) v3.6 Enterprise Edition
- **Architecture**: Modern Clean Architecture Monorepo (Decoupled Backend REST API & Frontend React SPA)
- **Backend Framework**: ASP.NET Core 8.0 Web API (C# 12, Kestrel, .NET 8 LTS)
- **Database Engine**: MySQL 8.4 LTS via Entity Framework Core 8 (`Pomelo.EntityFrameworkCore.MySql`)
- **Frontend Framework**: React 18+ (JavaScript, Vite 5, Tailwind CSS 3, Lucide React Icons)
- **Containerization**: Docker & Docker Compose (`mysql`, `backend`, `frontend`)
- **Date**: 24 September 2026
- **Status**: Approved by User

---

### 2. High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Client Tier (React 18 SPA + Vite)"]
        BrowserDesktop["Desktop Browser (Sidebar + Topbar + Grid Layout)"]
        BrowserMobile["Mobile Browser (Off-Canvas Drawer + Glass Bottom Nav)"]
        ThemeEngine["Theme & Font Engine (40 Themes + 5 Google Fonts)"]
        SessionTracker["Client-side Inactivity Guard (60m Timeout / 55m Warning)"]
        ActiveTimer["Global Concurrent Multi-Timer Widget"]
        AxiosClient["Axios HTTP Client with Bearer JWT Interceptors"]
    end

    subgraph ApiGateway["Backend API Tier (ASP.NET Core 8 Web API)"]
        KestrelServer["Kestrel Web Server (:5000)"]
        CorsMiddleware["CORS Policy Middleware"]
        AuthMiddleware["JWT Bearer Authentication Handler"]
        AuditFilter["Global AuditLogActionFilter (Mutating HTTP Logging)"]
        SwaggerDoc["Swagger / OpenAPI v3 with JWT Authorize Modal"]
        
        subgraph ApiControllers["API Controllers (/api/*)"]
            AuthCtrl["AuthApiController"]
            TasksCtrl["TasksApiController (Default Grid + Kanban)"]
            ProjectsCtrl["ProjectsApiController"]
            TimesheetCtrl["TimesheetsApiController (Multi-Timer)"]
            AttendanceCtrl["AttendanceApiController"]
            CalendarCtrl["CalendarApiController (RBAC Scoped)"]
            NotesCtrl["NotesApiController (Multi-File Attachments)"]
            MembersCtrl["MembersApiController (Approval & Delete)"]
            SqlToolsCtrl["SqlToolsApiController (15+ Dialects)"]
            JsonToolsCtrl["JsonToolsApiController"]
            MasterDataCtrl["MasterDataApiController"]
            EmailConfigCtrl["EmailConfigApiController (7 Templates)"]
            SyncCtrl["SyncApiController (Push/Pull/ZIP)"]
            AuditCtrl["AuditTrailApiController"]
            DashboardCtrl["DashboardApiController"]
        end

        subgraph ServiceLayer["Domain & Infrastructure Services"]
            JwtSvc["JwtService (HMAC-SHA256 Token Generator)"]
            ExcelSvc["ClosedXmlService (Standard 9-col & ARMS 21-col)"]
            EmailSvc["EmailService (MailKit SMTP + Background Dispatcher)"]
            SyncSvc["DatabaseSyncService & FileAttachmentSyncService"]
            SqlFormatSvc["SqlFormatterService (15+ Engine Dialects)"]
        end
        
        DbContext["EF Core 8 AppDbContext (Pomelo MySQL Provider)"]
    end

    subgraph PersistenceLayer["Storage & Database Tier (Docker Volumes)"]
        MySQL_DB[("MySQL 8.4 Container (:3306)\nPersistent Volume: ./mysql_data")]
        PhysicalStorage[("Physical File Upload Storage\n./uploads/avatars/\n./uploads/covers/\n./uploads/notes/{username}/")]
    end

    ClientLayer <--> |REST JSON over HTTP(S) with Bearer JWT| KestrelServer
    KestrelServer --> CorsMiddleware --> AuthMiddleware --> AuditFilter --> ApiControllers
    ApiControllers --> ServiceLayer
    ServiceLayer --> DbContext
    DbContext <--> |SQL Queries (InnoDB utf8mb4)| MySQL_DB
    ServiceLayer <--> |File I/O (Safe MIME Streams)| PhysicalStorage
```

---

### 3. Repository & Directory Structure (Monorepo)

```text
ProjectManagementv2/
├── backend/
│   ├── WorkTracker.Api/                # Web API Entry Point
│   │   ├── Controllers/                # REST Controllers
│   │   ├── Middlewares/                # JWT, Exception Handling, AuditFilter
│   │   ├── Program.cs                  # Pipeline, DI, Swagger, MySQL Config
│   │   ├── appsettings.json            # Configuration template
│   │   └── Dockerfile                  # Multi-stage .NET 8 build
│   ├── WorkTracker.Core/               # Domain Models, Enums, DTOs
│   │   ├── Entities/                   # 21 Entity classes matching TSD
│   │   ├── Enums/                      # TaskStatus, Priority, Milestone, etc.
│   │   ├── DTOs/                       # Strongly-typed request/response models
│   │   └── Interfaces/                 # Service contracts
│   └── WorkTracker.Infrastructure/     # EF Core & External Services
│       ├── Data/                       # AppDbContext, Seeders, ModelConfigurations
│       ├── Migrations/                 # EF Core MySQL migration snapshots
│       └── Services/                   # EmailService, ClosedXmlService, etc.
├── frontend/                           # React SPA (Vite + JavaScript)
│   ├── public/                         # Static assets (favicons, svg logos)
│   ├── src/
│   │   ├── api/                        # Axios instance, API endpoints mapping
│   │   ├── assets/                     # Default covers, avatars, SVG illustrations
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── layout/                 # Sidebar, Topbar, MobileDrawer, MobileBottomNav
│   │   │   ├── common/                 # Button, Modal, Card, Input, Badge, Dropdown
│   │   │   ├── tasks/                  # TaskTableGrid, TaskKanban, TaskEditModal
│   │   │   ├── timesheet/              # ActiveTimerBar, ManualSessionModal
│   │   │   └── attendance/             # AttendanceWidget, MonthlyReconcileTable
│   │   ├── context/                    # AuthContext, ThemeContext, TimerContext
│   │   ├── hooks/                      # useSessionGuard, useTimer, useWindowSize
│   │   ├── pages/                      # Page views matching all 19 modules
│   │   ├── styles/                     # themes.css (40 themes tokens), index.css
│   │   ├── utils/                      # formatters, dateUtils, exportHelpers
│   │   ├── App.jsx                     # Router & ProtectedRoute wrappers
│   │   └── main.jsx                    # React root with Anti-FOUC initialization
│   ├── index.html                      # Anti-FOUC theme & font injector script
│   ├── package.json
│   ├── vite.config.js                  # Proxy configuration to :5000 in dev
│   └── tailwind.config.js              # Theme custom tokens & typography integration
├── docker-compose.yml                  # Full stack orchestration (mysql, backend, frontend)
└── README.md
```

---

### 4. Database Specification: MySQL 8.x (InnoDB, utf8mb4)

All 21 tables from the Technical Specification Document (TSD) are mapped to MySQL with optimal indexation, cascading constraints, and multi-tenancy `CompanyId` scoping:

| No | Table Name | Primary Key | Description & Foreign Keys |
| :--- | :--- | :--- | :--- |
| 1 | `Companies` | `Id` (INT AUTO_INCREMENT) | Tenant organization. Fields: `Name`, `Code`, `Description`, `CreatedAt` |
| 2 | `AspNetUsers` | `Id` (VARCHAR(36)) | Identity user credentials, profile, `CompanyId` (FK), `IsApproved`, `JobTitle`, `AvatarColor`, `ProfilePictureUrl`, `CoverPictureUrl` |
| 3 | `AspNetRoles` | `Id` (VARCHAR(36)) | Role definitions (`Admin`, `User`, `System Analyst`, `Technical Writer`) |
| 4 | `AspNetUserRoles` | `UserId`, `RoleId` | Composite PK mapping users to roles |
| 5 | `Projects` | `Id` (INT AUTO_INCREMENT) | Project entities. `CompanyId` (FK), `Name`, `Description`, `Color`, `Deadline`, `Status`, `CreatedAt` |
| 6 | `Categories` | `Id` (INT AUTO_INCREMENT) | Technical classification categories. `Name`, `Color`, `Description` |
| 7 | `Tasks` | `Id` (INT AUTO_INCREMENT) | Core tasks & subtasks. `ProjectId` (FK), `CategoryId` (FK), `CompanyId` (FK), `AssignedToUserId` (FK), `ParentTaskId` (Self-referencing FK), `Title`, `Description`, `Status`, `Priority`, `Progress`, `Milestone`, `Obstacle`, `Solution`, `DueDate`, `Tags`, `CreatedAt`, `UpdatedAt` |
| 8 | `Sessions` | `Id` (INT AUTO_INCREMENT) | Work time records. `TaskId` (FK ON DELETE CASCADE), `UserId` (FK), `StartTime`, `EndTime` (NULL if timer running), `Duration` (seconds), `Notes` |
| 9 | `Attendances` | `Id` (INT AUTO_INCREMENT) | Daily attendance records. `UserId` (FK), `Date`, `Type` (Hadir/WFH/Sakit/Izin/Cuti/Dinas/Libur), `WorkLocation` (WFO/WFH/Dinas/Remote), `ClockIn`, `ClockOut`, `TotalHours`, `Notes`, `Status` (Approved/Pending/Rejected), `ApprovedByUserId` (FK) |
| 10 | `Notes` | `Id` (INT AUTO_INCREMENT) | Rich-text developer documentation. `AuthorUserId` (FK), `TaskId` (FK), `CompanyId` (FK), `Title`, `ContentHtml`, `Category`, `Color`, `IsPinned`, `CreatedAt`, `UpdatedAt` |
| 11 | `NoteAttachments` | `Id` (INT AUTO_INCREMENT) | Physical uploaded attachments. `NoteId` (FK ON DELETE CASCADE), `FileName`, `FilePath`, `FileSize`, `ContentType`, `FileExtension`, `UploadedByUserId` (FK), `UploadedAt` |
| 12 | `MasterBadges` | `Id` (INT AUTO_INCREMENT) | Achievement definitions. `Code`, `Name`, `Description`, `Category`, `Icon`, `Color`, `Points`, `Rarity`, `TriggerType`, `TriggerThreshold`, `IsActive` |
| 13 | `UserBadges` | `Id` (INT AUTO_INCREMENT) | User unlocked badges. `UserId` (FK), `BadgeId` (FK), `UnlockedAt`, `IsFeatured`, `AwardedBy` |
| 14 | `MasterPriorities` | `Id` (INT AUTO_INCREMENT) | Task priority references (`Low`, `Medium`, `High`, `Critical`) |
| 15 | `MasterStatuses` | `Id` (INT AUTO_INCREMENT) | Task status references (`Todo`, `InProgress`, `Review`, `Done`, `Overdue`) |
| 16 | `MasterMilestones` | `Id` (INT AUTO_INCREMENT) | SDLC Waterfall milestones (`Requirement Analysis`, `System Design`, `Implementation`, `Testing & QA`, `Deployment`, `Maintenance`) |
| 17 | `SystemSettings` | `Key` (VARCHAR(100) PK) | Dynamic key-value config: SMTP credentials, timeouts, host sync keys |
| 18 | `EmailTemplates` | `Id` (INT AUTO_INCREMENT) | 7 event HTML templates (`EventCode`, `Subject`, `BodyHtml`, `AvailableVariables`) |
| 19 | `AuditLogs` | `Id` (INT AUTO_INCREMENT) | Audit trail of mutating HTTP actions (`UserId`, `Controller`, `Action`, `HttpMethod`, `Path`, `StatusCode`, `DurationMs`, `Timestamp`) |
| 20 | `ImportLogs` | `Id` (INT AUTO_INCREMENT) | Excel import execution history (`FileName`, `TotalRows`, `SuccessRows`, `FailedRows`, `Errors`) |
| 21 | `SqlHistories` & `JsonHistories` | `Id` (INT AUTO_INCREMENT) | Saved queries & payloads associated with tasks or developer tools |

---

### 5. Detailed Module Specifications

#### 5.1 Authentication, JWT & Session Security
- **Dual Scheme Support**: Standardized on stateless **JWT Bearer Token** for API + React SPA.
- **Login Endpoint**: `POST /api/auth/login`. Returns token containing: `sub`, `email`, `name`, `role`, `companyId`, `jobTitle`.
- **Approval Check**: If `IsApproved == false`, returns `HTTP 403 Forbidden` with informative approval message.
- **Registration**: `POST /api/auth/register`. Registers with default `IsApproved = false`. Sends `ADMIN_NEW_USER_ALERT` email.
- **Client Inactivity Guard (`useSessionGuard`)**:
  - Event listener throttled at 3000ms.
  - 55 minutes: Interactive modal dialog with 300s countdown timer and "Lanjutkan Sesi" button.
  - 60 minutes: Auto-clears token and redirects to `/login?reason=timeout`.

#### 5.2 Task Management & Unified Timesheet Form
- **Default View: Interactive Grid Table**:
  - Instant client/server search and multi-filtering (Status, Priority, Project, PIC, Milestone, Date range).
  - Responsive table container with row cards on mobile viewport.
  - Parent-Child hierarchy tree badges.
  - Obstacle & Solution modal editor and indicator tags.
  - Progress slider (0-100%) with quick jump buttons (0%, 25%, 50%, 75%, 100%) and auto-sync to *Done* at 100%.
- **Alternate View: Kanban Board**:
  - Toggle button in toolbar (`Grid (Default)` vs `Kanban`).
  - 4 status columns with drag-and-drop.
  - Mobile segmented column switcher pill bar (`📋 Todo`, `🔄 In Progress`, `🔍 Review`, `✅ Done`).
- **Unified Save (`SaveTaskAndSession`)**:
  - Modal form allows editing task attributes AND entering manual work session (Hours, Minutes, Date, Session Notes).
  - Single atomic HTTP PUT/POST call saving both task updates and new `Sessions` row.

#### 5.3 Timesheet, Multi-Timer & Excel Reports
- **Active Concurrent Multi-Timer**:
  - Real-time ticker in topbar and floating bottom widget.
  - Users can start multiple timers simultaneously; timers persist across page reloads via server check (`GET /api/timesheets/active`).
- **ClosedXML Excel Export**:
  - `GET /api/timesheets/export`: Generates multi-sheet workbook (.xlsx) with personal metadata, daily details, SUM formulas, and project breakdown.

#### 5.4 Attendance & Reconciliation
- **Self-Service**: Check In / Check Out buttons with live work duration stopwatch.
- **Status Selection**: Hadir, WFH, Sakit, Izin, Cuti, Dinas, Libur.
- **Admin Reconciliation**: Monthly matrix view for reviewing all team members, manual entries, and status approval.

#### 5.5 Interactive Calendar (RBAC Scoped)
- **Month/Week/Day Views**: Tasks mapped to due dates with color badges.
- **Role Scoping**:
  - Regular user: Locked to `filter=mine`.
  - Admin: Scope dropdown to toggle between `filter=all` (All Team) and `filter=mine` (My Tasks).
- **Click Interaction**: Task summary modal with direct navigation link.

#### 5.6 Developer Tools (SQL Beautifier & JSON Tools)
- **SQL Beautifier**: 15+ dialects supported, uppercase/lowercase keyword formatting, minifier, syntax validator, clipboard copy, `.sql` download, and query history.
- **JSON Payload Tools**: Beautifier, validator, minifier, and payload template history.

#### 5.7 SMTP Email Integration & 7 Event Templates
- Dynamic configuration via `SystemSettings`.
- Test connection endpoint with latency measurement and diagnostic handshake log.
- 7 templates: `USER_REGISTERED`, `ADMIN_NEW_USER_ALERT`, `USER_APPROVED`, `USER_REJECTED`, `PASSWORD_RESET_NOTIFICATION`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`.
- Background-safe execution: email sending failure does not fail user business transactions.

#### 5.8 Multi-Instance Sync Engine
- Push & Pull via REST API with Base64 file streaming.
- Full ZIP package archive export/import (`manifest.json`, `sync_data.sql`, `uploads/`).
- Secure API Secret Key (`X-Sync-Key`) header.

---

### 6. User Interface, Responsive Design & Ergonomics

#### 6.1 Responsive Layout System
- **Desktop (>= 1024px)**:
  - Collapsible Sidebar with icons and grouped navigation.
  - Minimalist Topbar: Active page title, company badge, global search, quick action buttons, theme & font switcher, active timers widget, user avatar dropdown.
- **Tablet & Mobile (< 1024px)**:
  - **Off-Canvas Drawer Navigation**: Smooth slide-in menu with backdrop blur.
  - **Glassmorphic Bottom Navigation (< 768px)**: Floating frosted glass bar with 5 key actions:
    1. *Dashboard*
    2. *Tasks (Grid/Kanban)*
    3. *Quick Add (+)*
    4. *Projects*
    5. *Menu (Drawer Toggle)*
  - **Safe Area Insets**: Full support for iOS notch and Android gesture bars (`pb-safe`, `pt-safe`).
  - **Touch Ergonomics**: All interactive click targets have minimum 44px height/width.

#### 6.2 40 Eye-Friendly Themes & 5 Google Fonts Switcher
- **Themes**: 22 Light themes (Indigo Nebula, Emerald Forest, Ocean Azure, etc.) and 18 Dark themes (Nordic Frost, Midnight OLED, etc.) powered by CSS custom properties in `themes.css`.
- **5 Fonts**: `Inter`, `Plus Jakarta Sans`, `Outfit`, `Poppins`, `Roboto`.
- **Zero FOUC**: Pre-render inline script in `index.html` applying cached `data-theme` and `data-font` from `localStorage`.
- **Interactive Onboarding Tour**: 6-step guided walkthrough highlighting key workflows.

---

### 7. Phased Implementation Roadmap

1. **Phase 1: Foundation & Infrastructure**
   - Setup project directory structure (`backend/` and `frontend/`).
   - Create Docker Compose with MySQL 8.4 container and persistent volume.
   - Setup .NET 8 Web API with Pomelo MySQL EF Core, create all 21 entities, and implement `DatabaseSeeder`.
   - Setup JWT Bearer authentication pipeline and Swagger Authorize modal.
   - Initialize React 18 SPA (Vite + Tailwind CSS + Lucide Icons), implement 40 themes & 5 fonts engine, Anti-FOUC, and responsive layout (Sidebar, Topbar, Mobile Drawer, Mobile Bottom Nav).
2. **Phase 2: Core Work Management (Tasks, Grid, Kanban, Projects & Multi-Timer Timesheet)**
   - Tasks API & Grid Table (Default View) with parenting, obstacles, solutions, progress slider.
   - Kanban Board alternate view with drag-and-drop.
   - Unified task edit & manual timesheet logging form.
   - Projects API & dynamic progress calculation.
   - Active concurrent multi-timer in React (`TimerContext` & floating ticker).
   - ClosedXML personal timesheet Excel export.
3. **Phase 3: Operational Modules (Attendance, Calendar, Notes & Developer Tools)**
   - Attendance check-in/out, live daily timer, status options, and admin monthly reconciliation.
   - Interactive calendar with RBAC filter (Mine vs All Team).
   - Work notes rich editor, category tagging, pinning, and multi-file upload.
   - SQL Beautifier (15+ dialects) and JSON Payload tools.
4. **Phase 4: Enterprise Administration & System Services**
   - Members directory (Pure Grid Card layout, cover upload, approval workflow, double-confirmation delete, password reset).
   - Master data management (Priorities, Statuses, Milestones, Categories).
   - Audit trail filter, summary metrics, and CSV export.
   - Excel Import/Export (Standard 9-col & ARMS 21-col).
   - SMTP email service with live diagnostic test and 7 dynamic HTML event templates.
   - Multi-Instance Sync engine (REST push/pull & ZIP package export/import).
5. **Phase 5: Responsive Polish, Onboarding Tour & End-to-End Verification**
   - Responsive audit across desktop, tablet, and mobile viewports.
   - Interactive 6-step onboarding tour.
   - End-to-end integration testing and validation.
