# Work Tracker Pro v3.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete enterprise work management, multi-timer timesheet, attendance, and developer tools platform using ASP.NET Core 8 Web API with MySQL 8.4 database and React 18 SPA (Vite + Tailwind CSS + Lucide Icons).

**Architecture:** Modern Clean Architecture Monorepo with decoupled backend REST API (`/backend`) providing 100+ endpoints with stateless JWT Bearer authentication, and a responsive frontend SPA (`/frontend`) featuring 40 eye-friendly themes, 5 Google Fonts switcher, Grid-first task management with Kanban toggle, and mobile off-canvas drawer / glass bottom navigation. Multi-container setup is orchestrated via root `docker-compose.yml`.

**Tech Stack:** ASP.NET Core 8.0, C# 12, Entity Framework Core 8, Pomelo.EntityFrameworkCore.MySql, ClosedXML 0.104.2, MailKit, BCrypt.Net / ASP.NET Identity, React 18, Vite 5, Tailwind CSS 3, Lucide React, Axios, Docker Compose, MySQL 8.4 LTS.

**Spec:** [docs/superpowers/specs/2026-09-24-work-tracker-pro-design.md](file:///c:/TEMP/VSCODE/ProjectManagementv2/docs/superpowers/specs/2026-09-24-work-tracker-pro-design.md)

## Global Constraints
- Target Framework: .NET 8.0 (C# 12) Web API
- Database: MySQL 8.4 LTS (`utf8mb4_unicode_ci`, InnoDB Engine) via `Pomelo.EntityFrameworkCore.MySql`
- Frontend: React 18 (JavaScript, Vite 5, Tailwind CSS 3, Lucide React Icons)
- Authentication: Pure stateless JWT Bearer Token (`HMAC-SHA256`) with `sub`, `email`, `name`, `role`, `companyId`, `jobTitle`
- Inactivity Timeout: 60 minutes auto-logout with interactive 300s warning modal at 55 minutes
- Task Default View: Interactive Grid/Table View as the default view, with toggleable Kanban Board
- Responsiveness: Full support for Desktop (>=1024px), Tablet/Mobile (<1024px with Off-Canvas Drawer), and Smartphone (<768px with Glassmorphic Bottom Bar and safe area insets)
- All 21 database tables from TSD must be created with foreign key integrity and auto-seeding

---

## Phase 1: Foundation, Infrastructure & Core Setup

### Task 1: Docker Compose & MySQL 8.4 Container Setup

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.gitignore`

**Interfaces:**
- Produces: MySQL 8.4 container listening on `localhost:3306`, database `worktracker_db`, user `tracker_user`, healthcheck endpoint.

- [ ] **Step 1: Create root `.gitignore`**
Include standard rules for `.NET` (`bin/`, `obj/`), `Node.js` (`node_modules/`, `dist/`), Docker volumes (`mysql_data/`, `uploads/`), and environment files (`.env`).

- [ ] **Step 2: Create root `docker-compose.yml`**
Define services:
- `mysql`: Image `mysql:8.4`, port `3306:3306`, persistent volume `./mysql_data:/var/lib/mysql`, default character set `utf8mb4`, collation `utf8mb4_unicode_ci`, healthcheck test using `mysqladmin ping`.
- `backend`: Build context `./backend`, port `5000:5000`, depends on `mysql` with condition `service_healthy`.
- `frontend`: Build context `./frontend`, port `3000:80`, depends on `backend`.

- [ ] **Step 3: Test MySQL container startup**
Run: `docker compose up -d mysql`
Expected: Container `worktracker_mysql` starts and health status becomes `healthy`.

---

### Task 2: Backend Solution Scaffolding & Domain Entities

**Files:**
- Create: `backend/WorkTracker.sln`
- Create: `backend/WorkTracker.Core/WorkTracker.Core.csproj`
- Create: `backend/WorkTracker.Infrastructure/WorkTracker.Infrastructure.csproj`
- Create: `backend/WorkTracker.Api/WorkTracker.Api.csproj`
- Create: `backend/WorkTracker.Core/Entities/*.cs` (21 domain entities)
- Create: `backend/WorkTracker.Core/Enums/*.cs` (Enums: TaskStatus, TaskPriority, MilestonePhase, AttendanceType, WorkLocation, etc.)
- Create: `backend/WorkTracker.Core/DTOs/*.cs` (Common ApiResponse, PagedResult, Auth DTOs)

**Interfaces:**
- Produces: 21 Domain Entities conforming to MySQL schema specification:
  - `Company`, `ApplicationUser`, `ApplicationRole`, `ApplicationUserRole`
  - `Project`, `Category`, `WorkTask`, `WorkSession`
  - `AttendanceRecord`, `WorkNote`, `NoteAttachment`
  - `MasterBadge`, `UserBadge`, `MasterPriority`, `MasterStatus`, `MasterMilestone`
  - `SystemSetting`, `EmailTemplate`, `AuditLog`, `ImportLog`, `SqlHistory`, `JsonHistory`

- [ ] **Step 1: Scaffold .NET 8 solution and projects**
Run commands:
```powershell
dotnet new sln -n WorkTracker -o backend
dotnet new classlib -n WorkTracker.Core -o backend/WorkTracker.Core
dotnet new classlib -n WorkTracker.Infrastructure -o backend/WorkTracker.Infrastructure
dotnet new webapi -n WorkTracker.Api -o backend/WorkTracker.Api --no-openapi false
dotnet sln backend/WorkTracker.sln add backend/WorkTracker.Core/WorkTracker.Core.csproj
dotnet sln backend/WorkTracker.sln add backend/WorkTracker.Infrastructure/WorkTracker.Infrastructure.csproj
dotnet sln backend/WorkTracker.sln add backend/WorkTracker.Api/WorkTracker.Api.csproj
dotnet add backend/WorkTracker.Infrastructure/WorkTracker.Infrastructure.csproj reference backend/WorkTracker.Core/WorkTracker.Core.csproj
dotnet add backend/WorkTracker.Api/WorkTracker.Api.csproj reference backend/WorkTracker.Infrastructure/WorkTracker.Infrastructure.csproj
dotnet add backend/WorkTracker.Api/WorkTracker.Api.csproj reference backend/WorkTracker.Core/WorkTracker.Core.csproj
```

- [ ] **Step 2: Add NuGet dependencies**
In `WorkTracker.Infrastructure`:
```powershell
dotnet add backend/WorkTracker.Infrastructure package Pomelo.EntityFrameworkCore.MySql --version 8.0.2
dotnet add backend/WorkTracker.Infrastructure package Microsoft.AspNetCore.Identity.EntityFrameworkCore --version 8.0.8
dotnet add backend/WorkTracker.Infrastructure package ClosedXML --version 0.104.2
dotnet add backend/WorkTracker.Infrastructure package MailKit --version 4.7.1.1
```
In `WorkTracker.Api`:
```powershell
dotnet add backend/WorkTracker.Api package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.8
dotnet add backend/WorkTracker.Api package Swashbuckle.AspNetCore --version 6.7.3
dotnet add backend/WorkTracker.Api package Microsoft.EntityFrameworkCore.Design --version 8.0.8
```

- [ ] **Step 3: Define all 21 Entities, Enums and DTOs**
Implement entity classes in `WorkTracker.Core/Entities/` with exact table names, property types, and relationships matching `MYSQL_DATABASE_SCHEMA.md`.

- [ ] **Step 4: Verify Compilation**
Run: `dotnet build backend/WorkTracker.sln`
Expected: Build succeeded with 0 errors.

---

### Task 3: EF Core MySQL DbContext, Seeder & JWT Authentication

**Files:**
- Create: `backend/WorkTracker.Infrastructure/Data/AppDbContext.cs`
- Create: `backend/WorkTracker.Infrastructure/Data/DatabaseSeeder.cs`
- Create: `backend/WorkTracker.Infrastructure/Services/JwtService.cs`
- Create: `backend/WorkTracker.Api/Controllers/AuthApiController.cs`
- Create: `backend/WorkTracker.Api/Middlewares/AuditLogActionFilter.cs`
- Create: `backend/WorkTracker.Api/appsettings.json`
- Modify: `backend/WorkTracker.Api/Program.cs`

**Interfaces:**
- Produces:
  - Database schema generated via EF Core Migrations on MySQL.
  - Seeder initializing: 1 default company, 4 roles, 1 admin user (`admin@trackerkerja.com` / `Admin@123!`), 5 master statuses, 4 master priorities, 6 milestones, 7 email templates, and badges.
  - `POST /api/auth/login` returning Bearer JWT token with claims.
  - `POST /api/auth/register` with default `IsApproved = false`.
  - `GET /api/auth/me` returning current user profile.
  - Swagger UI with JWT Bearer Authorize modal.

- [ ] **Step 1: Implement `AppDbContext`**
Inherit from `IdentityDbContext<ApplicationUser, ApplicationRole, string>`. Register `DbSet` for all remaining 17 domain tables with explicit Fluent API mappings (indexes, foreign keys, cascade rules).

- [ ] **Step 2: Implement `DatabaseSeeder`**
Seed default company `PT Elistec Teknologi`, roles (`Admin`, `User`, `System Analyst`, `Technical Writer`), default Administrator user, master statuses/priorities/milestones, and 7 email templates if not already present.

- [ ] **Step 3: Configure `Program.cs`**
Configure Pomelo MySQL DbContext, ASP.NET Identity with password options (min length 6), JWT Bearer authentication options, CORS policy allowing `http://localhost:5173` and `http://localhost:3000`, and Swagger Gen with Bearer security scheme definition.

- [ ] **Step 4: Create EF Core Migration and Apply to MySQL**
Run commands:
```powershell
dotnet ef migrations add InitialCreate --project backend/WorkTracker.Infrastructure --startup-project backend/WorkTracker.Api -o Migrations
dotnet ef database update --project backend/WorkTracker.Infrastructure --startup-project backend/WorkTracker.Api
```

- [ ] **Step 5: Verify Auth API with Curl/PowerShell**
Run:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body '{"email":"admin@trackerkerja.com","password":"Admin@123!"}' -ContentType "application/json"
```
Expected: Returns JSON with `isSuccess: true`, token, and user profile with `role: "Admin"`.

---

### Task 4: Frontend React 18 SPA Scaffolding, 40 Themes & 5 Fonts Engine

**Files:**
- Create: `frontend/` (via Vite React JavaScript)
- Create: `frontend/src/styles/themes.css` (CSS variable tokens for 40 themes)
- Create: `frontend/src/context/ThemeContext.jsx` (40 themes + 5 Google Fonts switcher)
- Create: `frontend/src/context/AuthContext.jsx` (JWT token state, login, logout, user profile)
- Create: `frontend/src/hooks/useSessionGuard.js` (60m inactivity detector, 55m modal warning)
- Create: `frontend/src/api/axiosClient.js` (Axios instance with Bearer token interceptor)
- Create: `frontend/index.html` (Anti-FOUC inline theme and font loader script in `<head>`)
- Create: `frontend/tailwind.config.js` (Extended colors using CSS variables)

**Interfaces:**
- Produces:
  - Lightning-fast React SPA running on Vite (`:5173`).
  - Seamless theme switcher with 40 eye-friendly themes (22 Light + 18 Dark).
  - 5 Google Fonts switcher: Inter, Plus Jakarta Sans, Outfit, Poppins, Roboto.
  - Zero-FOUC (Flash of Unstyled Content) on initial page load.
  - AuthContext providing `user`, `token`, `isAuthenticated`, `login()`, `logout()`.
  - Inactivity guard warning modal at 55 minutes.

- [ ] **Step 1: Initialize Vite React application**
Run commands:
```powershell
npm.cmd create vite@latest frontend -- --template react
cd frontend
npm.cmd install
npm.cmd install -D tailwindcss postcss autoprefixer
npm.cmd install lucide-react axios react-router-dom
npx.cmd tailwindcss init -p
```

- [ ] **Step 2: Configure `themes.css` and `tailwind.config.js`**
Define CSS custom tokens (`--bg-primary`, `--bg-secondary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--accent-primary`, `--border-color`) for all 40 themes and map them in Tailwind theme configuration.

- [ ] **Step 3: Implement `ThemeContext.jsx` & Anti-FOUC Script in `index.html`**
Store selected theme and font in `localStorage`. Load Google Fonts dynamically. Add inline script in `index.html` `<head>` to read stored theme/font before rendering to prevent visual flickering.

- [ ] **Step 4: Implement `AuthContext.jsx` & `useSessionGuard.js`**
Manage JWT in `localStorage`. Set up activity event listeners (`mousemove`, `keydown`, `scroll`, `click`, `touchstart`) throttled at 3000ms. Provide modal alert at 55 minutes with 300s countdown.

- [ ] **Step 5: Verify Frontend Dev Server**
Run: `npm.cmd run dev` inside `frontend/`.
Expected: Dev server runs at `http://localhost:5173` without console errors.

---

### Task 5: Responsive Layout System (Desktop Sidebar + Mobile Drawer + Glass Bottom Nav)

**Files:**
- Create: `frontend/src/components/layout/AppLayout.jsx`
- Create: `frontend/src/components/layout/Sidebar.jsx` (Desktop collapsible navigation)
- Create: `frontend/src/components/layout/Topbar.jsx` (Page title, company badge, search, theme/font picker, user avatar)
- Create: `frontend/src/components/layout/MobileDrawer.jsx` (Slide-in drawer for <1024px with backdrop blur)
- Create: `frontend/src/components/layout/MobileBottomNav.jsx` (Glassmorphic bottom bar for <768px with 5 quick actions)
- Create: `frontend/src/components/layout/ThemeModal.jsx` (Interactive modal to choose 40 themes & 5 fonts)
- Create: `frontend/src/components/layout/SessionWarningModal.jsx`
- Create: `frontend/src/pages/LoginPage.jsx` (Modern login with Lottie animation, theme switcher, remember me)
- Create: `frontend/src/pages/RegisterPage.jsx` (Registration with company selection & approval notice)

**Interfaces:**
- Produces:
  - Responsive app shell adapting across Desktop (>=1024px), Tablet (<1024px), and Mobile (<768px).
  - Protected route guard redirecting unauthenticated users to `/login`.
  - Accessible theme & font selector modal from topbar.

- [ ] **Step 1: Build `Sidebar.jsx` and `Topbar.jsx`**
Desktop sidebar with grouped navigation:
- Dashboard, Tugas (Grid/Kanban), Proyek, Timesheet, Presensi, Kalender, Catatan.
- Developer Tools: SQL Beautifier, JSON Tools.
- Administrasi: Anggota Tim, Master Data, Audit Trail, Pengaturan Email.
Topbar with company badge, quick search, theme button, font switcher, and profile avatar dropdown.

- [ ] **Step 2: Build `MobileDrawer.jsx` and `MobileBottomNav.jsx`**
Mobile drawer triggered by hamburger menu. Bottom bar with 5 icons: Home, Tugas, Elevated +, Proyek, Menu. Support iOS/Android safe area padding (`pb-safe`).

- [ ] **Step 3: Build `LoginPage.jsx` and `RegisterPage.jsx`**
Clean card layout with theme toggle, animated SVG/Lottie visual, error banners, and redirection to `/login?reason=timeout` or approval pending status.

- [ ] **Step 4: Verify Layout Responsiveness**
Open `http://localhost:5173` in browser, test resizing viewport between 375px (iPhone), 768px (iPad), and 1440px (Desktop).
Expected: Transitions seamlessly between Sidebar and Mobile Bottom Bar + Drawer.

---

## Phase 2: Core Work Management (Tasks, Grid, Kanban, Projects & Multi-Timer)

### Task 6: Task Management API (Grid Default, Kanban, Parenting, Obstacles & Unified Save)

**Files:**
- Create: `backend/WorkTracker.Api/Controllers/TasksApiController.cs`
- Create: `backend/WorkTracker.Api/Controllers/ProjectsApiController.cs`
- Create: `backend/WorkTracker.Core/DTOs/TaskDtos.cs`
- Create: `backend/WorkTracker.Core/DTOs/ProjectDtos.cs`
- Create: `backend/WorkTracker.Infrastructure/Services/TaskPermissionService.cs`

**Interfaces:**
- Produces:
  - `GET /api/tasks`: Paginated, multi-filter search (Status, Priority, Project, PIC, Milestone, Date range, ParentTaskId).
  - `GET /api/tasks/{id}`: Detailed task with subtasks and work sessions.
  - `POST /api/tasks`: Create task / subtask.
  - `PUT /api/tasks/{id}`: Update task.
  - `PUT /api/tasks/{id}/unified-save`: Atomic save updating task and creating manual `Sessions` row.
  - `PUT /api/tasks/{id}/status`: Status update for Kanban drag-and-drop.
  - `PUT /api/tasks/{id}/progress`: Slider progress update (auto-sync to Done at 100%).
  - `GET /api/tasks/kanban`: Column-grouped task collections.
  - `GET /api/projects`: Projects with dynamically calculated progress %.

- [ ] **Step 1: Implement `ProjectsApiController`**
CRUD endpoints for projects with company isolation filter and aggregated progress calculation `Tasks.Average(t => t.Progress)`.

- [ ] **Step 2: Implement `TasksApiController`**
Full CRUD, parenting relationship, search by term, filtering by company and assignee, and `UnifiedSave` endpoint executing inside `IDbContextTransaction`.

- [ ] **Step 3: Verify Tasks API with automated tests or integration script**
Send requests to create project, create parent task, create child task, and execute unified save.
Expected: Returns HTTP 200/201 with valid data structure.

---

### Task 7: Frontend Task Management Page (Grid View Default & Kanban Toggle)

**Files:**
- Create: `frontend/src/pages/TasksPage.jsx`
- Create: `frontend/src/components/tasks/TaskTableGrid.jsx` (Default View: Interactive Table)
- Create: `frontend/src/components/tasks/TaskKanbanBoard.jsx` (Alternate View: Drag-and-Drop)
- Create: `frontend/src/components/tasks/TaskFormModal.jsx` (Unified Task + Manual Timesheet Save)
- Create: `frontend/src/components/tasks/TaskDetailDrawer.jsx` (Slide-over detail view)
- Create: `frontend/src/pages/ProjectsPage.jsx`

**Interfaces:**
- Produces:
  - Tasks page displaying **Interactive Grid Table as default**.
  - Toggle switch in toolbar: `[ 📑 Grid (Default) ]` vs `[ 📋 Kanban ]`.
  - Multi-filtering toolbar (search, status, priority, project, PIC, milestone).
  - Parent-child tree badges, obstacle/solution indicators.
  - Progress slider (0-100%) with quick buttons (0%, 25%, 50%, 75%, 100%).
  - Kanban board with drag-and-drop and mobile segmented column tabs.
  - Unified modal for task editing + manual work session logging.

- [ ] **Step 1: Build `TaskTableGrid.jsx`**
Responsive table with column sorting, checkbox selection, PIC avatar badge, status pills, obstacle indicator tooltip, and action menu. On mobile, automatically renders as clean responsive task cards.

- [ ] **Step 2: Build `TaskKanbanBoard.jsx`**
4 columns (Todo, In Progress, Review, Done). Mobile segmented pill bar (`📋 Todo`, `🔄 In Progress`, `🔍 Review`, `✅ Done`) for smartphone screens.

- [ ] **Step 3: Build `TaskFormModal.jsx` with Unified Timesheet Form**
Modal contains: Title, Project, Category, Assignee, Priority, Status, Milestone, Dates, Obstacle & Solution, and a collapsible section **"Catat Jam Kerja Manual (Timesheet)"** (Hours, Minutes, Date, Session Notes).

- [ ] **Step 4: Build `ProjectsPage.jsx`**
Card grid of projects with deadline indicators, member avatars, color tags, and circular/linear progress bars.

- [ ] **Step 5: Verify Task Grid & Kanban in Browser**
Test creating tasks, viewing in Grid mode, toggling to Kanban, dragging a card, and using the unified save.
Expected: Both views sync accurately with zero reload.

---

### Task 8: Timesheet, Concurrent Multi-Timer & ClosedXML Excel Export

**Files:**
- Create: `backend/WorkTracker.Api/Controllers/TimesheetsApiController.cs`
- Create: `backend/WorkTracker.Infrastructure/Services/ClosedXmlService.cs`
- Create: `frontend/src/context/TimerContext.jsx`
- Create: `frontend/src/components/timesheet/ActiveTimerBar.jsx`
- Create: `frontend/src/pages/TimesheetPage.jsx`

**Interfaces:**
- Produces:
  - `POST /api/timesheets/start`: Starts a live timer on a task.
  - `POST /api/timesheets/{id}/stop`: Stops timer and saves duration in seconds.
  - `GET /api/timesheets/active`: Fetches running timers for authenticated user.
  - `GET /api/timesheets/export`: Downloads multi-sheet ClosedXML Excel file (.xlsx) with SUM formulas.
  - `TimerContext`: Global React context managing multiple active timers ticking simultaneously with topbar widget and floating bar.

- [ ] **Step 1: Implement `TimesheetsApiController` & `ClosedXmlService`**
Multi-timer logic: allows multiple `WorkSessions` where `EndTime == null`. ClosedXML service creates Sheet 1 ("Timesheet Personal") with auto-sum formulas `=SUM(D8:D35)` and Sheet 2 ("Rekap per Proyek").

- [ ] **Step 2: Implement `TimerContext.jsx` in Frontend**
Fetches active timers on login. Runs tick interval updating seconds. Exposes `startTimer(taskId)`, `stopTimer(sessionId, notes)`, `activeTimers`.

- [ ] **Step 3: Build `ActiveTimerBar.jsx` & `TimesheetPage.jsx`**
Floating bar showing running task title, live stopwatch `01:23:45`, stop button, and quick notes input. Timesheet page lists all past work sessions with date range filter and "Export Excel (.xlsx)" button.

- [ ] **Step 4: Verify Multi-Timer & Excel Export**
Start 2 timers concurrently on 2 different tasks, refresh page (verify timers continue ticking), stop one timer, and click "Export Excel".
Expected: Excel file downloads with correct headers, multi-sheet layout, and valid SUM formulas.

---

## Phase 3: Operational Modules & Developer Tools

### Task 9: Attendance Management & Admin Monthly Reconciliation

**Files:**
- Create: `backend/WorkTracker.Api/Controllers/AttendanceApiController.cs`
- Create: `frontend/src/pages/AttendancePage.jsx`
- Create: `frontend/src/components/attendance/AttendanceWidget.jsx`
- Create: `frontend/src/components/attendance/TeamReconciliationModal.jsx`

**Interfaces:**
- Produces:
  - Self-service Check-In and Check-Out with live daily stopwatch.
  - Status options: Hadir, WFH, Sakit, Izin, Cuti, Dinas, Libur.
  - Location options: WFO, WFH, Dinas, Remote.
  - Admin team monthly reconciliation view (`GET /api/attendance/monthly`).

- [ ] **Step 1: Implement `AttendanceApiController`**
Endpoints: `GET /api/attendance/today`, `POST /api/attendance/check-in`, `POST /api/attendance/check-out`, `GET /api/attendance/monthly`, `POST /api/attendance/reconcile`.

- [ ] **Step 2: Build `AttendanceWidget.jsx` and `AttendancePage.jsx`**
Daily check-in card with live clock, location selector, status pills, and standup notes. Monthly calendar view of attendance history with color codes.

- [ ] **Step 3: Build Admin Reconciliation View**
Monthly matrix table displaying all team members as rows, days of month as columns, with quick edit modal for HR corrections.

- [ ] **Step 4: Verify Attendance Flow**
Test Check-in, observe live timer, test Check-out, and inspect monthly calendar view.

---

### Task 10: Interactive Calendar with RBAC Scope Filter

**Files:**
- Create: `backend/WorkTracker.Api/Controllers/CalendarApiController.cs`
- Create: `frontend/src/pages/CalendarPage.jsx`
- Create: `frontend/src/components/calendar/CalendarTaskModal.jsx`

**Interfaces:**
- Produces:
  - `GET /api/calendar/events?start={date}&end={date}&filter=mine|all`.
  - Regular users locked to `filter=mine`.
  - Admins can toggle between `filter=all` (All Team Tasks) and `filter=mine` (My Tasks).
  - Responsive Month, Week, and Day views with clickable task detail modal.

- [ ] **Step 1: Implement `CalendarApiController`**
Filter tasks falling in the given date range. Apply RBAC: if not Admin, enforce `filter = mine`.

- [ ] **Step 2: Build `CalendarPage.jsx`**
Interactive calendar layout with month/week/day view switchers, previous/next navigation, task cards color-coded by priority/status, and Admin scope dropdown.

- [ ] **Step 3: Build `CalendarTaskModal.jsx`**
Displays task summary, project, assignee name & avatar, milestone, dates, and direct link to task detail.

- [ ] **Step 4: Verify RBAC Calendar Filter**
Log in as regular user (verify dropdown is hidden and locked to mine), log in as admin (verify toggle works between all team and mine).

---

### Task 11: Work Notes, Rich-Text Editor & Multi-File Upload

**Files:**
- Create: `backend/WorkTracker.Api/Controllers/NotesApiController.cs`
- Create: `frontend/src/pages/NotesPage.jsx`
- Create: `frontend/src/components/notes/NoteEditorModal.jsx`
- Create: `frontend/src/components/notes/NoteCard.jsx`

**Interfaces:**
- Produces:
  - CRUD for rich-text notes with category, color tag, and pinned status.
  - Linked task / project association.
  - Multi-file attachment upload stored in `uploads/notes/{username}/` with sanitized names `{yyyyMMdd_HHmmss}_{GUID8}_{CleanFileName}.ext`.
  - File download endpoint with safe MIME types.

- [ ] **Step 1: Implement `NotesApiController`**
Endpoints for notes CRUD, attachment upload with MIME validation, and physical file download.

- [ ] **Step 2: Build `NotesPage.jsx` and `NoteEditorModal.jsx`**
Masonry/grid layout of notes with pinned notes at the top, category filters, rich-text editor (formatting, bold, lists, code), and drag-and-drop file attachment zone.

- [ ] **Step 3: Verify Notes & Attachments**
Create a note, attach a PDF and an image, save, download attachment, and test pinning.

---

### Task 12: Developer Tools (SQL Beautifier 15+ Dialects & JSON Tools)

**Files:**
- Create: `backend/WorkTracker.Api/Controllers/SqlToolsApiController.cs`
- Create: `backend/WorkTracker.Api/Controllers/JsonToolsApiController.cs`
- Create: `backend/WorkTracker.Infrastructure/Services/SqlFormatterService.cs`
- Create: `frontend/src/pages/SqlToolsPage.jsx`
- Create: `frontend/src/pages/JsonToolsPage.jsx`

**Interfaces:**
- Produces:
  - SQL Beautifier supporting 15+ dialects (MySQL, PostgreSQL, T-SQL, Oracle, SQLite, BigQuery, Snowflake, etc.), uppercase/lowercase keyword formatting, minifier, syntax validator, and query history.
  - JSON Payload Tools: Beautifier, validator, minifier, and payload history.

- [ ] **Step 1: Implement `SqlFormatterService` & Controllers**
Backend SQL formatting engine supporting dialect configurations, keyword casing, indent size, and syntax checks. CRUD for `SqlHistories` and `JsonHistories`.

- [ ] **Step 2: Build `SqlToolsPage.jsx`**
Side-by-side or stacked editor with dialect selector, Format, Minify, Validate buttons, Copy to Clipboard, Download `.sql`, and query history drawer.

- [ ] **Step 3: Build `JsonToolsPage.jsx`**
JSON editor with real-time syntax error highlighting, Beautify, Minify, and history panel.

- [ ] **Step 4: Verify SQL & JSON Tools**
Format a complex MySQL query with JOINs, change dialect to PostgreSQL, test minifier, test JSON validation.

---

## Phase 4: Enterprise Administration & System Services

### Task 13: Members Directory, Cover Customization & Admin Account Controls

**Files:**
- Create: `backend/WorkTracker.Api/Controllers/MembersApiController.cs`
- Create: `frontend/src/pages/MembersPage.jsx`
- Create: `frontend/src/components/members/MemberCard.jsx` (Pure Grid Card Layout)
- Create: `frontend/src/components/members/DoubleConfirmDeleteModal.jsx`
- Create: `frontend/src/pages/ProfilePage.jsx` (Cover banner upload)

**Interfaces:**
- Produces:
  - Pure Grid Card Layout with anti-overflow protection, colored avatars, job title badges, and work hours metrics.
  - Tab "Menunggu Persetujuan" for pending registrations with Approve/Reject actions.
  - Profile cover picture upload (`CoverPictureUrl`) with SVG vector fallback.
  - Double confirmation modal for permanent user deletion (requires typing user's full name + admin password).
  - Admin direct password reset with email notification.

- [ ] **Step 1: Implement `MembersApiController`**
Endpoints: `GET /api/members`, `POST /api/members/{id}/approve`, `POST /api/members/{id}/reject`, `POST /api/members/{id}/reset-password`, `DELETE /api/members/{id}` with password verification.

- [ ] **Step 2: Build `MembersPage.jsx` and `MemberCard.jsx`**
Responsive grid layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`). Tabs for Active Members vs Pending Approval.

- [ ] **Step 3: Build `DoubleConfirmDeleteModal.jsx` and `ProfilePage.jsx`**
Modal enforcing verification of target user's full name and current admin password before executing deletion. Profile page with cover banner image uploader.

- [ ] **Step 4: Verify Member Operations**
Register new user in private tab, observe pending status, approve as admin, check card layout, test cover upload on profile.

---

### Task 14: Master Data, Audit Trail & Executive Dashboard

**Files:**
- Create: `backend/WorkTracker.Api/Controllers/MasterDataApiController.cs`
- Create: `backend/WorkTracker.Api/Controllers/AuditTrailApiController.cs`
- Create: `backend/WorkTracker.Api/Controllers/DashboardApiController.cs`
- Create: `frontend/src/pages/MasterDataPage.jsx`
- Create: `frontend/src/pages/AuditTrailPage.jsx`
- Create: `frontend/src/pages/DashboardPage.jsx`

**Interfaces:**
- Produces:
  - Master Data CRUD: Priorities, Statuses, SDLC Milestones, Categories.
  - Audit Trail: Automatic logging of mutating operations, search, HTTP method breakdown, and CSV export.
  - Dashboard: Metric cards (Total Tasks, In Progress, Done, Overdue, Work Hours Today), productivity charts, recent activities feed.

- [ ] **Step 1: Implement Controllers**
`MasterDataApiController` (CRUD for master tables), `AuditTrailApiController` (paginated audit logs & summary stats), `DashboardApiController` (aggregated metrics).

- [ ] **Step 2: Build `DashboardPage.jsx`**
Executive summary cards, project workload distribution, task status pie/bar charts, and recent activity timeline.

- [ ] **Step 3: Build `MasterDataPage.jsx` & `AuditTrailPage.jsx`**
Tabbed interface for managing SDLC milestones, priorities, and statuses. Audit trail table with filters and CSV export.

- [ ] **Step 4: Verify Dashboard & Audit Logging**
Perform CRUD actions, inspect dashboard metrics updates, and check audit trail logs recording the events.

---

### Task 15: SMTP Email Service, 7 Event Templates & Multi-Instance Sync

**Files:**
- Create: `backend/WorkTracker.Api/Controllers/EmailConfigApiController.cs`
- Create: `backend/WorkTracker.Api/Controllers/SyncApiController.cs`
- Create: `backend/WorkTracker.Infrastructure/Services/EmailService.cs`
- Create: `backend/WorkTracker.Infrastructure/Services/DatabaseSyncService.cs`
- Create: `frontend/src/pages/EmailSettingsPage.jsx`
- Create: `frontend/src/pages/SyncPage.jsx`

**Interfaces:**
- Produces:
  - SMTP configuration stored in `SystemSettings` with live diagnostic test (latency measurement in ms).
  - 7 HTML event templates with dynamic variable interpolation and live preview.
  - Background-safe email dispatcher.
  - Multi-instance sync: REST push/pull with Base64 streaming and ZIP package archive export/import.

- [ ] **Step 1: Implement `EmailService` & `EmailConfigApiController`**
Dynamic MailKit client, placeholder replacement (`{FullName}`, `{TaskTitle}`, etc.), live preview endpoint, and test connection action.

- [ ] **Step 2: Implement `DatabaseSyncService` & `SyncApiController`**
Export ZIP package containing `manifest.json`, `sync_data.sql`, and `uploads/` folder. Import endpoint with transaction rollback on error and Zip-Slip path sanitization.

- [ ] **Step 3: Build `EmailSettingsPage.jsx` and `SyncPage.jsx`**
SMTP configuration form with live test box. Template editor with preview modal. Sync page with Push, Pull, Export ZIP, and Import ZIP buttons.

- [ ] **Step 4: Verify Email & Sync Features**
Test template preview with mockup data, test exporting sync ZIP package, verify ZIP content structure.

---

## Phase 5: Responsive Polish, Onboarding Tour & Verification

### Task 16: Interactive Onboarding Tour & Global Polish

**Files:**
- Create: `frontend/src/components/common/OnboardingTour.jsx`
- Modify: `frontend/src/components/layout/Topbar.jsx`
- Modify: `frontend/src/components/layout/AppLayout.jsx`

**Interfaces:**
- Produces:
  - 6-step interactive spotlight tour guiding users through: Dashboard Metrics, Tasks Grid & Multi-Timer, Work Calendar, Attendance, SQL Beautifier, and Theme/Font Switcher.
  - Accessible on first login or via user profile menu.

- [ ] **Step 1: Build `OnboardingTour.jsx`**
Step-by-step spotlight highlighting target DOM elements with step navigation (Previous, Next, Finish) and option to dismiss.

- [ ] **Step 2: Connect Tour Trigger**
Trigger automatically for new users if `tour_completed != true` in `localStorage`, and add "Mulai Tur Aplikasi" item in profile dropdown.

- [ ] **Step 3: Test Tour Flow**
Run tour in browser, step through all 6 spotlights, finish, and test re-opening from profile menu.

---

### Task 17: End-to-End Responsive Audit & Production Build Verification

**Files:**
- Modify: `frontend/src/styles/index.css`
- Modify: `frontend/vite.config.js`
- Test: Full build and containerization validation

**Interfaces:**
- Produces:
  - Flawless responsiveness across Mobile (375px), Tablet (768px), and Desktop (1440px).
  - Production build bundle test (`npm.cmd run build`).
  - Production Docker Compose verification.

- [ ] **Step 1: Responsive Visual Check**
Inspect all pages (Dashboard, Tasks, Kanban, Timesheet, Attendance, Calendar, Notes, Members, Settings) across small, medium, and large screens. Verify table card transformations, bottom navigation bar, and modal sizing.

- [ ] **Step 2: Frontend Production Build**
Run: `cd frontend; npm.cmd run build`
Expected: Production build succeeds with 0 errors.

- [ ] **Step 3: Backend Release Build**
Run: `dotnet build -c Release backend/WorkTracker.sln`
Expected: Build succeeded with 0 errors.

- [ ] **Step 4: Commit and Final Review**
Commit all source code and documentation to git repository.
