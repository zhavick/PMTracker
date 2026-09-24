using System.ComponentModel.DataAnnotations;
using WorkTracker.Core.Enums;

namespace WorkTracker.Core.Entities;

public class MasterBadge
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = "General";

    [MaxLength(100)]
    public string Icon { get; set; } = "Award";

    [MaxLength(50)]
    public string Color { get; set; } = "#10B981";

    public int Points { get; set; } = 50;

    public BadgeRarity Rarity { get; set; } = BadgeRarity.Common;

    public BadgeTriggerType TriggerType { get; set; } = BadgeTriggerType.Manual;

    public int TriggerThreshold { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public int OrderIndex { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
}

public class UserBadge
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public int BadgeId { get; set; }
    public MasterBadge? Badge { get; set; }

    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;

    public bool IsFeatured { get; set; } = false;

    [MaxLength(150)]
    public string? AwardedBy { get; set; }
}
