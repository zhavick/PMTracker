using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace WorkTracker.Core.Entities;

public class ApplicationUser : IdentityUser
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string JobTitle { get; set; } = string.Empty;

    [MaxLength(7)]
    public string AvatarColor { get; set; } = "#6366F1";

    [MaxLength(300)]
    public string? ProfilePictureUrl { get; set; }

    [MaxLength(300)]
    public string? CoverPictureUrl { get; set; }

    public int? CompanyId { get; set; }
    public Company? Company { get; set; }

    public bool IsApproved { get; set; } = false;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedByUserId { get; set; }
    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<WorkTask> AssignedTasks { get; set; } = new List<WorkTask>();
    public ICollection<WorkSession> WorkSessions { get; set; } = new List<WorkSession>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
    public ICollection<WorkNote> Notes { get; set; } = new List<WorkNote>();
    public ICollection<UserBadge> Badges { get; set; } = new List<UserBadge>();
}

public class ApplicationRole : IdentityRole
{
    public ApplicationRole() : base() { }
    public ApplicationRole(string roleName) : base(roleName) { }
}
