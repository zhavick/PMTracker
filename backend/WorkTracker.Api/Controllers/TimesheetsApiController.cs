using System.Security.Claims;
using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Api.Extensions;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;
using WorkTracker.Infrastructure.Services;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/timesheets")]
[Authorize]
public class TimesheetsApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ClosedXmlService _excelService;

    public TimesheetsApiController(AppDbContext context, ClosedXmlService excelService)
    {
        _context = context;
        _excelService = excelService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSessions(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int? projectId,
        [FromQuery] int? taskId,
        [FromQuery] string? userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");

        var companyId = await User.GetCompanyIdAsync(_context);

        var query = _context.Sessions
            .Include(s => s.Task)
                .ThenInclude(t => t.Project)
            .Include(s => s.User)
            .AsNoTracking();

        if (companyId.HasValue)
        {
            query = query.Where(s => s.User.CompanyId == companyId.Value || (s.Task != null && s.Task.CompanyId == companyId.Value));
        }

        if (!isAdmin)
        {
            query = query.Where(s => s.UserId == currentUserId);
        }
        else if (!string.IsNullOrEmpty(userId) && userId != "all")
        {
            query = query.Where(s => s.UserId == userId);
        }

        if (startDate.HasValue)
            query = query.Where(s => s.StartTime >= startDate.Value);

        if (endDate.HasValue)
        {
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(s => s.StartTime <= endOfDay);
        }

        if (projectId.HasValue)
            query = query.Where(s => s.Task.ProjectId == projectId.Value);

        if (taskId.HasValue)
            query = query.Where(s => s.TaskId == taskId.Value);

        var sessions = await query.OrderByDescending(s => s.StartTime).ToListAsync();

        var dtoList = sessions.Select(s => new WorkSessionDto
        {
            Id = s.Id,
            TaskId = s.TaskId,
            TaskTitle = s.Task?.Title ?? "Tugas Tidak Dikenal",
            ProjectId = s.Task?.ProjectId,
            ProjectName = s.Task?.Project?.Name,
            ProjectColor = s.Task?.Project?.Color,
            UserId = s.UserId,
            UserName = s.User?.FullName ?? s.User?.UserName,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            Duration = s.Duration,
            Notes = s.Notes
        }).ToList();

        return Ok(ApiResponse<List<WorkSessionDto>>.Success(dtoList));
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveTimers()
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var activeSessions = await _context.Sessions
            .Include(s => s.Task)
                .ThenInclude(t => t.Project)
            .Where(s => s.UserId == currentUserId && s.EndTime == null)
            .OrderByDescending(s => s.StartTime)
            .AsNoTracking()
            .ToListAsync();

        var dtoList = activeSessions.Select(s => new WorkSessionDto
        {
            Id = s.Id,
            TaskId = s.TaskId,
            TaskTitle = s.Task?.Title ?? "Tugas Tidak Dikenal",
            ProjectId = s.Task?.ProjectId,
            ProjectName = s.Task?.Project?.Name,
            ProjectColor = s.Task?.Project?.Color,
            UserId = s.UserId,
            StartTime = s.StartTime,
            EndTime = null,
            Duration = (long)(DateTime.UtcNow - s.StartTime).TotalSeconds,
            Notes = s.Notes
        }).ToList();

        return Ok(ApiResponse<List<WorkSessionDto>>.Success(dtoList));
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartTimer([FromBody] StartTimerDto dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var task = await _context.Tasks.FindAsync(dto.TaskId);
        if (task == null)
            return NotFound(ApiResponse<object>.Fail("Tugas tidak ditemukan."));

        var companyId = await User.GetCompanyIdAsync(_context);
        if (companyId.HasValue && task.CompanyId.HasValue && task.CompanyId.Value != companyId.Value)
            return NotFound(ApiResponse<object>.Fail("Tugas tidak ditemukan."));

        // Check if a timer is already running for THIS task by THIS user
        var existing = await _context.Sessions
            .FirstOrDefaultAsync(s => s.TaskId == dto.TaskId && s.UserId == currentUserId && s.EndTime == null);

        if (existing != null)
        {
            return BadRequest(ApiResponse<object>.Fail("Timer untuk tugas ini sudah sedang aktif berjalan."));
        }

        var session = new WorkSession
        {
            TaskId = dto.TaskId,
            UserId = currentUserId,
            StartTime = DateTime.UtcNow,
            EndTime = null,
            Duration = 0,
            Notes = dto.Notes?.Trim()
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var sessionDto = new WorkSessionDto
        {
            Id = session.Id,
            TaskId = session.TaskId,
            TaskTitle = task.Title,
            UserId = session.UserId,
            StartTime = session.StartTime,
            EndTime = null,
            Duration = 0,
            Notes = session.Notes
        };

        return Ok(ApiResponse<WorkSessionDto>.Success(sessionDto, "Timer tugas berhasil dimulai."));
    }

    [HttpPost("stop/{sessionId}")]
    public async Task<IActionResult> StopTimer(int sessionId, [FromBody] StopTimerDto? dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var session = await _context.Sessions
            .Include(s => s.Task)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            return NotFound(ApiResponse<object>.Fail("Sesi kerja tidak ditemukan."));

        if (session.UserId != currentUserId && !User.IsInRole("Admin"))
            return Forbid();

        if (session.EndTime.HasValue)
            return BadRequest(ApiResponse<object>.Fail("Timer untuk sesi ini sudah dihentikan sebelumnya."));

        session.EndTime = DateTime.UtcNow;
        session.Duration = (long)Math.Max(1, (session.EndTime.Value - session.StartTime).TotalSeconds);
        if (!string.IsNullOrWhiteSpace(dto?.Notes))
        {
            session.Notes = string.IsNullOrWhiteSpace(session.Notes) 
                ? dto.Notes.Trim() 
                : $"{session.Notes} | {dto.Notes.Trim()}";
        }

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { id = session.Id, duration = session.Duration }, "Timer tugas berhasil dihentikan dan dicatat ke timesheet."));
    }

    [HttpPost("stop-by-task/{taskId}")]
    public async Task<IActionResult> StopTimerByTask(int taskId, [FromBody] StopTimerDto? dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.TaskId == taskId && s.UserId == currentUserId && s.EndTime == null);

        if (session == null)
            return NotFound(ApiResponse<object>.Fail("Tidak ada timer aktif untuk tugas ini."));

        session.EndTime = DateTime.UtcNow;
        session.Duration = (long)Math.Max(1, (session.EndTime.Value - session.StartTime).TotalSeconds);
        if (!string.IsNullOrWhiteSpace(dto?.Notes))
        {
            session.Notes = string.IsNullOrWhiteSpace(session.Notes) 
                ? dto.Notes.Trim() 
                : $"{session.Notes} | {dto.Notes.Trim()}";
        }

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { id = session.Id, duration = session.Duration }, "Timer tugas berhasil dihentikan."));
    }

    [HttpPost("manual")]
    public async Task<IActionResult> CreateManualSession([FromBody] ManualSessionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data input tidak valid."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var task = await _context.Tasks.FindAsync(dto.TaskId);
        if (task == null)
            return NotFound(ApiResponse<object>.Fail("Tugas tidak ditemukan."));

        var companyId = await User.GetCompanyIdAsync(_context);
        if (companyId.HasValue && task.CompanyId.HasValue && task.CompanyId.Value != companyId.Value)
            return NotFound(ApiResponse<object>.Fail("Tugas tidak ditemukan."));

        var endTime = dto.SessionDate;
        var startTime = endTime.AddMinutes(-dto.DurationMinutes);
        var durationSeconds = dto.DurationMinutes * 60L;

        var session = new WorkSession
        {
            TaskId = dto.TaskId,
            UserId = currentUserId,
            StartTime = startTime,
            EndTime = endTime,
            Duration = durationSeconds,
            Notes = dto.Notes?.Trim() ?? "Manual entry"
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { id = session.Id }, "Sesi kerja manual berhasil ditambahkan."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSession(int id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var session = await _context.Sessions.FindAsync(id);
        if (session == null)
            return NotFound(ApiResponse<object>.Fail("Sesi kerja tidak ditemukan."));

        if (session.UserId != currentUserId && !User.IsInRole("Admin"))
            return Forbid();

        _context.Sessions.Remove(session);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { id }, "Sesi kerja berhasil dihapus."));
    }

    [HttpGet("export-personal")]
    public async Task<IActionResult> ExportPersonalTimesheet(
        [FromQuery] DateTime? startDate, 
        [FromQuery] DateTime? endDate,
        [FromQuery] string? userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");
        var companyId = await User.GetCompanyIdAsync(_context);
        var targetUserId = isAdmin && !string.IsNullOrEmpty(userId) ? userId : currentUserId;

        var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (user == null || (companyId.HasValue && user.CompanyId != companyId.Value))
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow;
        var endOfDay = end.Date.AddDays(1).AddTicks(-1);

        var sessions = await _context.Sessions
            .Include(s => s.Task)
                .ThenInclude(t => t.Project)
            .Where(s => s.UserId == targetUserId && s.StartTime >= start && s.StartTime <= endOfDay && s.EndTime != null)
            .OrderBy(s => s.StartTime)
            .AsNoTracking()
            .ToListAsync();

        var dtoList = sessions.Select(s => new WorkSessionDto
        {
            Id = s.Id,
            TaskId = s.TaskId,
            TaskTitle = s.Task?.Title ?? "Tugas Tidak Dikenal",
            ProjectId = s.Task?.ProjectId,
            ProjectName = s.Task?.Project?.Name,
            ProjectColor = s.Task?.Project?.Color,
            UserId = s.UserId,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            Duration = s.Duration,
            Notes = s.Notes
        }).ToList();

        var fileBytes = _excelService.GeneratePersonalTimesheetExcel(
            userName: user.FullName ?? user.UserName ?? "Karyawan",
            userEmail: user.Email ?? "-",
            companyName: user.Company?.Name ?? "Organisasi Mandiri",
            startDate: start,
            endDate: end,
            sessions: dtoList
        );

        var fileName = $"Timesheet_{user.UserName}_{start:yyyyMMdd}_{end:yyyyMMdd}.xlsx";
        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("export-elistec")]
    public async Task<IActionResult> ExportElistecTimesheet(
        [FromQuery] string? userId,
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] string? clientName,
        [FromQuery] string? sowNo)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");
        var targetUserId = isAdmin && !string.IsNullOrEmpty(userId) && userId != "all" ? userId : currentUserId;

        var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var now = DateTime.UtcNow;
        var targetYear = year ?? now.Year;
        var targetMonth = month ?? now.Month;
        var startDate = new DateTime(targetYear, targetMonth, 1);
        var daysInMonth = DateTime.DaysInMonth(targetYear, targetMonth);
        var endDate = new DateTime(targetYear, targetMonth, daysInMonth);
        var periodStr = $"{targetMonth:D2}/{targetYear % 100:D2}";
        var resolvedClient = string.IsNullOrWhiteSpace(clientName) ? "Tugu Insurance" : clientName.Trim();
        var resolvedSow = string.IsNullOrWhiteSpace(sowNo) ? "-" : sowNo.Trim();

        // 1. Get user sessions in this month
        var sessions = await _context.Sessions
            .Include(s => s.Task)
                .ThenInclude(t => t.Project)
            .Include(s => s.Task)
                .ThenInclude(t => t.Category)
            .Where(s => s.UserId == targetUserId && s.StartTime >= startDate && s.StartTime <= endDate.AddDays(1).AddTicks(-1))
            .OrderBy(s => s.StartTime)
            .AsNoTracking()
            .ToListAsync();

        // 2. Get user tasks in this project / company for fallback / distribution
        var assignedTasks = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Category)
            .Where(t => t.AssignedToUserId == targetUserId && (t.CompanyId == user.CompanyId || t.CompanyId == null))
            .OrderBy(t => t.ProjectId)
            .ThenBy(t => t.Id)
            .AsNoTracking()
            .ToListAsync();

        if (assignedTasks.Count == 0)
        {
            // Fallback to all tasks if none directly assigned to user
            assignedTasks = await _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.Category)
                .Where(t => t.CompanyId == user.CompanyId || t.CompanyId == null)
                .Take(15)
                .AsNoTracking()
                .ToListAsync();
        }

        var rows = new List<ElistecTimesheetRowDto>();
        int workingDaysCount = 0;
        int taskRotator = 0;

        for (int day = 1; day <= daysInMonth; day++)
        {
            var curDate = new DateTime(targetYear, targetMonth, day);
            bool isWeekend = curDate.DayOfWeek == DayOfWeek.Saturday || curDate.DayOfWeek == DayOfWeek.Sunday;

            if (!isWeekend)
            {
                workingDaysCount++;
            }

            var daySessions = sessions.Where(s => s.StartTime.Date == curDate.Date).ToList();

            if (isWeekend && daySessions.Count == 0)
            {
                var dayName = curDate.DayOfWeek == DayOfWeek.Saturday ? "Sabtu" : "Minggu";
                rows.Add(new ElistecTimesheetRowDto
                {
                    IssueKey = "",
                    IssueSummary = $"Hari Libur Akhir Pekan ({dayName}) - Tidak Ada Pengerjaan Task",
                    Hours = 0,
                    WorkDate = curDate,
                    ClockIn = "-",
                    ClockOut = "-",
                    Username = user.UserName ?? "User",
                    FullName = user.FullName ?? user.UserName ?? "User",
                    Period = periodStr,
                    ProjectName = "-",
                    ActivityType = "-",
                    WorkingPlace = "-",
                    IsWeekendOrHoliday = true
                });
            }
            else if (daySessions.Count > 0)
            {
                foreach (var s in daySessions)
                {
                    double durHours = Math.Max(0.5, Math.Round((double)s.Duration / 3600.0, 2));
                    var clockIn = s.StartTime.ToString("h:mm tt", CultureInfo.InvariantCulture);
                    var clockOut = (s.EndTime ?? s.StartTime.AddHours(durHours)).ToString("h:mm tt", CultureInfo.InvariantCulture);

                    rows.Add(new ElistecTimesheetRowDto
                    {
                        IssueKey = s.Task != null ? $"TSK-{s.TaskId:D4}" : "-",
                        IssueSummary = s.Task?.Title ?? s.Notes ?? "Pengerjaan Tugas",
                        Hours = durHours,
                        WorkDate = curDate,
                        ClockIn = clockIn,
                        ClockOut = clockOut,
                        Username = user.UserName ?? "User",
                        FullName = user.FullName ?? user.UserName ?? "User",
                        Period = periodStr,
                        ProjectName = s.Task?.Project?.Name ?? (assignedTasks.FirstOrDefault()?.Project?.Name ?? "Integrasi Sistem"),
                        ActivityType = s.Task?.Milestone ?? s.Task?.Category?.Name ?? "Technical Documentation",
                        WorkingPlace = "WFO",
                        IsWeekendOrHoliday = false
                    });
                }
            }
            else
            {
                // Working day without explicit timer session: populate from user tasks
                if (assignedTasks.Count > 0)
                {
                    int tasksForToday = Math.Min(4, Math.Max(1, assignedTasks.Count));
                    double hoursPerTask = Math.Round(8.0 / tasksForToday, 2);

                    for (int tIdx = 0; tIdx < tasksForToday; tIdx++)
                    {
                        var task = assignedTasks[(taskRotator + tIdx) % assignedTasks.Count];
                        var summarySuffix = (taskRotator > 0 && (taskRotator + tIdx) >= assignedTasks.Count) ? " - Update" : "";

                        rows.Add(new ElistecTimesheetRowDto
                        {
                            IssueKey = $"TSK-{task.Id:D4}",
                            IssueSummary = $"{task.Title}{summarySuffix}",
                            Hours = (tIdx == tasksForToday - 1) ? (8.0 - (hoursPerTask * (tasksForToday - 1))) : hoursPerTask,
                            WorkDate = curDate,
                            ClockIn = "8:00 AM",
                            ClockOut = "5:00 PM",
                            Username = user.UserName ?? "User",
                            FullName = user.FullName ?? user.UserName ?? "User",
                            Period = periodStr,
                            ProjectName = task.Project?.Name ?? "Integrasi TCES TICS",
                            ActivityType = task.Milestone ?? task.Category?.Name ?? "Analysis & Requirement",
                            WorkingPlace = "WFO",
                            IsWeekendOrHoliday = false
                        });
                    }

                    taskRotator = (taskRotator + 2) % assignedTasks.Count;
                }
                else
                {
                    rows.Add(new ElistecTimesheetRowDto
                    {
                        IssueKey = "TSK-0001",
                        IssueSummary = "Aktivitas Proyek & Dokumentasi Teknis",
                        Hours = 8,
                        WorkDate = curDate,
                        ClockIn = "8:00 AM",
                        ClockOut = "5:00 PM",
                        Username = user.UserName ?? "User",
                        FullName = user.FullName ?? user.UserName ?? "User",
                        Period = periodStr,
                        ProjectName = "Project Tracker",
                        ActivityType = "Technical Documentation",
                        WorkingPlace = "WFO",
                        IsWeekendOrHoliday = false
                    });
                }
            }
        }

        var fileBytes = _excelService.GenerateElistecTimesheetExcel(
            memberName: user.UserName ?? "User",
            memberFullName: user.FullName ?? user.UserName ?? "Karyawan",
            clientName: resolvedClient,
            sowNo: resolvedSow,
            durationDays: workingDaysCount,
            rows: rows
        );

        var safeUserName = (user.FullName ?? user.UserName ?? "Member").Replace(" ", "_");
        var fileName = $"Timesheet_Elistec_{targetYear}_{targetMonth:D2}_{safeUserName}.xlsx";
        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
