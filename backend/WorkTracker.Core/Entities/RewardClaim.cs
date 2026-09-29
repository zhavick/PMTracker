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

    public int? RewardItemId { get; set; }
    public RewardItem? RewardItem { get; set; }

    public int PointsSpent { get; set; }
    public int PointsClaimed 
    { 
        get => PointsSpent; 
        set => PointsSpent = value; 
    }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PointValueSnapshot { get; set; } = 100m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal RupiahEquivalent { get; set; }
    public decimal RupiahAmount 
    { 
        get => RupiahEquivalent; 
        set => RupiahEquivalent = value; 
    }

    public RewardType RewardType { get; set; } = RewardType.CashTransfer;

    [MaxLength(200)]
    public string AccountOrContactInfo { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? UserNotes { get; set; }

    public ClaimStatus Status { get; set; } = ClaimStatus.Pending;

    [MaxLength(500)]
    public string? AdminNotes { get; set; }

    public string? ProcessedByUserId { get; set; }
    public ApplicationUser? ProcessedByUser { get; set; }

    public DateTime ClaimedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt 
    { 
        get => ClaimedAt; 
        set => ClaimedAt = value; 
    }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
