using WorkTracker.Core.Enums;

namespace WorkTracker.Core.DTOs;

public class CalendarEventDto
{
    public string Id { get; set; } = string.Empty;
    public int TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime Start { get; set; }
    public DateTime? End { get; set; }
    public bool AllDay { get; set; } = true;
    public string Color { get; set; } = "#6366F1";
    public string TextColor { get; set; } = "#FFFFFF";

    // Task details for popover/modal
    public string? ProjectName { get; set; }
    public string? ProjectColor { get; set; }
    public WorkTaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public int Progress { get; set; }
    public string Milestone { get; set; } = "Implementation";
    public string? AssigneeName { get; set; }
    public string? AssigneeId { get; set; }
    public string? Obstacle { get; set; }
    public string? Solution { get; set; }
}
