using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.Entities;

public class Company
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Code { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(300)]
    public string? Address { get; set; }

    [MaxLength(150)]
    public string? ContactEmail { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<WorkTask> Tasks { get; set; } = new List<WorkTask>();
    public ICollection<WorkNote> Notes { get; set; } = new List<WorkNote>();
}
