# Dashboard, Tasks & Timesheet Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the missing Executive Dashboard API with team workload and project summaries, upgrade the frontend DashboardPage with dynamic analytics, add Task Excel Export & enriched task details on the Tasks page, and refine team timesheet & attendance capabilities.

**Architecture:** ASP.NET Core 8 Web API with EF Core + Pomelo MySQL in backend, React 18 + Vite + Tailwind CSS + Lucide Icons in frontend.

**Tech Stack:** C# 12, ASP.NET Core 8, ClosedXML 0.104.2, MySQL 8.4, React 18, Axios, Tailwind CSS.

---

### Task 1: Backend Executive Dashboard API (`DashboardApiController.cs`)

**Files:**
- Create: `backend/WorkTracker.Core/DTOs/DashboardDtos.cs`
- Create: `backend/WorkTracker.Api/Controllers/DashboardApiController.cs`

**Deliverables:**
- `GET /api/dashboard/stats`: Returns total tasks, todo, in-progress, in-review, done, overdue, total projects, and work hours logged today.
- `GET /api/dashboard/workload`: Returns task workload distribution per team member (assigned, completed, in-progress, overdue, completion percentage).
- `GET /api/dashboard/projects-overview`: Returns list of 18 projects with tasks count, completed count, and progress %.
- `GET /api/dashboard/recent-activities`: Returns latest updated tasks and upcoming deadlines.

- [ ] **Step 1: Create `DashboardDtos.cs`**
- [ ] **Step 2: Implement `DashboardApiController.cs` with EF Core queries**
- [ ] **Step 3: Build backend and verify API with PowerShell curl**

---

### Task 2: Frontend Executive Dashboard UI (`DashboardPage.jsx`)

**Files:**
- Modify: `frontend/src/pages/DashboardPage.jsx`

**Deliverables:**
- Executive summary metrics cards (Total Tasks, In Progress, Done, Overdue, Projects, Today's Hours).
- Visual status progress bar (Todo / In Progress / Review / Done / Overdue).
- Team Workload Distribution card showing all 7 team members + Admin with progress bars, task counts, and role badges.
- Active Projects Overview card with color badges and completion %.
- Recent Tasks feed with priority pills and direct navigation links.

- [ ] **Step 1: Update `DashboardPage.jsx` to fetch `/api/dashboard/stats`, `/api/dashboard/workload`, and `/api/dashboard/projects-overview`**
- [ ] **Step 2: Add interactive Team Workload & Project Overview sections**
- [ ] **Step 3: Verify frontend rendering without console errors**

---

### Task 3: Task Excel Export & Enhanced Task Drawer

**Files:**
- Modify: `backend/WorkTracker.Api/Controllers/TasksApiController.cs`
- Modify: `frontend/src/pages/TasksPage.jsx`
- Modify: `frontend/src/components/tasks/TaskDetailDrawer.jsx`

**Deliverables:**
- Backend `GET /api/tasks/export-excel` endpoint using ClosedXML with filters (projectId, assignedToUserId, status).
- Frontend "Ekspor Excel" button in Tasks toolbar that triggers `.xlsx` file download.
- Frontend filter dropdowns automatically populated with all 18 projects and 7 team members.
- Task detail drawer displaying full metadata (Modul, Req Code, Bug Type, Dates, Obstacle & Solution).

- [ ] **Step 1: Add `GET /api/tasks/export-excel` in `TasksApiController.cs`**
- [ ] **Step 2: Add Excel export button and dynamic filter dropdowns in `TasksPage.jsx`**
- [ ] **Step 3: Enrich `TaskDetailDrawer.jsx` to display all task properties and sessions**
- [ ] **Step 4: Test Excel export download and task drawer view**

---

### Task 4: Timesheet & Attendance Team Analytics

**Files:**
- Modify: `backend/WorkTracker.Api/Controllers/TimesheetsApiController.cs`
- Modify: `frontend/src/pages/TimesheetPage.jsx`
- Modify: `frontend/src/pages/AttendancePage.jsx`

**Deliverables:**
- Team member filter on Timesheet page for Admin role.
- Summary cards on Timesheet page (Total Hours Logged, Sessions Count, Active Timers).
- Attendance daily check-in with quick status and monthly reconciliation.

- [ ] **Step 1: Verify and enable team timesheet filtering in `TimesheetsApiController.cs`**
- [ ] **Step 2: Add user filter and stats in `TimesheetPage.jsx`**
- [ ] **Step 3: Verify attendance flow and records**

---

### Task 5: End-to-End Verification & Production Build

**Deliverables:**
- Backend build: `dotnet build backend/WorkTracker.sln` -> 0 errors.
- Frontend build: `npm run build` -> 0 errors.
- Database integrity checks.
