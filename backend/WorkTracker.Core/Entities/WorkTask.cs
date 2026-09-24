using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WorkTracker.Core.Enums;

namespace WorkTracker.Core.Entities;

public class WorkTask
{
    public int Id { get; set; }

    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public WorkTaskStatus Status { get; set; } = WorkTaskStatus.Todo;

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    [Range(0, 100)]
    public int Progress { get; set; } = 0;

    public int? ProjectId { get; set; }
    public Project? Project { get; set; }

    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public string? AssignedToUserId { get; set; }
    public ApplicationUser? AssignedToUser { get; set; }

    public int? ParentTaskId { get; set; }
    public WorkTask? ParentTask { get; set; }
    public ICollection<WorkTask> ChildTasks { get; set; } = new List<WorkTask>();

    [MaxLength(100)]
    public string Milestone { get; set; } = "Implementation";

    public string? Obstacle { get; set; }
    public string? Solution { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    public string? Tags { get; set; } // JSON serialized array of strings

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<WorkSession> Sessions { get; set; } = new List<WorkSession>();
    public ICollection<WorkNote> Notes { get; set; } = new List<WorkNote>();
    public ICollection<SqlHistory> SqlHistories { get; set; } = new List<SqlHistory>();
    public ICollection<JsonHistory> JsonHistories { get; set; } = new List<JsonHistory>();
}

public class WorkSession
{
    public int Id { get; set; }

    public int TaskId { get; set; }
    public WorkTask? Task { get; set; }

    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; } // NULL indicates actively running timer

    public long Duration { get; set; } = 0; // Duration in seconds

    [MaxLength(1000)]
    public string? Notes { get; set; }
}
