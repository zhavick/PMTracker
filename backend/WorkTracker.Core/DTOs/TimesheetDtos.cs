using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.DTOs;

public class WorkSessionDto
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public int? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string? ProjectColor { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public long Duration { get; set; } // In seconds
    public bool IsRunning => !EndTime.HasValue;
    public long CurrentRunningSeconds => IsRunning ? (long)(DateTime.UtcNow - StartTime).TotalSeconds : Duration;
    public string? Notes { get; set; }
}

public class StartTimerDto
{
    [Required]
    public int TaskId { get; set; }
    public string? Notes { get; set; }
}

public class StopTimerDto
{
    public string? Notes { get; set; }
}

public class ManualSessionDto
{
    [Required]
    public int TaskId { get; set; }

    public DateTime SessionDate { get; set; } = DateTime.UtcNow;

    [Range(1, 1440)]
    public int DurationMinutes { get; set; } = 30;

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class ProjectTimeShareDto
{
    public int? ProjectId { get; set; }
    public string ProjectName { get; set; } = "Umum / Tanpa Proyek";
    public string Color { get; set; } = "#6366F1";
    public long TotalSeconds { get; set; }
    public double Percentage { get; set; }
}

public class TimesheetSummaryDto
{
    public long TotalSeconds { get; set; }
    public int TotalSessions { get; set; }
    public int TotalTasksWorkedOn { get; set; }
    public List<ProjectTimeShareDto> ProjectShares { get; set; } = new List<ProjectTimeShareDto>();
}
