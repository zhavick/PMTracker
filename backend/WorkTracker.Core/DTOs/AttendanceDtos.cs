using System.ComponentModel.DataAnnotations;
using WorkTracker.Core.Enums;

namespace WorkTracker.Core.DTOs;

public class AttendanceRecordDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public AttendanceType Type { get; set; }
    public WorkLocation WorkLocation { get; set; }
    public DateTime? ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public double TotalHours { get; set; }
    public string? LeaveReason { get; set; }
    public string? Notes { get; set; }
    public string? Location { get; set; }
    public AttendanceStatus Status { get; set; }
    public bool IsCheckedIn => ClockIn.HasValue && !ClockOut.HasValue;
}

public class CheckInRequestDto
{
    public AttendanceType Type { get; set; } = AttendanceType.Present;
    public WorkLocation WorkLocation { get; set; } = WorkLocation.WFO;
    [MaxLength(1000)]
    public string? Notes { get; set; }
    [MaxLength(200)]
    public string? Location { get; set; }
}

public class CheckOutRequestDto
{
    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class ReconciliationRequestDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public DateTime Date { get; set; }

    public AttendanceType Type { get; set; } = AttendanceType.Present;
    public WorkLocation WorkLocation { get; set; } = WorkLocation.WFO;
    public DateTime? ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public double TotalHours { get; set; }
    public string? Notes { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Approved;
}

public class ManualAttendanceDto
{
    public string? UserId { get; set; }
    [Required]
    public DateTime Date { get; set; }
    public AttendanceType Type { get; set; } = AttendanceType.Present;
    public WorkLocation WorkLocation { get; set; } = WorkLocation.WFO;
    public string? ClockIn { get; set; }
    public string? ClockOut { get; set; }
    public double? TotalHours { get; set; }
    [MaxLength(1000)]
    public string? Notes { get; set; }
    [MaxLength(200)]
    public string? Location { get; set; }
}

