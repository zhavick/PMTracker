using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.Entities;

public class WorkNote
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string ContentHtml { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = "General";

    [MaxLength(7)]
    public string Color { get; set; } = "#6366F1";

    public bool IsPinned { get; set; } = false;

    public string? AuthorUserId { get; set; }
    public ApplicationUser? AuthorUser { get; set; }

    public int? TaskId { get; set; }
    public WorkTask? Task { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<NoteAttachment> Attachments { get; set; } = new List<NoteAttachment>();
}

public class NoteAttachment
{
    public int Id { get; set; }

    public int NoteId { get; set; }
    public WorkNote? Note { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [MaxLength(100)]
    public string? ContentType { get; set; }

    [MaxLength(20)]
    public string? FileExtension { get; set; }

    public string? UploadedByUserId { get; set; }
    public ApplicationUser? UploadedByUser { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
