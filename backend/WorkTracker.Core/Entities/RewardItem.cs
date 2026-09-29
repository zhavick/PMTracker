using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.Entities;

public class RewardItem
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int PointCost { get; set; } = 100;
    public int Stock { get; set; } = 0;

    [Required, MaxLength(50)]
    public string Category { get; set; } = "Voucher";

    [Required, MaxLength(50)]
    public string Icon { get; set; } = "Gift";

    [Required, MaxLength(30)]
    public string Color { get; set; } = "#6366F1";

    public bool IsActive { get; set; } = true;
    public bool IsMonthlyMilestoneReward { get; set; } = false;
    public int OrderIndex { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
