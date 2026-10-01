using System.ComponentModel.DataAnnotations;
using WorkTracker.Core.Enums;

namespace WorkTracker.Core.DTOs;

public class ProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Color { get; set; } = "#6366F1";
    public DateTime? Deadline { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public int? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int ProgressPercent { get; set; }
    public long TotalSecondsLogged { get; set; }
    public string? ClientName { get; set; }
    public string? ProjectManagerId { get; set; }
    public string? ProjectManagerName { get; set; }
    public decimal Budget { get; set; }
    public decimal ActualCost { get; set; }
    public int BurnRatePercent { get; set; }
    public string? Tags { get; set; }
}

public class CreateProjectDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(7)]
    public string Color { get; set; } = "#6366F1";

    public DateTime? Deadline { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public int? CompanyId { get; set; }

    [MaxLength(200)]
    public string? ClientName { get; set; }

    public string? ProjectManagerId { get; set; }

    public decimal Budget { get; set; } = 0;
    public decimal ActualCost { get; set; } = 0;

    [MaxLength(500)]
    public string? Tags { get; set; }
}

public class UpdateProjectDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(7)]
    public string Color { get; set; } = "#6366F1";

    public DateTime? Deadline { get; set; }
    public ProjectStatus Status { get; set; }
    public int? CompanyId { get; set; }

    [MaxLength(200)]
    public string? ClientName { get; set; }

    public string? ProjectManagerId { get; set; }

    public decimal Budget { get; set; } = 0;
    public decimal ActualCost { get; set; } = 0;

    [MaxLength(500)]
    public string? Tags { get; set; }
}

public class BulkAssignTasksDto
{
    [Required]
    public int[] TaskIds { get; set; } = Array.Empty<int>();
}

public class WorkTaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public WorkTaskStatus Status { get; set; } = WorkTaskStatus.Todo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public int Progress { get; set; }
    public int? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string? ProjectColor { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? CompanyId { get; set; }
    public string? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public string? AssignedToEmail { get; set; }
    public string? AssignedToJobTitle { get; set; }
    public int? ParentTaskId { get; set; }
    public string? ParentTaskTitle { get; set; }
    public int SubtaskCount { get; set; }
    public int SubtasksCompletedCount { get; set; }
    public string Milestone { get; set; } = "Implementation";
    public string? Obstacle { get; set; }
    public string? Solution { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Tags { get; set; }
    public long TotalSecondsSpent { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<WorkTaskDto> Subtasks { get; set; } = new List<WorkTaskDto>();
}

public class CreateTaskDto
{
    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }
    public WorkTaskStatus Status { get; set; } = WorkTaskStatus.Todo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    [Range(0, 100)]
    public int Progress { get; set; } = 0;
    public int? ProjectId { get; set; }
    public int? CategoryId { get; set; }
    public int? CompanyId { get; set; }
    public string? AssignedToUserId { get; set; }
    public int? ParentTaskId { get; set; }
    [MaxLength(100)]
    public string Milestone { get; set; } = "Implementation";
    public string? Obstacle { get; set; }
    public string? Solution { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Tags { get; set; }
    public bool? AllowDuplicate { get; set; } = false;
}

public class UpdateTaskDto
{
    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }
    public WorkTaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    [Range(0, 100)]
    public int Progress { get; set; }
    public int? ProjectId { get; set; }
    public int? CategoryId { get; set; }
    public string? AssignedToUserId { get; set; }
    public int? ParentTaskId { get; set; }
    [MaxLength(100)]
    public string Milestone { get; set; } = "Implementation";
    public string? Obstacle { get; set; }
    public string? Solution { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Tags { get; set; }
}

public class TaskStatusUpdateDto
{
    [Required]
    public WorkTaskStatus Status { get; set; }
    public int? Progress { get; set; }
}

public class UnifiedSaveTaskDto
{
    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public WorkTaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    [Range(0, 100)]
    public int Progress { get; set; }
    public int? ProjectId { get; set; }
    public int? CategoryId { get; set; }
    public string? AssignedToUserId { get; set; }
    public int? ParentTaskId { get; set; }
    public string Milestone { get; set; } = "Implementation";
    public string? Obstacle { get; set; }
    public string? Solution { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Tags { get; set; }
    public bool? AllowDuplicate { get; set; } = false;

    // Unified session logging
    public bool LogSession { get; set; } = false;
    public int? DurationMinutes { get; set; }
    public DateTime? SessionDate { get; set; }
    [MaxLength(1000)]
    public string? SessionNotes { get; set; }
}

public class ImportedTaskItemDto
{
    public int? Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ProjectName { get; set; }
    public string? AssignedTo { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Action { get; set; } = "Created"; // "Created" or "Updated"
    public string? Milestone { get; set; }
    public int? RowNumber { get; set; }
    public string? SheetName { get; set; }
}

public class TaskImportResultDto
{
    public int TotalRows { get; set; }
    public int SuccessRows { get; set; }
    public int FailedRows { get; set; }
    public int CreatedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int ProjectsCreated { get; set; }
    public int UsersCreated { get; set; }
    public List<string> CreatedProjectNames { get; set; } = new();
    public List<string> CreatedUserEmails { get; set; } = new();
    public List<ImportedTaskItemDto> TasksCreated { get; set; } = new();
    public List<ImportedTaskItemDto> TasksUpdated { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}

public class ElistecTimesheetRowDto
{
    public string IssueKey { get; set; } = string.Empty;
    public string IssueSummary { get; set; } = string.Empty;
    public double Hours { get; set; }
    public DateTime WorkDate { get; set; }
    public string ClockIn { get; set; } = "-";
    public string ClockOut { get; set; } = "-";
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string ActivityType { get; set; } = string.Empty;
    public string WorkingPlace { get; set; } = "WFO";
    public bool IsWeekendOrHoliday { get; set; }
}

public class BulkUpdateTasksRequestDto
{
    [Required]
    public List<int> TaskIds { get; set; } = new();
    public WorkTaskStatus? Status { get; set; }
    public TaskPriority? Priority { get; set; }
    public string? AssignedToUserId { get; set; }
    public int? Progress { get; set; }
}

public class BulkDeleteTasksRequestDto
{
    [Required]
    public List<int> TaskIds { get; set; } = new();
}


