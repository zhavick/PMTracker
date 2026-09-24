namespace WorkTracker.Core.Enums;

public enum WorkTaskStatus
{
    Todo = 0,
    InProgress = 1,
    Done = 2,
    Completed = 2,
    Overdue = 3,
    InReview = 4,
    Review = 4
}

public enum TaskPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum ProjectStatus
{
    Active = 0,
    Completed = 1,
    Archived = 2
}
