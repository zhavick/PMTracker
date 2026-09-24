using System.ComponentModel.DataAnnotations;
using WorkTracker.Core.Enums;

namespace WorkTracker.Core.Entities;

public class AttendanceRecord
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public DateTime Date { get; set; }

    public AttendanceType Type { get; set; } = AttendanceType.Present;

    public WorkLocation WorkLocation { get; set; } = WorkLocation.WFO;

    public DateTime? ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }

    public double TotalHours { get; set; } = 0.0;

    [MaxLength(200)]
    public string? LeaveReason { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Approved;

    public string? ApprovedByUserId { get; set; }
    public ApplicationUser? ApprovedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
