namespace WorkTracker.Core.DTOs;

public class DatabaseModuleStatsDto
{
    public int TasksCount { get; set; }
    public int SessionsCount { get; set; }
    public int AttendancesCount { get; set; }
    public int DailyCheckInsCount { get; set; }
    public int NotesCount { get; set; }
    public int NoteAttachmentsCount { get; set; }
    public int TicketsCount { get; set; }
    public int TicketCommentsCount { get; set; }
    public int RewardClaimsCount { get; set; }
    public int UserBadgesCount { get; set; }
    public int AuditLogsCount { get; set; }
    public int ImportLogsCount { get; set; }
    public int SqlHistoriesCount { get; set; }
    public int JsonHistoriesCount { get; set; }

    public int TotalTasksAndSessions => TasksCount + SessionsCount;
    public int TotalAttendance => AttendancesCount + DailyCheckInsCount;
    public int TotalNotes => NotesCount + NoteAttachmentsCount;
    public int TotalTickets => TicketsCount + TicketCommentsCount;
    public int TotalGamification => RewardClaimsCount + UserBadgesCount;
    public int TotalLogs => AuditLogsCount + ImportLogsCount + SqlHistoriesCount + JsonHistoriesCount;
    public int GrandTotalRecords => TotalTasksAndSessions + TotalAttendance + TotalNotes + TotalTickets + TotalGamification + TotalLogs;
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}

public class PurgePartialRequestDto
{
    public List<string> Modules { get; set; } = new List<string>();
    public string? ConfirmationText { get; set; }
}

public class PurgeFullRequestDto
{
    public string? ConfirmationText { get; set; }
    public bool ResetUserPoints { get; set; } = true;
}

public class PurgeResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, int> DeletedCounts { get; set; } = new Dictionary<string, int>();
    public int TotalDeletedRows { get; set; }
    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
}
