using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.Entities;

public class MasterPriority
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(7)]
    public string Color { get; set; } = "#3B82F6";

    [MaxLength(50)]
    public string Icon { get; set; } = "Flag";

    public int OrderIndex { get; set; } = 0;

    [MaxLength(200)]
    public string? Description { get; set; }

    public bool IsDefault { get; set; } = false;
}

public class MasterStatus
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(7)]
    public string Color { get; set; } = "#64748B";

    public bool IsDoneState { get; set; } = false;

    public int OrderIndex { get; set; } = 0;

    [MaxLength(200)]
    public string? Description { get; set; }

    public bool IsDefault { get; set; } = false;
}

public class MasterMilestone
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Phase { get; set; } = "Implementation";

    [Required]
    [MaxLength(7)]
    public string Color { get; set; } = "#6366F1";

    [MaxLength(50)]
    public string Icon { get; set; } = "Milestone";

    public int OrderIndex { get; set; } = 0;

    [MaxLength(200)]
    public string? Description { get; set; }

    public bool IsDefault { get; set; } = false;
}

public class MasterHoliday
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DateOnly Date { get; set; }

    [MaxLength(50)]
    public string HolidayType { get; set; } = "National"; // National, Company, Religious, Optional

    [MaxLength(7)]
    public string Color { get; set; } = "#EF4444";

    [MaxLength(50)]
    public string Icon { get; set; } = "Calendar";

    [MaxLength(255)]
    public string? Description { get; set; }

    public bool IsRecurringYearly { get; set; } = false;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
