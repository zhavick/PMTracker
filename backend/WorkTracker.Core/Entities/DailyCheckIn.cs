using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.Entities;

public class DailyCheckIn
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public DateOnly CheckInDate { get; set; }
    public DateTime CheckInTime { get; set; } = DateTime.UtcNow;
    public int PointsEarned { get; set; } = 10;
    public int StreakDay { get; set; } = 1;
    public bool IsMonthlyMilestone { get; set; } = false;

    [MaxLength(255)]
    public string? Notes { get; set; }
}
