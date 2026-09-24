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
    private const decimal POINT_TO_RUPIAH_RATE = 100m; // 1 Point = 100 Rupiah

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
            newlyAwarded.Count > 0 ? $"Selamat! Anda mendapatkan {newlyAwarded.Count} badge baru!" : "Tidak ada badge baru. Terus tingkatkan performamu!"));
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
        return Ok(ApiResponse<object>.Success(new { totalAwarded }, $"Proses evaluasi badge selesai. {totalAwarded} badge baru berhasil diberikan."));
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
            .Select(g => new { UserId = g.Key, Hours = g.Sum(s => (double)s.Duration / 3600.0) })
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
            .SumAsync(s => (double)s.Duration / 3600.0);
        var monthlyHours = await _context.Sessions
            .Where(s => s.UserId == userId && s.EndTime.HasValue && s.StartTime >= startOfMonth && s.StartTime < endOfMonth)
            .SumAsync(s => (double)s.Duration / 3600.0);

        // Overtime sessions > 8h per day (duration in seconds > 28800)
        var overtimeDays = await _context.Sessions
            .Where(s => s.UserId == userId && s.EndTime.HasValue && s.Duration > 28800)
            .CountAsync();

        var myBadges = await _context.UserBadges
            .Include(ub => ub.Badge)
            .Where(ub => ub.UserId == userId)
            .OrderByDescending(ub => ub.UnlockedAt)
            .ToListAsync();

        var totalPointsEarned = myBadges.Sum(ub => ub.Badge?.Points ?? 0);

        // Calculate points claimed (pending, approved, paid)
        var claims = await _context.RewardClaims
            .Where(r => r.UserId == userId && r.Status != ClaimStatus.Rejected)
            .ToListAsync();

        var pointsClaimedTotal = claims.Sum(r => r.PointsClaimed);
        var pointsPaid = claims.Where(r => r.Status == ClaimStatus.PaidOrTreated).Sum(r => r.PointsClaimed);
        var availablePoints = Math.Max(0, totalPointsEarned - pointsClaimedTotal);
        var availableRupiah = availablePoints * POINT_TO_RUPIAH_RATE;

        return Ok(ApiResponse<object>.Success(new
        {
            totalTasksDone = totalDone,
            monthlyTasksDone = monthlyDone,
            totalHours = Math.Round(totalHours, 1),
            monthlyHours = Math.Round(monthlyHours, 1),
            overtimeDays,
            badgeCount = myBadges.Count,
            totalPoints = totalPointsEarned,
            totalPointsEarned,
            pointsClaimed = pointsClaimedTotal,
            pointsPaid,
            availablePoints,
            pointToRupiahRate = POINT_TO_RUPIAH_RATE,
            availableRupiah,
            totalRupiahEquivalent = totalPointsEarned * POINT_TO_RUPIAH_RATE,
            badges = myBadges
        }));
    }

    // ── Reward Claiming System (1 Point = 100 Rupiah) ──────────────────────────

    [HttpPost("claim-reward")]
    public async Task<IActionResult> ClaimReward([FromBody] ClaimRewardRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (req.Points <= 0)
            return BadRequest(ApiResponse<object>.Fail("Jumlah poin yang diklaim harus lebih besar dari 0."));

        // Calculate current available points
        var totalPoints = await _context.UserBadges
            .Where(ub => ub.UserId == userId)
            .SumAsync(ub => ub.Badge != null ? ub.Badge.Points : 0);

        var activeClaimedPoints = await _context.RewardClaims
            .Where(r => r.UserId == userId && r.Status != ClaimStatus.Rejected)
            .SumAsync(r => r.PointsClaimed);

        var availablePoints = totalPoints - activeClaimedPoints;
        if (req.Points > availablePoints)
        {
            return BadRequest(ApiResponse<object>.Fail($"Poin tidak mencukupi. Poin Anda yang tersedia untuk diklaim adalah {availablePoints} poin (Rp {(availablePoints * POINT_TO_RUPIAH_RATE):N0})."));
        }

        var rupiahAmount = req.Points * POINT_TO_RUPIAH_RATE;

        var claim = new RewardClaim
        {
            UserId = userId,
            PointsClaimed = req.Points,
            RupiahAmount = rupiahAmount,
            RewardType = req.RewardType,
            AccountOrContactInfo = req.AccountOrContactInfo?.Trim() ?? string.Empty,
            UserNotes = req.UserNotes?.Trim(),
            Status = ClaimStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.RewardClaims.Add(claim);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<RewardClaim>.Success(claim, $"Permohonan klaim {req.Points} Poin (Rp {rupiahAmount:N0}) berhasil diajukan! Administrator akan segera memproses hadiah Anda."));
    }

    [HttpGet("claims")]
    public async Task<IActionResult> GetClaims([FromQuery] ClaimStatus? status, [FromQuery] string? userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var query = _context.RewardClaims
            .Include(r => r.User)
            .Include(r => r.ProcessedByUser)
            .AsQueryable();

        if (!isAdmin)
        {
            query = query.Where(r => r.UserId == currentUserId);
        }
        else if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(r => r.UserId == userId);
        }

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        var claims = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.UserId,
                UserName = r.User != null ? (r.User.FullName ?? r.User.UserName) : "Pengguna",
                UserEmail = r.User != null ? r.User.Email : "",
                UserAvatarColor = r.User != null ? r.User.AvatarColor : "#6366F1",
                r.PointsClaimed,
                r.RupiahAmount,
                RewardType = r.RewardType.ToString(),
                r.AccountOrContactInfo,
                r.UserNotes,
                Status = r.Status.ToString(),
                r.AdminNotes,
                r.ProcessedByUserId,
                ProcessedByName = r.ProcessedByUser != null ? (r.ProcessedByUser.FullName ?? r.ProcessedByUser.UserName) : null,
                r.ProcessedAt,
                r.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Success(claims));
    }

    [HttpPut("claims/{id}/process")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ProcessClaim(int id, [FromBody] ProcessClaimRequest req)
    {
        var claim = await _context.RewardClaims
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (claim == null)
            return NotFound(ApiResponse<object>.Fail("Data klaim tidak ditemukan."));

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        claim.Status = req.Status;
        claim.AdminNotes = req.AdminNotes?.Trim();
        claim.ProcessedByUserId = adminId;
        claim.ProcessedAt = DateTime.UtcNow;
        claim.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var statusLabel = req.Status switch
        {
            ClaimStatus.Approved => "Disetujui",
            ClaimStatus.PaidOrTreated => "Telah Ditransfer / Selesai Ditraktir",
            ClaimStatus.Rejected => "Ditolak",
            _ => "Diperbarui"
        };

        return Ok(ApiResponse<object>.Success(claim, $"Permohonan klaim berhasil diproses dengan status: {statusLabel}."));
    }

    // ── Private badge processing ──────────────────────────────────────────────

    private async Task<List<MasterBadge>> ProcessBadgesForUser(string userId)
    {
        var awarded = new List<MasterBadge>();
        var activeBadges = await _context.MasterBadges.Where(b => b.IsActive && b.TriggerType != BadgeTriggerType.Manual).ToListAsync();
        var existingBadgeIds = await _context.UserBadges.Where(ub => ub.UserId == userId).Select(ub => ub.BadgeId).ToListAsync();

        var totalDone = await _context.Tasks.CountAsync(t => t.AssignedToUserId == userId && t.Status == WorkTaskStatus.Done);
        var totalHours = await _context.Sessions.Where(s => s.UserId == userId && s.EndTime.HasValue).SumAsync(s => (double)s.Duration / 3600.0);
        var totalNotes = await _context.Notes.CountAsync(n => n.AuthorUserId == userId);
        var overtimeDays = await _context.Sessions.Where(s => s.UserId == userId && s.EndTime.HasValue && s.Duration > 28800).CountAsync();

        // Tickets resolved by user
        var ticketsResolved = await _context.Tickets.CountAsync(t => t.AssignedToUserId == userId && (t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed));
        // Tickets reported by user
        var ticketsReported = await _context.Tickets.CountAsync(t => t.CreatedByUserId == userId);

        // Night owl sessions (end time after 20:00 local time approx)
        var nightOwlCount = await _context.Sessions.CountAsync(s => s.UserId == userId && s.EndTime.HasValue && s.EndTime.Value.Hour >= 13); // 13 UTC = 20 WIB

        // Fast completed tasks (< 2 hours or completed same day)
        var fastTasks = await _context.Tasks.CountAsync(t => t.AssignedToUserId == userId && t.Status == WorkTaskStatus.Done && t.CreatedAt >= t.UpdatedAt.AddHours(-2));

        // Critical tasks done
        var criticalTasksDone = await _context.Tasks.CountAsync(t => t.AssignedToUserId == userId && t.Status == WorkTaskStatus.Done && (t.Priority == TaskPriority.Critical || t.Priority == TaskPriority.High));

        // Weekend activity (Saturday = 6, Sunday = 0)
        var weekendTasks = await _context.Sessions.CountAsync(s => s.UserId == userId && (s.StartTime.DayOfWeek == DayOfWeek.Saturday || s.StartTime.DayOfWeek == DayOfWeek.Sunday));

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
                BadgeTriggerType.Auto_TasksAbove100 => totalDone >= (badge.TriggerThreshold > 0 ? badge.TriggerThreshold : 100),
                BadgeTriggerType.Auto_OvertimeHours => overtimeDays >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_NotesCreated => totalNotes >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_MonthlyTopTasks => monthlyTopUserId == userId,
                BadgeTriggerType.Auto_TicketsResolved => ticketsResolved >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_TicketsReported => ticketsReported >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_NightOwl => nightOwlCount >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_SpeedDemon => fastTasks >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_ZeroDefect => criticalTasksDone >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_WeekendWarrior => weekendTasks >= badge.TriggerThreshold,
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

public class ClaimRewardRequest
{
    public int Points { get; set; }
    public RewardType RewardType { get; set; } = RewardType.CashTransfer;
    public string AccountOrContactInfo { get; set; } = string.Empty;
    public string? UserNotes { get; set; }
}

public class ProcessClaimRequest
{
    public ClaimStatus Status { get; set; }
    public string? AdminNotes { get; set; }
}
