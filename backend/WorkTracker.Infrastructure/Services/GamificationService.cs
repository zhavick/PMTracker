using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Core.Enums;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Infrastructure.Services;

public class GamificationService
{
    private readonly AppDbContext _context;
    public const decimal POINT_TO_RUPIAH_RATE = 100m; // 1 Point = Rp 100

    public GamificationService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Executes daily check-in with streak calculation (2-day gap reset) and 30-day milestone bonus (+150 Pts).
    /// </summary>
    public async Task<DailyCheckInResultDto> ProcessDailyCheckInAsync(string userId, string? notes = null)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return new DailyCheckInResultDto { Success = false, Message = "Pengguna tidak ditemukan." };
        }

        // Check if already checked in today
        var alreadyCheckedIn = await _context.DailyCheckIns
            .AnyAsync(c => c.UserId == userId && c.CheckInDate == today);

        if (alreadyCheckedIn)
        {
            return new DailyCheckInResultDto
            {
                Success = false,
                Message = "Anda sudah melakukan daily check-in hari ini.",
                CurrentStreak = user.CurrentStreak,
                LongestStreak = user.LongestStreak,
                TotalAvailablePoints = await GetAvailablePointsAsync(userId)
            };
        }

        // Get last check-in date
        var lastCheckIn = await _context.DailyCheckIns
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CheckInDate)
            .FirstOrDefaultAsync();

        int currentStreak = 1;
        if (lastCheckIn != null)
        {
            var yesterday = today.AddDays(-1);
            if (lastCheckIn.CheckInDate == yesterday)
            {
                // Consecutive day: increment streak
                currentStreak = lastCheckIn.StreakDay + 1;
            }
            else
            {
                // Gap of 2 or more days: reset streak to 1
                currentStreak = 1;
            }
        }

        // Check 30-day milestone
        bool isMilestone = (currentStreak % 30 == 0);
        int basePoints = 10;
        int milestoneBonus = isMilestone ? 150 : 0;
        int totalEarned = basePoints + milestoneBonus;

        var checkInRecord = new DailyCheckIn
        {
            UserId = userId,
            CheckInDate = today,
            CheckInTime = DateTime.UtcNow,
            PointsEarned = totalEarned,
            StreakDay = currentStreak,
            IsMonthlyMilestone = isMilestone,
            Notes = notes
        };

        _context.DailyCheckIns.Add(checkInRecord);

        // Update User Profile
        user.CurrentStreak = currentStreak;
        if (currentStreak > user.LongestStreak)
        {
            user.LongestStreak = currentStreak;
        }
        user.TotalPointsEarned += totalEarned;

        await _context.SaveChangesAsync();

        // Evaluate Badges
        var newBadges = await EvaluateBadgesForUserAsync(userId);

        var availablePoints = await GetAvailablePointsAsync(userId);

        string message = isMilestone
            ? $"Luar biasa! Anda mencapai {currentStreak} hari streak dan meraih Milestone Bulanan! (+{totalEarned} Poin)"
            : $"Daily check-in berhasil! Streak Anda: {currentStreak} hari (+{totalEarned} Poin).";

        return new DailyCheckInResultDto
        {
            Success = true,
            Message = message,
            PointsEarned = totalEarned,
            CurrentStreak = currentStreak,
            LongestStreak = user.LongestStreak,
            IsMonthlyMilestone = isMilestone,
            MilestoneBonusPoints = milestoneBonus,
            TotalAvailablePoints = availablePoints,
            NewBadges = newBadges
        };
    }

    /// <summary>
    /// Gets gamification profile including 30-day visual roadmap, available points, badges, and recent claims.
    /// </summary>
    public async Task<GamificationProfileDto> GetGamificationProfileAsync(string userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return new GamificationProfileDto();

        var hasCheckedInToday = await _context.DailyCheckIns
            .AnyAsync(c => c.UserId == userId && c.CheckInDate == today);

        // Points calculation
        var pointsSpent = await _context.RewardClaims
            .Where(r => r.UserId == userId && r.Status != ClaimStatus.Rejected)
            .SumAsync(r => r.PointsSpent);

        // If user.TotalPointsEarned is 0 but has badges/checkins, calculate from sources
        var totalPointsFromBadges = await _context.UserBadges
            .Where(ub => ub.UserId == userId)
            .SumAsync(ub => ub.Badge != null ? ub.Badge.Points : 0);

        var totalPointsFromCheckIns = await _context.DailyCheckIns
            .Where(c => c.UserId == userId)
            .SumAsync(c => c.PointsEarned);

        var computedTotal = Math.Max(user.TotalPointsEarned, totalPointsFromBadges + totalPointsFromCheckIns);
        if (computedTotal > user.TotalPointsEarned)
        {
            user.TotalPointsEarned = computedTotal;
            await _context.SaveChangesAsync();
        }

        var availablePoints = Math.Max(0, user.TotalPointsEarned - pointsSpent);
        var availableRupiah = availablePoints * POINT_TO_RUPIAH_RATE;

        // Distinct check-in days in last 30 days
        var thirtyDaysAgo = today.AddDays(-30);
        var checkInDaysCount = await _context.DailyCheckIns
            .Where(c => c.UserId == userId && c.CheckInDate >= thirtyDaysAgo)
            .Select(c => c.CheckInDate)
            .Distinct()
            .CountAsync();

        // 30-day visual roadmap calculation
        // The cycle position (1 to 30) based on current streak
        int cycleDay = user.CurrentStreak > 0 
            ? ((user.CurrentStreak - 1) % 30) + 1 
            : 0;

        if (!hasCheckedInToday && cycleDay > 0)
        {
            // If haven't checked in today yet, the next check-in will be cycleDay + 1 (or 1 if streak broken)
            // But let's show today as the target check-in slot
        }

        var roadmap = new List<CheckInDayStatusDto>();
        for (int i = 1; i <= 30; i++)
        {
            bool isMilestone = (i == 30);
            bool isPast = false;
            bool isToday = false;
            bool isCheckedIn = false;

            if (hasCheckedInToday)
            {
                if (i < cycleDay) { isPast = true; isCheckedIn = true; }
                else if (i == cycleDay) { isToday = true; isCheckedIn = true; }
                else { isPast = false; isCheckedIn = false; }
            }
            else
            {
                int targetDay = cycleDay + 1 > 30 ? 1 : cycleDay + 1;
                if (i <= cycleDay) { isPast = true; isCheckedIn = true; }
                else if (i == targetDay) { isToday = true; isCheckedIn = false; }
                else { isPast = false; isCheckedIn = false; }
            }

            roadmap.Add(new CheckInDayStatusDto
            {
                DayIndex = i,
                Date = $"Hari {i}",
                IsCheckedIn = isCheckedIn,
                IsToday = isToday,
                IsPast = isPast,
                Points = isMilestone ? 160 : 10,
                IsMilestone = isMilestone
            });
        }

        // Badges
        var userBadges = await _context.UserBadges
            .Include(ub => ub.Badge)
            .Where(ub => ub.UserId == userId)
            .OrderByDescending(ub => ub.UnlockedAt)
            .Select(ub => new UserBadgeDto
            {
                Id = ub.Id,
                BadgeId = ub.BadgeId,
                Code = ub.Badge != null ? ub.Badge.Code : "",
                Name = ub.Badge != null ? ub.Badge.Name : "",
                Description = ub.Badge != null ? ub.Badge.Description : "",
                Category = ub.Badge != null ? ub.Badge.Category : "",
                Icon = ub.Badge != null ? ub.Badge.Icon : "Award",
                Color = ub.Badge != null ? ub.Badge.Color : "#10B981",
                Points = ub.Badge != null ? ub.Badge.Points : 0,
                Rarity = ub.Badge != null ? ub.Badge.Rarity.ToString() : "Common",
                UnlockedAt = ub.UnlockedAt
            })
            .ToListAsync();

        var masterBadges = await _context.MasterBadges
            .Where(b => b.IsActive)
            .OrderBy(b => b.OrderIndex)
            .ThenBy(b => b.Rarity)
            .ToListAsync();

        // Recent Claims
        var claims = await _context.RewardClaims
            .Include(r => r.RewardItem)
            .Include(r => r.ProcessedByUser)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.ClaimedAt)
            .Take(10)
            .Select(r => new RewardClaimDto
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = user.FullName ?? user.UserName ?? "Pengguna",
                UserEmail = user.Email ?? "",
                UserAvatarColor = user.AvatarColor ?? "#6366F1",
                RewardItemId = r.RewardItemId,
                RewardItemName = r.RewardItem != null ? r.RewardItem.Name : "Pencairan Dana",
                RewardItemIcon = r.RewardItem != null ? r.RewardItem.Icon : "Gift",
                PointsSpent = r.PointsSpent,
                RupiahEquivalent = r.RupiahEquivalent,
                RewardType = r.RewardType.ToString(),
                AccountOrContactInfo = r.AccountOrContactInfo,
                UserNotes = r.UserNotes,
                Status = r.Status.ToString(),
                AdminNotes = r.AdminNotes,
                ProcessedByName = r.ProcessedByUser != null ? r.ProcessedByUser.FullName : null,
                ProcessedAt = r.ProcessedAt,
                ClaimedAt = r.ClaimedAt
            })
            .ToListAsync();

        return new GamificationProfileDto
        {
            TotalPointsEarned = user.TotalPointsEarned,
            AvailablePoints = availablePoints,
            PointsSpent = pointsSpent,
            PointToRupiahRate = POINT_TO_RUPIAH_RATE,
            AvailableRupiah = availableRupiah,
            CurrentStreak = user.CurrentStreak,
            LongestStreak = user.LongestStreak,
            CheckInDaysCount30Days = checkInDaysCount,
            HasCheckedInToday = hasCheckedInToday,
            ThirtyDayRoadmap = roadmap,
            Badges = userBadges,
            AvailableBadges = masterBadges,
            RecentClaims = claims
        };
    }

    /// <summary>
    /// Helper to get available points for a user.
    /// </summary>
    public async Task<int> GetAvailablePointsAsync(string userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return 0;

        var pointsSpent = await _context.RewardClaims
            .Where(r => r.UserId == userId && r.Status != ClaimStatus.Rejected)
            .SumAsync(r => r.PointsSpent);

        return Math.Max(0, user.TotalPointsEarned - pointsSpent);
    }

    /// <summary>
    /// Evaluates badge qualification for user and awards unlocked badges.
    /// </summary>
    public async Task<List<MasterBadge>> EvaluateBadgesForUserAsync(string userId)
    {
        var awarded = new List<MasterBadge>();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return awarded;

        var activeBadges = await _context.MasterBadges
            .Where(b => b.IsActive && b.TriggerType != BadgeTriggerType.Manual)
            .ToListAsync();

        var existingBadgeIds = await _context.UserBadges
            .Where(ub => ub.UserId == userId)
            .Select(ub => ub.BadgeId)
            .ToListAsync();

        var totalDone = await _context.Tasks
            .CountAsync(t => t.AssignedToUserId == userId && t.Status == WorkTaskStatus.Done);

        var totalHours = await _context.Sessions
            .Where(s => s.UserId == userId && s.EndTime.HasValue)
            .SumAsync(s => (double)s.Duration / 3600.0);

        var totalNotes = await _context.Notes
            .CountAsync(n => n.AuthorUserId == userId);

        var overtimeDays = await _context.Sessions
            .Where(s => s.UserId == userId && s.EndTime.HasValue && s.Duration > 28800)
            .CountAsync();

        var totalCheckIns = await _context.DailyCheckIns
            .CountAsync(c => c.UserId == userId);

        var nightOwlCount = await _context.Sessions
            .CountAsync(s => s.UserId == userId && s.EndTime.HasValue && s.EndTime.Value.Hour >= 13); // 13 UTC = 20 WIB

        var fastTasks = await _context.Tasks
            .CountAsync(t => t.AssignedToUserId == userId && t.Status == WorkTaskStatus.Done && t.CreatedAt >= t.UpdatedAt.AddHours(-2));

        var criticalTasksDone = await _context.Tasks
            .CountAsync(t => t.AssignedToUserId == userId && t.Status == WorkTaskStatus.Done && (t.Priority == TaskPriority.Critical || t.Priority == TaskPriority.High));

        var weekendTasks = await _context.Sessions
            .CountAsync(s => s.UserId == userId && (s.StartTime.DayOfWeek == DayOfWeek.Saturday || s.StartTime.DayOfWeek == DayOfWeek.Sunday));

        var projectsManaged = await _context.Projects
            .CountAsync(p => p.ProjectManagerId == userId);

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
                BadgeTriggerType.Auto_ProjectsManaged => projectsManaged >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_NightOwl => nightOwlCount >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_SpeedDemon => fastTasks >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_ZeroDefect => criticalTasksDone >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_WeekendWarrior => weekendTasks >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_CheckInStreak => user.CurrentStreak >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_TotalCheckIns => totalCheckIns >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_TotalPoints => user.TotalPointsEarned >= badge.TriggerThreshold,
                BadgeTriggerType.Auto_MonthlyMilestone => user.CurrentStreak >= 30,
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

                // Add points from badge
                user.TotalPointsEarned += badge.Points;
                awarded.Add(badge);
            }
        }

        if (awarded.Any())
        {
            await _context.SaveChangesAsync();
        }

        return awarded;
    }

    /// <summary>
    /// Claims a catalog reward item. Verifies available points and decrements stock.
    /// </summary>
    public async Task<RewardClaim> ClaimRewardItemAsync(string userId, ClaimRewardItemRequest req)
    {
        var item = await _context.RewardItems.FirstOrDefaultAsync(r => r.Id == req.RewardItemId);
        if (item == null)
            throw new InvalidOperationException("Item hadiah tidak ditemukan.");

        if (!item.IsActive)
            throw new InvalidOperationException("Item hadiah saat ini sedang tidak aktif.");

        if (item.Stock <= 0)
            throw new InvalidOperationException("Stok item hadiah ini telah habis.");

        var availablePoints = await GetAvailablePointsAsync(userId);
        if (availablePoints < item.PointCost)
            throw new InvalidOperationException($"Poin tidak mencukupi. Anda memiliki {availablePoints} poin, butuh {item.PointCost} poin.");

        // Reserve stock
        item.Stock -= 1;

        var rupiahEquivalent = item.PointCost * POINT_TO_RUPIAH_RATE;

        RewardType rewardType = item.Category switch
        {
            "E-Wallet" => RewardType.EWallet,
            "Voucher" => RewardType.Voucher,
            "Traktir" => RewardType.TreatMeal,
            "Kopi" => RewardType.TreatCoffee,
            "Transfer" => RewardType.CashTransfer,
            _ => RewardType.Other
        };

        var claim = new RewardClaim
        {
            UserId = userId,
            RewardItemId = item.Id,
            PointsSpent = item.PointCost,
            RupiahEquivalent = rupiahEquivalent,
            RewardType = rewardType,
            AccountOrContactInfo = req.AccountOrContactInfo?.Trim() ?? string.Empty,
            UserNotes = req.UserNotes?.Trim(),
            Status = ClaimStatus.Pending,
            ClaimedAt = DateTime.UtcNow
        };

        _context.RewardClaims.Add(claim);
        await _context.SaveChangesAsync();

        return claim;
    }
}
