using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.Entities;

public class AuditLog
{
    public int Id { get; set; }

    public string? UserId { get; set; }

    [MaxLength(256)]
    public string? UserEmail { get; set; }

    [MaxLength(150)]
    public string? UserName { get; set; }

    [MaxLength(100)]
    public string? ControllerName { get; set; }

    [MaxLength(100)]
    public string? ActionName { get; set; }

    [Required]
    [MaxLength(10)]
    public string HttpMethod { get; set; } = "GET";

    [Required]
    [MaxLength(500)]
    public string Path { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? QueryString { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public int StatusCode { get; set; }

    public int DurationMs { get; set; } = 0;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string? Details { get; set; }
}

public class ImportLog
{
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    public int TotalRows { get; set; } = 0;
    public int SuccessRows { get; set; } = 0;
    public int FailedRows { get; set; } = 0;

    public string? Errors { get; set; }

    public DateTime ImportedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(150)]
    public string? ImportedBy { get; set; }
}

public class SqlHistory
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Dialect { get; set; } = "mysql";

    public int? TaskId { get; set; }
    public WorkTask? Task { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class JsonHistory
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public int? TaskId { get; set; }
    public WorkTask? Task { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
