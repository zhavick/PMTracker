namespace WorkTracker.Core.Enums;

public enum BadgeRarity
{
    Common = 1,
    Rare = 2,
    Epic = 3,
    Legendary = 4
}

public enum BadgeTriggerType
{
    Manual = 0,
    Auto_DoneTasks = 1,          // Total tasks completed >= threshold
    Auto_WorkHours = 2,          // Total timesheet hours >= threshold
    Auto_AttendanceStreak = 3,   // Consecutive attendance days >= threshold
    Auto_MonthlyTopTasks = 4,    // Monthly top task doer (leaderboard)
    Auto_TasksAbove100 = 5,      // Completed tasks >= 100 total
    Auto_OvertimeHours = 6,      // Timesheet hours > 8h/day instances >= threshold
    Auto_NotesCreated = 7,       // Total notes/documents >= threshold
    Auto_ProjectsManaged = 8,    // Projects contributed >= threshold
    Auto_EarlyBird = 9,          // Check-in before 07:30 streak
    Auto_NightOwl = 10           // Check-out after 20:00 instances >= threshold
}
