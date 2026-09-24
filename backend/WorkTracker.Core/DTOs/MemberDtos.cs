using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.DTOs;

public class MemberDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? Department { get; set; }
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "User";
    public bool IsApproved { get; set; }
    public bool IsActive { get; set; }
    public string? AvatarUrl { get; set; }
    public string? CoverPictureUrl { get; set; }
    public int? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public int TotalTasksAssigned { get; set; }
    public double TotalHoursLogged { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateMemberRoleDto
{
    [Required]
    public string Role { get; set; } = "User";
}

public class ApproveUserDto
{
    public bool IsApproved { get; set; } = true;
    public string? RejectionReason { get; set; }
}

public class AdminResetPasswordDto
{
    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

public class PermanentDeleteUserDto
{
    [Required]
    public string FullNameConfirmation { get; set; } = string.Empty;

    [Required]
    public string AdminPassword { get; set; } = string.Empty;
}
