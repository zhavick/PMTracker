using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.DTOs;

public class WorkNoteDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Color { get; set; } = "#6366F1";
    public bool IsPinned { get; set; }
    public int? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public string? AuthorUserId { get; set; }
    public string? AuthorName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<NoteAttachmentDto> Attachments { get; set; } = new List<NoteAttachmentDto>();
}

public class NoteAttachmentDto
{
    public int Id { get; set; }
    public int NoteId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
}

public class CreateNoteDto
{
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

    public int? TaskId { get; set; }
}

public class UpdateNoteDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string ContentHtml { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = "General";

    [MaxLength(7)]
    public string Color { get; set; } = "#6366F1";

    public bool IsPinned { get; set; }

    public int? TaskId { get; set; }
}
