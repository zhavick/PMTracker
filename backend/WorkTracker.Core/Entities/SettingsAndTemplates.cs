using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.Entities;

public class SystemSetting
{
    [Key]
    [MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    [Required]
    public string Value { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Description { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class EmailTemplate
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string EventCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string EventName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Category { get; set; } = "Notification";

    [Required]
    [MaxLength(300)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string BodyHtml { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? AvailableVariables { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string? UpdatedByUserId { get; set; }
}
