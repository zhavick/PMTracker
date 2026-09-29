using WorkTracker.Core.Entities;
using WorkTracker.Core.Enums;

namespace WorkTracker.Core.DTOs;

public class DailyCheckInResultDto
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = string.Empty;
    public int PointsEarned { get; set; } = 10;
    public int CurrentStreak { get; set; } = 1;
    public int LongestStreak { get; set; } = 1;
    public bool IsMonthlyMilestone { get; set; } = false;
    public int MilestoneBonusPoints { get; set; } = 0;
    public int TotalAvailablePoints { get; set; } = 0;
    public List<MasterBadge> NewBadges { get; set; } = new();
}

public class CheckInDayStatusDto
{
    public int DayIndex { get; set; }
    public string Date { get; set; } = string.Empty;
    public bool IsCheckedIn { get; set; }
    public bool IsToday { get; set; }
    public bool IsPast { get; set; }
    public int Points { get; set; }
    public bool IsMilestone { get; set; }
}

public class GamificationProfileDto
{
    public int TotalPointsEarned { get; set; }
    public int AvailablePoints { get; set; }
    public int PointsSpent { get; set; }
    public decimal PointToRupiahRate { get; set; } = 100m;
    public decimal AvailableRupiah { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public int CheckInDaysCount30Days { get; set; }
    public bool HasCheckedInToday { get; set; }
    public List<CheckInDayStatusDto> ThirtyDayRoadmap { get; set; } = new();
    public List<UserBadgeDto> Badges { get; set; } = new();
    public List<MasterBadge> AvailableBadges { get; set; } = new();
    public List<RewardClaimDto> RecentClaims { get; set; } = new();
}

public class UserBadgeDto
{
    public int Id { get; set; }
    public int BadgeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Icon { get; set; } = "Award";
    public string Color { get; set; } = "#10B981";
    public int Points { get; set; }
    public string Rarity { get; set; } = "Common";
    public DateTime UnlockedAt { get; set; }
}

public class ClaimRewardItemRequest
{
    public int RewardItemId { get; set; }
    public string? AccountOrContactInfo { get; set; }
    public string? UserNotes { get; set; }
}

public class ProcessRewardClaimRequest
{
    public ClaimStatus Status { get; set; }
    public string? AdminNotes { get; set; }
}

public class CreateRewardItemDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int PointCost { get; set; } = 100;
    public int Stock { get; set; } = 10;
    public string Category { get; set; } = "Voucher";
    public string Icon { get; set; } = "Gift";
    public string Color { get; set; } = "#6366F1";
    public bool IsMonthlyMilestoneReward { get; set; } = false;
    public int OrderIndex { get; set; } = 0;
}

public class UpdateRewardItemDto : CreateRewardItemDto
{
    public bool IsActive { get; set; } = true;
}

public class RewardClaimDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string UserAvatarColor { get; set; } = "#6366F1";
    public int? RewardItemId { get; set; }
    public string RewardItemName { get; set; } = string.Empty;
    public string RewardItemIcon { get; set; } = "Gift";
    public int PointsSpent { get; set; }
    public decimal RupiahEquivalent { get; set; }
    public string RewardType { get; set; } = "Voucher";
    public string AccountOrContactInfo { get; set; } = string.Empty;
    public string? UserNotes { get; set; }
    public string Status { get; set; } = "Pending";
    public string? AdminNotes { get; set; }
    public string? ProcessedByName { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime ClaimedAt { get; set; }
}
