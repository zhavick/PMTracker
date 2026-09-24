using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WorkTracker.Core.Entities;

public enum TicketCategory
{
    Bug = 1,            // Kendala / Eror Sistem
    FeatureRequest = 2, // Permintaan Fitur Baru
    Support = 3,        // Bantuan Teknis & Operasional
    Infrastructure = 4, // Jaringan / Server / Database
    AccountAccess = 5,  // Akses Akun / Hak Akses
    Other = 6           // Lainnya
}

public enum TicketPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum TicketStatus
{
    Open = 1,           // Baru dibuat, belum ditangani
    InProgress = 2,     // Sedang dikerjakan
    PendingUser = 3,    // Menunggu tanggapan dari pelapor
    Resolved = 4,       // Sudah diperbaiki/diselesaikan
    Closed = 5,         // Ditutup tuntas
    Rejected = 6        // Ditolak / Tidak valid
}

public class Ticket
{
    public int Id { get; set; }

    [Required]
    [MaxLength(30)]
    public string TicketNumber { get; set; } = string.Empty; // e.g. TCK-202609-0001

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public TicketCategory Category { get; set; } = TicketCategory.Bug;

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;

    public TicketStatus Status { get; set; } = TicketStatus.Open;

    public int? ProjectId { get; set; }
    public Project? Project { get; set; }

    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;
    public ApplicationUser? CreatedByUser { get; set; }

    public string? AssignedToUserId { get; set; }
    public ApplicationUser? AssignedToUser { get; set; }

    public string? ResolutionNotes { get; set; }

    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
}

public class TicketComment
{
    public int Id { get; set; }

    public int TicketId { get; set; }
    public Ticket? Ticket { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    [Required]
    public string Message { get; set; } = string.Empty;

    public bool IsInternal { get; set; } = false; // Catatan internal teknis admin/dev

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
