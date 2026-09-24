using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WorkTracker.Core.Enums;

namespace WorkTracker.Core.Entities;

public class RewardClaim
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public int PointsClaimed { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RupiahAmount { get; set; } // PointsClaimed * 100

    public RewardType RewardType { get; set; } = RewardType.CashTransfer;

    [MaxLength(200)]
    public string AccountOrContactInfo { get; set; } = string.Empty; // No Rekening / No E-Wallet / Nama Tempat Traktir

    [MaxLength(500)]
    public string? UserNotes { get; set; } // Catatan request dari user

    public ClaimStatus Status { get; set; } = ClaimStatus.Pending;

    [MaxLength(500)]
    public string? AdminNotes { get; set; } // Catatan admin: bukti transfer / info traktir / alasan tolak

    public string? ProcessedByUserId { get; set; }
    public ApplicationUser? ProcessedByUser { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
