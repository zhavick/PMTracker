namespace WorkTracker.Core.DTOs;

public class DashboardStatsDto
{
    public int TotalTasks { get; set; }
    public int TodoTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int InReviewTasks { get; set; }
    public int DoneTasks { get; set; }
    public int OverdueTasks { get; set; }
    public int TotalProjects { get; set; }
    public int TotalUsers { get; set; }
    public double TodayWorkHours { get; set; }
    public double TotalWorkHoursAllTime { get; set; }
    public double OverallCompletionRate { get; set; }
}

public class TeamMemberWorkloadDto
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string Role { get; set; } = string.Empty;
    public string AvatarColor { get; set; } = "#3B82F6";
    public int TotalTasks { get; set; }
    public int DoneTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int TodoTasks { get; set; }
    public int OverdueTasks { get; set; }
    public int CompletionPercentage { get; set; }
    public double TotalHoursSpent { get; set; }
}

public class ProjectOverviewDto
{
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int ProgressPercentage { get; set; }
}
