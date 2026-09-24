using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Core.Enums;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/gamification")]
[Authorize]
public class GamificationApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public GamificationApiController(AppDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // ── Badges Master ──────────────────────────────────────────────────────────

    [HttpGet("badges")]
    public async Task<IActionResult> GetAllBadges()
    {
        var badges = await _context.MasterBadges
            .OrderBy(b => b.OrderIndex)
            .ThenBy(b => b.Rarity)
            .ToListAsync();
        return Ok(ApiResponse<List<MasterBadge>>.Success(badges));
    }

    [HttpPost("badges")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateBadge([FromBody] MasterBadge model)
    {
        model.CreatedAt = DateTime.UtcNow;
        _context.MasterBadges.Add(model);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterBadge>.Success(model, "Badge berhasil dibuat."));
    }

    [HttpPut("badges/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateBadge(int id, [FromBody] MasterBadge model)
    {
        var existing = await _context.MasterBadges.FindAsync(id);
        if (existing == null) return NotFound(ApiResponse<object>.Fail("Badge tidak ditemukan."));

        existing.Code = model.Code;
        existing.Name = model.Name;
        existing.Description = model.Description;
        existing.Category = model.Category;
        existing.Icon = model.Icon;
        existing.Color = model.Color;
        existing.Points = model.Points;
        existing.Rarity = model.Rarity;
        existing.TriggerType = model.TriggerType;
        existing.TriggerThreshold = model.TriggerThreshold;
        existing.IsActive = model.IsActive;
        existing.OrderIndex = model.OrderIndex;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterBadge>.Success(existing, "Badge berhasil diperbarui."));
    }

    [HttpDelete("badges/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBadge(int id)
    {
        var existing = await _context.MasterBadges.FindAsync(id);
        if (existing == null) return NotFound(ApiResponse<object>.Fail("Badge tidak ditemukan."));
        _context.MasterBadges.Remove(existing);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(null, "Badge berhasil dihapus."));
    }

    // ── User Badges ──────────────────────────────────────────────────────────

    [HttpGet("my-badges")]
    public async Task<IActionResult> GetMyBadges()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var badges = await _context.UserBadges
            .Include(ub => ub.Badge)
            .Where(ub => ub.UserId == userId)
            .OrderByDescending(ub => ub.UnlockedAt)
            .ToListAsync();
        return Ok(ApiResponse<List<UserBadge>>.Success(badges));
    }

    [HttpGet("user-badges/{userId}")]
    public async Task<IActionResult> GetUserBadges(string userId)
    {
        var badges = await _context.UserBadges
            .Include(ub => ub.Badge)
            .Where(ub => ub.UserId == userId)
            .OrderByDescending(ub => ub.UnlockedAt)
            .ToListAsync();
        return Ok(ApiResponse<List<UserBadge>>.Success(badges));
    }

    [HttpPost("award-badge")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AwardBadge([FromBody] AwardBadgeRequest req)
    {
        var badge = await _context.MasterBadges.FindAsync(req.BadgeId);
        if (badge == null) return NotFound(ApiResponse<object>.Fail("Badge tidak ditemukan."));

        var user = await _userManager.FindByIdAsync(req.UserId);
        if (user == null) return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        // Check if already awarded
        var exists = await _context.UserBadges.AnyAsync(ub => ub.UserId == req.UserId && ub.BadgeId == req.BadgeId);
        if (exists) return BadRequest(ApiResponse<object>.Fail("Pengguna sudah memiliki badge ini."));

        var adminName = User.FindFirstValue("FullName") ?? User.FindFirstValue(ClaimTypes.Name) ?? "Administrator";
        var userBadge = new UserBadge
        {
            UserId = req.UserId,
            BadgeId = req.BadgeId,
            UnlockedAt = DateTime.UtcNow,
            AwardedBy = adminName
        };
        _context.UserBadges.Add(userBadge);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<UserBadge>.Success(userBadge, $"Badge '{badge.Name}' berhasil diberikan kepada {user.FullName}."));
    }

    [HttpDelete("revoke-badge/{userBadgeId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RevokeBadge(int userBadgeId)
    {
        var ub = await _context.UserBadges.FindAsync(userBadgeId);
        if (ub == null) return NotFound(ApiResponse<object>.Fail("User badge tidak ditemukan."));
        _context.UserBadges.Remove(ub);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(null, "Badge berhasil dicabut."));
    }

    // ── Auto Badge Check Engine ───────────────────────────────────────────────

    [HttpPost("check-badges")]
    public async Task<IActionResult> CheckAndAwardBadges()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var newlyAwarded = await ProcessBadgesForUser(userId);
        return Ok(ApiResponse<object>.Success(new { newBadges = newlyAwarded }, 
            newlyAwarded.Count > 0 ? $"Selamat! Anda mendapatkan {newlyAwarded.Count} badge baru!" : "Tidak ada badge baru."));
    }

    [HttpPost("check-badges-all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CheckBadgesForAllUsers()
    {
        var users = await _userManager.Users.ToListAsync();
        var totalAwarded = 0;
        foreach (var user in users)
        {
            var awarded = await ProcessBadgesForUser(user.Id);
            totalAwarded += awarded.Count;
        }
        return Ok(ApiResponse<object>.Success(new { totalAwarded }, $"Proses selesai. {totalAwarded} badge baru diberikan."));
    }

    // ── Leaderboard ──────────────────────────────────────────────────────────

    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard(
        [FromQuery] int? year,
        [FromQuery] int? month)
    {
        var now = DateTime.UtcNow;
        var targetYear = year ?? now.Year;
        var targetMonth = month ?? now.Month;

        var startDate = new DateTime(targetYear, targetMonth, 1);
        var endDate = startDate.AddMonths(1);

        // Monthly task completions per user
        var monthlyTasks = await _context.Tasks
            .Where(t => t.Status == WorkTaskStatus.Done
                && t.UpdatedAt >= startDate && t.UpdatedAt < endDate
                && t.AssignedToUserId != null)
            .GroupBy(t => t.AssignedToUserId!)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToListAsync();

        // Total ever-done tasks per user
        var totalTasks = await _context.Tasks
            .Where(t => t.Status == WorkTaskStatus.Done && t.AssignedToUserId != null)
            .GroupBy(t => t.AssignedToUserId!)
            .Select(g => new { UserId = g.Key, Total = g.Count() })
            .ToListAsync();

        // Total timesheet hours per user (this month)
        var monthlyHours = await _context.Sessions
            .Where(s => s.StartTime >= startDate && s.StartTime < endDate
                && s.EndTime.HasValue && s.UserId != null)
            .GroupBy(s => s.UserId!)
            .Select(g => new { UserId = g.Key, Hours = g.Sum(s => (double)(double)s.Duration / 3600.0) })
            .ToListAsync();

        // Badge points per user
        var badgePoints = await _context.UserBadges
            .Include(ub => ub.Badge)
            .GroupBy(ub => ub.UserId)
            .Select(g => new { UserId = g.Key, Points = g.Sum(ub => ub.Badge != null ? ub.Badge.Points : 0) })
            .ToListAsync();

        // User badge count
        var userBadgeCounts = await _context.UserBadges
            .GroupBy(ub => ub.UserId)
            .Select(g => new { UserId = g.Key, BadgeCount = g.Count() })
            .ToListAsync();

        // Attendance streaks this month
        var monthlyAttendance = await _context.Attendances
            .Where(a => a.Date >= startDate && a.Date < endDate && a.UserId != null)
            .GroupBy(a => a.UserId!)
            .Select(g => new { UserId = g.Key, Days = g.Count() })
            .ToListAsync();

        // All participating users
        var allUserIds = monthlyTasks.Select(m => m.UserId)
            .Union(monthlyHours.Select(h => h.UserId))
            .Distinct()
            .ToList();

        if (!allUserIds.Any())
            allUserIds = await _userManager.Users.Select(u => u.Id).ToListAsync();

        var users = await _userManager.Users
            .Where(u => allUserIds.Contains(u.Id))
            .ToListAsync();

        var leaderboard = users.Select(u =>
        {
            var monthTask = monthlyTasks.FirstOrDefault(m => m.UserId == u.Id);
            var totalTask = totalTasks.FirstOrDefault(m => m.UserId == u.Id);
            var monthHr = monthlyHours.FirstOrDefault(h => h.UserId == u.Id);
            var pts = badgePoints.FirstOrDefault(b => b.UserId == u.Id);
            var badges = userBadgeCounts.FirstOrDefault(b => b.UserId == u.Id);
            var att = monthlyAttendance.FirstOrDefault(a => a.UserId == u.Id);

            var monthlyCount = monthTask?.Count ?? 0;
            var totalCount = totalTask?.Total ?? 0;
            var hours = monthHr?.Hours ?? 0.0;
            var points = pts?.Points ?? 0;
            var badgeCount = badges?.BadgeCount ?? 0;
            var attendanceDays = att?.Days ?? 0;

            // Score formula: tasks*10 + hours*3 + badges*5 + attendance*2
            var score = monthlyCount * 10 + (int)(hours * 3) + badgeCount * 5 + attendanceDays * 2;

            return new
            {
                userId = u.Id,
                fullName = u.FullName ?? u.Email,
                email = u.Email,
                avatarColor = u.AvatarColor,
                jobTitle = u.JobTitle,
                monthlyTasksDone = monthlyCount,
                totalTasksDone = totalCount,
                monthlyHours = Math.Round(hours, 1),
                badgePoints = points,
                badgeCount,
                attendanceDays,
                score
            };
        })
        .OrderByDescending(u => u.score)
        .ThenByDescending(u => u.monthlyTasksDone)
        .Select((u, idx) => new { rank = idx + 1, u.userId, u.fullName, u.email, u.avatarColor, u.jobTitle, u.monthlyTasksDone, u.totalTasksDone, u.monthlyHours, u.badgePoints, u.badgeCount, u.attendanceDays, u.score })
        .ToList();

        return Ok(ApiResponse<object>.Success(new
        {
            year = targetYear,
            month = targetMonth,
            leaderboard
        }));
    }

    // ── Stats for current user ────────────────────────────────────────────────

    [HttpGet("my-stats")]
    public async Task<IActionResult> GetMyStats()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1);

        var totalDone = await _context.Tasks.CountAsync(t => t.AssignedToUserId == userId && t.Status == WorkTaskStatus.Done);
        var monthlyDone = await _context.Tasks.CountAsync(t => t.AssignedToUserId == userId && t.Status == WorkTaskStatus.Done && t.UpdatedAt >= startOfMonth && t.UpdatedAt < endOfMonth);
        var totalHours = await _context.Sessions
            .Where(s => s.UserId == userId && s.EndTime.HasValue)
            .SumAsync(s => (double)(double)s.Duration / 3600.0);
        var monthlyHours = await _context.Sessions
            .Where(s => s.UserId == userId && s.EndTime.HasValue && s.StartTime >= startOfMonth && s.StartTime < endOfMonth)
            .SumAsync(s => (double)(double)s.Duration / 3600.0);

        // Overtime sessions > 8h per day
        var overtimeDays = await _context.Sessions
            .Where(s => s.UserId == userId && s.EndTime.HasValue && s.Duration > 28800)
            .CountAsync();

        var myBadges = await _context.UserBadges
            .Include(ub => ub.Badge)
            .Where(ub => ub.UserId == userId)
            .OrderByDescending(ub => ub.UnlockedAt)
            .ToListAsync();

        var totalPoints = myBadges.Sum(ub => ub.Badge?.Points ?? 0);

        return Ok(ApiResponse<object>.Success(new
        {
            totalTasksDone = totalDone,
            monthlyTasksDone = monthlyDone,
            totalHours = Math.Round(totalHours, 1),
            monthlyHours = Math.Round(monthlyHours, 1),
            overtimeDays,
            badgeCount = myBadges.Count,
            totalPoints,
            badges = myBadges
        }));
    }

    // ── Private badge processing ──────────────────────────────────────────────

    private async Task<List<MasterBadge>> ProcessBadgesForUser(string userId)
    {
        var awarded = new List<MasterBadge>();
        var activeBadges = await _context.MasterBadges.Where(b => b.IsActive && b.TriggerType != BadgeTriggerType.Manual).ToListAsync();
        var existingBadgeIds = await _context.UserBadges.Where(ub => ub.UserId == userId).Select(ub => ub.BadgeId).ToListAsync();

        var totalDone = await _context.Tasks.CountAsync(t => t.AssignedToUserId == userId && t.Status == WorkTaskStatus.Done);
        var totalHours = await _context.Sessions.Where(s => s.UserId == userId && s.EndTime.HasValue).SumAsync(s => (double)(double)s.Duration / 3600.0);
        var totalNotes = await _context.Notes.CountAsync(n => n.AuthorUserId == userId);
        var overtimeDays = await _context.Sessions.Where(s => s.UserId == userId && s.EndTime.HasValue && s.Duration > 28800).CountAsync();

        // Monthly top - check if user is #1 this month
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var monthlyTopUserId = await _context.Tasks
            .Where(t => t.Status == WorkTaskStatus.Done && t.UpdatedAt >= startOfMonth && t.AssignedToUserId != null)
            .GroupBy(t => t.AssignedToUserId!)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefaultAsync();

        foreach (var badge in activeBadges)
        {
            if (existingBadgeIds.Contains(badge.Id)) continue;

            bool qualifies = badge.TriggerType switch
            {
                BadgeTriggerType.Auto_DoneTasks => totalDone >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_WorkHours => totalHours >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_TasksAbove100 => totalDone >= 100,
                BadgeTriggerType.Auto_OvertimeHours => overtimeDays >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_NotesCreated => totalNotes >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_MonthlyTopTasks => monthlyTopUserId == userId,
                _ => false
            };

            if (qualifies)
            {
                var userBadge = new UserBadge
                {
                    UserId = userId,
                    BadgeId = badge.Id,
                    UnlockedAt = DateTime.UtcNow,
                    AwardedBy = "System (Auto)"
                };
                _context.UserBadges.Add(userBadge);
                awarded.Add(badge);
            }
        }

        if (awarded.Any())
            await _context.SaveChangesAsync();

        return awarded;
    }
}

public class AwardBadgeRequest
{
    public string UserId { get; set; } = string.Empty;
    public int BadgeId { get; set; }
}
