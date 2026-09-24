using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Api.Extensions;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Core.Enums;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public DashboardApiController(AppDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] bool myTasksOnly = false, [FromQuery] bool excludeAdmin = true)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");
        var companyId = await User.GetCompanyIdAsync(_context);

        var adminUserIds = await _context.UserRoles
            .Join(_context.Roles.Where(r => r.Name == "Admin"), ur => ur.RoleId, r => r.Id, (ur, r) => ur.UserId)
            .ToListAsync();
        var adminEmails = new[] { "admin@trackerkerja.com" };
        var adminUsersByEmail = await _context.Users.Where(u => adminEmails.Contains(u.Email)).Select(u => u.Id).ToListAsync();
        var allAdminIds = adminUserIds.Union(adminUsersByEmail).Distinct().ToList();

        var taskQuery = _context.Tasks.AsNoTracking();
        if (companyId.HasValue)
        {
            taskQuery = taskQuery.Where(t => t.CompanyId == companyId.Value || (t.CompanyId == null && t.Project.CompanyId == companyId.Value));
        }

        if (myTasksOnly || (!isAdmin && !string.IsNullOrEmpty(currentUserId)))
        {
            taskQuery = taskQuery.Where(t => t.AssignedToUserId == currentUserId);
        }
        else if (excludeAdmin && allAdminIds.Any())
        {
            taskQuery = taskQuery.Where(t => t.AssignedToUserId == null || !allAdminIds.Contains(t.AssignedToUserId));
        }

        var now = DateTime.UtcNow;
        var todayStart = DateTime.UtcNow.Date;

        var allTasks = await taskQuery
            .Select(t => new { t.Id, t.Status, t.Progress, t.DueDate })
            .ToListAsync();

        var totalTasks = allTasks.Count;
        var todoTasks = allTasks.Count(t => t.Status == WorkTaskStatus.Todo);
        var inProgressTasks = allTasks.Count(t => t.Status == WorkTaskStatus.InProgress);
        var inReviewTasks = allTasks.Count(t => t.Status == WorkTaskStatus.InReview);
        var doneTasks = allTasks.Count(t => t.Status == WorkTaskStatus.Done || t.Status == WorkTaskStatus.Completed);
        var overdueTasks = allTasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != WorkTaskStatus.Done && t.Status != WorkTaskStatus.Completed);

        var projectQuery = _context.Projects.AsQueryable();
        if (companyId.HasValue)
        {
            projectQuery = projectQuery.Where(p => p.CompanyId == companyId.Value);
        }
        var totalProjects = await projectQuery.CountAsync();

        var userQuery = _context.Users.Where(u => u.IsApproved);
        if (companyId.HasValue)
        {
            userQuery = userQuery.Where(u => u.CompanyId == companyId.Value);
        }
        if (excludeAdmin && allAdminIds.Any())
        {
            userQuery = userQuery.Where(u => !allAdminIds.Contains(u.Id));
        }
        var totalUsers = await userQuery.CountAsync();

        // Calculate hours logged today from WorkSessions
        var todaySessionsQuery = _context.Sessions
            .Where(s => s.StartTime >= todayStart);

        if (companyId.HasValue)
        {
            todaySessionsQuery = todaySessionsQuery.Where(s => s.User.CompanyId == companyId.Value || (s.Task != null && s.Task.CompanyId == companyId.Value));
        }
        
        if (myTasksOnly || (!isAdmin && !string.IsNullOrEmpty(currentUserId)))
        {
            todaySessionsQuery = todaySessionsQuery.Where(s => s.UserId == currentUserId);
        }
        else if (excludeAdmin && allAdminIds.Any())
        {
            todaySessionsQuery = todaySessionsQuery.Where(s => s.UserId == null || !allAdminIds.Contains(s.UserId));
        }

        var todaySeconds = await todaySessionsQuery.SumAsync(s => (double)s.Duration);
        var todayWorkHours = Math.Round(todaySeconds / 3600.0, 1);

        // All time work hours
        var totalSessionsQuery = _context.Sessions.AsQueryable();
        if (companyId.HasValue)
        {
            totalSessionsQuery = totalSessionsQuery.Where(s => s.User.CompanyId == companyId.Value || (s.Task != null && s.Task.CompanyId == companyId.Value));
        }
        if (excludeAdmin && allAdminIds.Any())
        {
            totalSessionsQuery = totalSessionsQuery.Where(s => s.UserId == null || !allAdminIds.Contains(s.UserId));
        }
        var totalSecondsAllTime = await totalSessionsQuery.SumAsync(s => (double)s.Duration);
        var totalWorkHoursAllTime = Math.Round(totalSecondsAllTime / 3600.0, 1);

        var completionRate = totalTasks > 0 ? Math.Round((double)doneTasks / totalTasks * 100.0, 1) : 0.0;

        var stats = new DashboardStatsDto
        {
            TotalTasks = totalTasks,
            TodoTasks = todoTasks,
            InProgressTasks = inProgressTasks,
            InReviewTasks = inReviewTasks,
            DoneTasks = doneTasks,
            OverdueTasks = overdueTasks,
            TotalProjects = totalProjects,
            TotalUsers = totalUsers,
            TodayWorkHours = todayWorkHours,
            TotalWorkHoursAllTime = totalWorkHoursAllTime,
            OverallCompletionRate = completionRate
        };

        return Ok(ApiResponse<DashboardStatsDto>.Success(stats));
    }

    [HttpGet("workload")]
    public async Task<IActionResult> GetTeamWorkload([FromQuery] bool excludeAdmin = true)
    {
        var companyId = await User.GetCompanyIdAsync(_context);
        var adminUserIds = await _context.UserRoles
            .Join(_context.Roles.Where(r => r.Name == "Admin"), ur => ur.RoleId, r => r.Id, (ur, r) => ur.UserId)
            .ToListAsync();
        var adminEmails = new[] { "admin@trackerkerja.com" };
        var adminUsersByEmail = await _context.Users.Where(u => adminEmails.Contains(u.Email)).Select(u => u.Id).ToListAsync();
        var allAdminIds = adminUserIds.Union(adminUsersByEmail).Distinct().ToList();

        var usersQuery = _context.Users.Where(u => u.IsApproved);
        if (companyId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.CompanyId == companyId.Value);
        }
        if (excludeAdmin && allAdminIds.Any())
        {
            usersQuery = usersQuery.Where(u => !allAdminIds.Contains(u.Id));
        }

        var users = await usersQuery
            .OrderBy(u => u.FullName)
            .ToListAsync();

        var taskQuery = _context.Tasks.AsNoTracking();
        if (companyId.HasValue)
        {
            taskQuery = taskQuery.Where(t => t.CompanyId == companyId.Value || (t.CompanyId == null && t.Project.CompanyId == companyId.Value));
        }
        var tasks = await taskQuery
            .Select(t => new { t.Id, t.AssignedToUserId, t.Status, t.DueDate })
            .ToListAsync();

        var sessionQuery = _context.Sessions
            .AsNoTracking()
            .Where(s => s.UserId != null);
        if (companyId.HasValue)
        {
            sessionQuery = sessionQuery.Where(s => s.User.CompanyId == companyId.Value);
        }

        var sessions = await sessionQuery
            .GroupBy(s => s.UserId!)
            .Select(g => new { UserId = g.Key, TotalSeconds = g.Sum(s => s.Duration) })
            .ToDictionaryAsync(g => g.UserId, g => g.TotalSeconds);

        var now = DateTime.UtcNow;
        var workloadList = new List<TeamMemberWorkloadDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var roleName = roles.FirstOrDefault() ?? "User";

            if (excludeAdmin && (roleName == "Admin" || user.Email == "admin@trackerkerja.com"))
                continue;

            var userTasks = tasks.Where(t => t.AssignedToUserId == user.Id).ToList();
            var total = userTasks.Count;
            var done = userTasks.Count(t => t.Status == WorkTaskStatus.Done || t.Status == WorkTaskStatus.Completed);
            var inProg = userTasks.Count(t => t.Status == WorkTaskStatus.InProgress);
            var inRev = userTasks.Count(t => t.Status == WorkTaskStatus.InReview);
            var todo = userTasks.Count(t => t.Status == WorkTaskStatus.Todo);
            var overdue = userTasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != WorkTaskStatus.Done && t.Status != WorkTaskStatus.Completed);

            var totalSec = sessions.TryGetValue(user.Id, out var sec) ? sec : 0;
            var completion = total > 0 ? (int)Math.Round((double)done / total * 100.0) : 0;

            workloadList.Add(new TeamMemberWorkloadDto
            {
                UserId = user.Id,
                FullName = user.FullName ?? user.UserName ?? "User",
                Email = user.Email ?? string.Empty,
                JobTitle = user.JobTitle ?? "Team Member",
                Role = roleName,
                AvatarColor = user.AvatarColor ?? "#3B82F6",
                TotalTasks = total,
                DoneTasks = done,
                InProgressTasks = inProg,
                TodoTasks = todo,
                OverdueTasks = overdue,
                CompletionPercentage = completion,
                TotalHoursSpent = Math.Round(totalSec / 3600.0, 1)
            });
        }

        // Sort descending by total tasks
        workloadList = workloadList.OrderByDescending(w => w.TotalTasks).ToList();

        return Ok(ApiResponse<List<TeamMemberWorkloadDto>>.Success(workloadList));
    }

    [HttpGet("projects-overview")]
    public async Task<IActionResult> GetProjectsOverview()
    {
        var companyId = await User.GetCompanyIdAsync(_context);
        var projectQuery = _context.Projects
            .Include(p => p.Tasks)
            .AsNoTracking();

        if (companyId.HasValue)
        {
            projectQuery = projectQuery.Where(p => p.CompanyId == companyId.Value);
        }

        var projects = await projectQuery.ToListAsync();

        var list = projects.Select(p =>
        {
            var total = p.Tasks.Count;
            var completed = p.Tasks.Count(t => t.Status == WorkTaskStatus.Done || t.Status == WorkTaskStatus.Completed);
            var inProg = p.Tasks.Count(t => t.Status == WorkTaskStatus.InProgress || t.Status == WorkTaskStatus.InReview);
            var progress = total > 0 ? (int)Math.Round(p.Tasks.Average(t => (double)t.Progress)) : 0;

            return new ProjectOverviewDto
            {
                ProjectId = p.Id,
                Name = p.Name,
                Color = p.Color ?? "#3B82F6",
                TotalTasks = total,
                CompletedTasks = completed,
                InProgressTasks = inProg,
                ProgressPercentage = progress
            };
        })
        .OrderByDescending(p => p.TotalTasks)
        .ToList();

        return Ok(ApiResponse<List<ProjectOverviewDto>>.Success(list));
    }

    [HttpGet("recent-activities")]
    public async Task<IActionResult> GetRecentActivities()
    {
        var companyId = await User.GetCompanyIdAsync(_context);
        var taskQuery = _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.AssignedToUser)
            .AsNoTracking();

        if (companyId.HasValue)
        {
            taskQuery = taskQuery.Where(t => t.CompanyId == companyId.Value || (t.CompanyId == null && t.Project.CompanyId == companyId.Value));
        }

        var recentTasks = await taskQuery
            .OrderByDescending(t => t.UpdatedAt)
            .Take(8)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Status,
                t.Priority,
                t.Progress,
                t.Milestone,
                t.DueDate,
                t.UpdatedAt,
                ProjectId = t.ProjectId,
                ProjectName = t.Project != null ? t.Project.Name : null,
                ProjectColor = t.Project != null ? t.Project.Color : null,
                AssigneeName = t.AssignedToUser != null ? t.AssignedToUser.FullName : null,
                AssigneeAvatar = t.AssignedToUser != null ? t.AssignedToUser.AvatarColor : null
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Success(recentTasks));
    }
}
