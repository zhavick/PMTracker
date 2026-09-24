using System.ComponentModel.DataAnnotations;
using WorkTracker.Core.Enums;

namespace WorkTracker.Core.Entities;

public class Project
{
    public int Id { get; set; }

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
    public Company? Company { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<WorkTask> Tasks { get; set; } = new List<WorkTask>();
}

public class Category
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(7)]
    public string Color { get; set; } = "#6366F1";

    [MaxLength(500)]
    public string? Description { get; set; }

    // Navigation properties
    public ICollection<WorkTask> Tasks { get; set; } = new List<WorkTask>();
}
