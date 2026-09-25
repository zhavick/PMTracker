namespace WorkTracker.Core.DTOs;

public class SyncPingResponseDto
{
    public bool IsOnline { get; set; } = true;
    public string HostName { get; set; } = string.Empty;
    public string AppVersion { get; set; } = "v3.6";
    public string DatabaseType { get; set; } = "MySQL 8.4 LTS";
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;
    public int TotalCompanies { get; set; }
    public int TotalProjects { get; set; }
    public int TotalTasks { get; set; }
    public int TotalSessions { get; set; }
    public int TotalAttendances { get; set; }
    public int TotalNotes { get; set; }
    public int TotalTickets { get; set; }
    public int TotalUsers { get; set; }
    public int TotalBadges { get; set; }
    public int TotalRewardClaims { get; set; }
    public int TotalUploadFiles { get; set; }
    public long TotalUploadsSizeBytes { get; set; }
    public string TotalUploadsFormatted { get; set; } = "0 B";
    public string Message { get; set; } = "Sync node active and reachable.";
}

public class SyncSettingsDto
{
    public string TargetHostUrl { get; set; } = "https://tracker.saidilmuna.space";
    public string? ApiKey { get; set; } = "TrackerKerja_Default_Sync_Secret_Key_2026!";
    public string? BearerToken { get; set; }
    public string Role { get; set; } = "Child Node";
    public DateTime? LastSyncAt { get; set; }
    public string? LastSyncStatus { get; set; }
    public bool CleanBeforeSyncDefault { get; set; } = false;
    public bool BackupBeforeSyncDefault { get; set; } = true;
    public bool SyncFilesDefault { get; set; } = true;
}

public class SyncPushRequestDto
{
    public string TargetHostUrl { get; set; } = "https://tracker.saidilmuna.space";
    public string? ApiKey { get; set; }
    public string? BearerToken { get; set; }
    public bool CleanBeforeSync { get; set; } = false;
    public bool BackupBeforeSync { get; set; } = true;
    public bool SyncFiles { get; set; } = true;
    public string? SourceLabel { get; set; }
}

public class SyncPullRequestDto
{
    public string TargetHostUrl { get; set; } = "https://tracker.saidilmuna.space";
    public string? ApiKey { get; set; }
    public string? BearerToken { get; set; }
    public bool CleanBeforeSync { get; set; } = false;
    public bool BackupBeforeSync { get; set; } = true;
    public bool SyncFiles { get; set; } = true;
}

public class SyncReceiveRequestDto
{
    public bool CleanBeforeSync { get; set; }
    public bool BackupBeforeSync { get; set; }
    public string? SourceInstanceUrl { get; set; }
    public string? SourceLabel { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? SqlScript { get; set; }
    public Dictionary<string, int?>? RecordCounts { get; set; }
    public string? FilesZipBase64 { get; set; }
    public bool IncludeFiles { get; set; }
    public int FilesCount { get; set; }
    public long FilesSizeBytes { get; set; }
}

public class SyncResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int ExecutedStatementsCount { get; set; }
    public List<string> AffectedTables { get; set; } = new();
    public Dictionary<string, int> FinalTableStats { get; set; } = new();
    public int SyncedFilesCount { get; set; }
    public long SyncedFilesSizeBytes { get; set; }
    public string SyncedFilesSizeFormatted { get; set; } = "0 B";
    public long ExecutionDurationMs { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? BackupFileName { get; set; }
    public string? ErrorDetails { get; set; }
}
