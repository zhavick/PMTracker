using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Enums;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/calendar")]
[Authorize]
public class CalendarApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public CalendarApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("events")]
    public async Task<IActionResult> GetEvents(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] string? filter = "all")
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdminOrElevated = User.IsInRole("Admin") || User.IsInRole("System Analyst") || User.IsInRole("Technical Writer");

        // RBAC Scoping: If not admin/elevated, force filter to "mine"
        var effectiveFilter = isAdminOrElevated ? (filter?.ToLower() ?? "all") : "mine";

        var query = _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.AssignedToUser)
            .AsNoTracking();

        if (effectiveFilter == "mine")
        {
            query = query.Where(t => t.AssignedToUserId == currentUserId);
        }

        var startDate = start ?? DateTime.UtcNow.AddMonths(-1);
        var endDate = end ?? DateTime.UtcNow.AddMonths(2);

        // Filter tasks that fall within range (either StartDate, DueDate, or CreatedAt)
        query = query.Where(t => 
            (t.DueDate.HasValue && t.DueDate.Value >= startDate && t.DueDate.Value <= endDate) ||
            (t.StartDate.HasValue && t.StartDate.Value >= startDate && t.StartDate.Value <= endDate) ||
            (!t.DueDate.HasValue && !t.StartDate.HasValue && t.CreatedAt >= startDate && t.CreatedAt <= endDate)
        );

        var tasks = await query.ToListAsync();

        var events = tasks.Select(t =>
        {
            var eventStart = t.StartDate ?? t.DueDate ?? t.CreatedAt;
            var eventEnd = t.DueDate ?? t.StartDate ?? t.CreatedAt;

            var color = t.Project?.Color ?? (t.Status == WorkTaskStatus.Completed ? "#10B981" : "#6366F1");

            return new CalendarEventDto
            {
                Id = $"task_{t.Id}",
                TaskId = t.Id,
                Title = t.Title,
                Start = eventStart,
                End = eventEnd,
                AllDay = true,
                Color = color,
                ProjectName = t.Project?.Name,
                ProjectColor = t.Project?.Color,
                Status = t.Status,
                Priority = t.Priority,
                Progress = t.Progress,
                Milestone = t.Milestone,
                AssigneeName = t.AssignedToUser?.FullName ?? t.AssignedToUser?.UserName ?? "Unassigned",
                AssigneeId = t.AssignedToUserId,
                Obstacle = t.Obstacle,
                Solution = t.Solution
            };
        }).ToList();

        return Ok(ApiResponse<List<CalendarEventDto>>.Success(events));
    }
}
