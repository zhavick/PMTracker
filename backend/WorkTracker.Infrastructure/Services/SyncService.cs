using System.IO.Compression;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Infrastructure.Services;

public interface ISyncService
{
    Task<SyncPingResponseDto> PingHostAsync(string hostUrl, string? apiKey = null, string? bearerToken = null);
    Task<SyncPingResponseDto> GetLocalStatusAsync();
    Task<SyncSettingsDto> GetSettingsAsync();
    Task<SyncSettingsDto> SaveSettingsAsync(SyncSettingsDto dto);
    Task<string> ExportSqlDumpAsync(bool cleanBeforeSync = true);
    Task<byte[]> ExportPackageZipAsync(bool cleanBeforeSync = true);
    Task<SyncResultDto> ImportSqlScriptAsync(string sqlScript, bool backupBeforeSync = true);
    Task<SyncResultDto> ImportPackageZipAsync(Stream zipStream, bool cleanBeforeSync = true, bool backupBeforeSync = true);
    Task<SyncResultDto> PushToHostAsync(SyncPushRequestDto dto, string? currentUserId = null);
    Task<SyncResultDto> PullFromHostAsync(SyncPullRequestDto dto, string? currentUserId = null);
    Task<SyncResultDto> ReceivePayloadAsync(SyncReceiveRequestDto dto);
}

public class SyncService : ISyncService
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SyncService> _logger;

    public SyncService(
        AppDbContext context,
        IHttpClientFactory httpClientFactory,
        ILogger<SyncService> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<SyncPingResponseDto> PingHostAsync(string hostUrl, string? apiKey = null, string? bearerToken = null)
    {
        var targetUrl = (hostUrl ?? "https://tracker.saidilmuna.space").TrimEnd('/');
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(15);

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Sync-ApiKey", apiKey);
        }

        if (!string.IsNullOrWhiteSpace(bearerToken))
        {
            var cleanToken = bearerToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? bearerToken.Substring(7).Trim()
                : bearerToken.Trim();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", cleanToken);
        }

        try
        {
            var pingRes = await client.GetAsync($"{targetUrl}/api/sync/ping");
            if (pingRes.IsSuccessStatusCode)
            {
                var content = await pingRes.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                // Handle nested ApiResponse structure
                JsonElement dataElement = root;
                if (root.TryGetProperty("data", out var dEl) && dEl.ValueKind == JsonValueKind.Object)
                {
                    dataElement = dEl;
                }

                return new SyncPingResponseDto
                {
                    IsOnline = true,
                    HostName = dataElement.TryGetProperty("hostName", out var hn) ? hn.GetString() ?? targetUrl : targetUrl,
                    AppVersion = dataElement.TryGetProperty("appVersion", out var av) ? av.GetString() ?? "v3.1" : "v3.1",
                    DatabaseType = dataElement.TryGetProperty("databaseType", out var dt) ? dt.GetString() ?? "Host Database" : "Host Database",
                    ServerTime = dataElement.TryGetProperty("serverTime", out var st) && st.TryGetDateTime(out var dtVal) ? dtVal : DateTime.UtcNow,
                    TotalTasks = dataElement.TryGetProperty("totalTasks", out var tt) && tt.TryGetInt32(out var ttVal) ? ttVal : 0,
                    TotalSessions = dataElement.TryGetProperty("totalSessions", out var ts) && ts.TryGetInt32(out var tsVal) ? tsVal : 0,
                    TotalProjects = dataElement.TryGetProperty("totalProjects", out var tp) && tp.TryGetInt32(out var tpVal) ? tpVal : 0,
                    TotalUsers = dataElement.TryGetProperty("totalUsers", out var tu) && tu.TryGetInt32(out var tuVal) ? tuVal : 0,
                    TotalUploadFiles = dataElement.TryGetProperty("totalUploadFiles", out var tuf) && tuf.TryGetInt32(out var tufVal) ? tufVal : 0,
                    TotalUploadsSizeBytes = dataElement.TryGetProperty("totalUploadsSizeBytes", out var tus) && tus.TryGetInt64(out var tusVal) ? tusVal : 0,
                    TotalUploadsFormatted = dataElement.TryGetProperty("totalUploadsFormatted", out var tufm) ? tufm.GetString() ?? "0 B" : "0 B",
                    Message = dataElement.TryGetProperty("message", out var msg) ? msg.GetString() ?? "Host Online" : "Host Online"
                };
            }

            return new SyncPingResponseDto
            {
                IsOnline = false,
                HostName = targetUrl,
                Message = $"Host merespons dengan HTTP {(int)pingRes.StatusCode} ({pingRes.ReasonPhrase})."
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Ping failed for host {Host}", targetUrl);
            return new SyncPingResponseDto
            {
                IsOnline = false,
                HostName = targetUrl,
                Message = $"Gagal menghubungi host: {ex.Message}"
            };
        }
    }

    public async Task<SyncPingResponseDto> GetLocalStatusAsync()
    {
        var totalCompanies = await _context.Companies.CountAsync();
        var totalProjects = await _context.Projects.CountAsync();
        var totalTasks = await _context.Tasks.CountAsync();
        var totalSessions = await _context.Sessions.CountAsync();
        var totalAttendances = await _context.Attendances.CountAsync();
        var totalNotes = await _context.Notes.CountAsync();
        var totalTickets = await _context.Tickets.CountAsync();
        var totalUsers = await _context.Users.CountAsync();
        var totalBadges = await _context.MasterBadges.CountAsync();
        var totalRewardClaims = await _context.RewardClaims.CountAsync();

        var uploadsPath = GetUploadsPhysicalPath();
        int fileCount = 0;
        long totalBytes = 0;

        if (Directory.Exists(uploadsPath))
        {
            var files = Directory.GetFiles(uploadsPath, "*.*", SearchOption.AllDirectories);
            fileCount = files.Length;
            foreach (var f in files)
            {
                try
                {
                    totalBytes += new FileInfo(f).Length;
                }
                catch { }
            }
        }

        return new SyncPingResponseDto
        {
            IsOnline = true,
            HostName = $"{Environment.MachineName} (Local Node)",
            AppVersion = "v3.6",
            DatabaseType = "MySQL 8.4 LTS",
            ServerTime = DateTime.UtcNow,
            TotalCompanies = totalCompanies,
            TotalProjects = totalProjects,
            TotalTasks = totalTasks,
            TotalSessions = totalSessions,
            TotalAttendances = totalAttendances,
            TotalNotes = totalNotes,
            TotalTickets = totalTickets,
            TotalUsers = totalUsers,
            TotalBadges = totalBadges,
            TotalRewardClaims = totalRewardClaims,
            TotalUploadFiles = fileCount,
            TotalUploadsSizeBytes = totalBytes,
            TotalUploadsFormatted = FormatBytes(totalBytes),
            Message = "Seluruh modul database lokal siap untuk proses replikasi / sinkronisasi."
        };
    }

    public async Task<SyncSettingsDto> GetSettingsAsync()
    {
        var settings = await _context.SystemSettings.ToDictionaryAsync(s => s.Key, s => s.Value);

        return new SyncSettingsDto
        {
            TargetHostUrl = settings.GetValueOrDefault("Sync_TargetHostUrl", "https://tracker.saidilmuna.space"),
            ApiKey = settings.GetValueOrDefault("Sync_ApiKey", "TrackerKerja_Default_Sync_Secret_Key_2026!"),
            BearerToken = settings.GetValueOrDefault("Sync_BearerToken", ""),
            Role = settings.GetValueOrDefault("Sync_Role", "Child Node"),
            LastSyncAt = settings.TryGetValue("Sync_LastSyncAt", out var lastSyncStr) && DateTime.TryParse(lastSyncStr, out var lastSync) ? lastSync : null,
            LastSyncStatus = settings.GetValueOrDefault("Sync_LastSyncStatus", "Belum pernah disinkronkan"),
            CleanBeforeSyncDefault = settings.GetValueOrDefault("Sync_CleanBeforeSyncDefault", "false").Equals("true", StringComparison.OrdinalIgnoreCase),
            BackupBeforeSyncDefault = settings.GetValueOrDefault("Sync_BackupBeforeSyncDefault", "true").Equals("true", StringComparison.OrdinalIgnoreCase),
            SyncFilesDefault = settings.GetValueOrDefault("Sync_SyncFilesDefault", "true").Equals("true", StringComparison.OrdinalIgnoreCase)
        };
    }

    public async Task<SyncSettingsDto> SaveSettingsAsync(SyncSettingsDto dto)
    {
        await SetSettingAsync("Sync_TargetHostUrl", dto.TargetHostUrl ?? "https://tracker.saidilmuna.space");
        await SetSettingAsync("Sync_ApiKey", dto.ApiKey ?? "");
        await SetSettingAsync("Sync_BearerToken", dto.BearerToken ?? "");
        await SetSettingAsync("Sync_Role", dto.Role ?? "Child Node");
        await SetSettingAsync("Sync_CleanBeforeSyncDefault", dto.CleanBeforeSyncDefault ? "true" : "false");
        await SetSettingAsync("Sync_BackupBeforeSyncDefault", dto.BackupBeforeSyncDefault ? "true" : "false");
        await SetSettingAsync("Sync_SyncFilesDefault", dto.SyncFilesDefault ? "true" : "false");

        await _context.SaveChangesAsync();
        return await GetSettingsAsync();
    }

    public async Task<string> ExportSqlDumpAsync(bool cleanBeforeSync = true)
    {
        var sb = new StringBuilder();
        sb.AppendLine("-- ============================================================");
        sb.AppendLine($"-- Work Tracker Pro Synchronize SQL Dump (All Modules)");
        sb.AppendLine($"-- Generated at (UTC): {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"-- Source Machine: {Environment.MachineName}");
        sb.AppendLine("-- ============================================================");
        sb.AppendLine();
        sb.AppendLine("SET FOREIGN_KEY_CHECKS = 0;");
        sb.AppendLine("SET NAMES utf8mb4;");
        sb.AppendLine();

        // 1. Clean tables in reverse dependency order if cleanBeforeSync requested
        if (cleanBeforeSync)
        {
            var tablesToClean = new[]
            {
                "JsonHistories", "SqlHistories", "ImportLogs", "AuditLogs",
                "EmailTemplates", "SystemSettings", "RewardClaims", "UserBadges",
                "TicketComments", "Tickets", "NoteAttachments", "Notes",
                "Attendances", "Sessions", "Tasks", "Projects", "Categories",
                "Companies", "MasterBadges", "MasterHolidays", "MasterStatuses",
                "MasterPriorities", "MasterMilestones"
            };

            foreach (var tbl in tablesToClean)
            {
                sb.AppendLine($"DELETE FROM `{tbl}`;");
            }
            sb.AppendLine();
        }

        // 2. Modul Master Data & Referensi
        await AppendTableDataAsync(sb, "Companies", "Id, Name, Code, Description, Address, ContactEmail, CreatedAt", 
            await _context.Companies.AsNoTracking().ToListAsync(), c =>
            $"({c.Id}, {SqlStr(c.Name)}, {SqlNullableStr(c.Code)}, {SqlNullableStr(c.Description)}, {SqlNullableStr(c.Address)}, {SqlNullableStr(c.ContactEmail)}, {SqlDate(c.CreatedAt)})");

        await AppendTableDataAsync(sb, "MasterStatuses", "Id, Name, Color, IsDoneState, OrderIndex, Description, IsDefault", 
            await _context.MasterStatuses.AsNoTracking().ToListAsync(), s =>
            $"({s.Id}, {SqlStr(s.Name)}, {SqlStr(s.Color)}, {SqlBool(s.IsDoneState)}, {s.OrderIndex}, {SqlNullableStr(s.Description)}, {SqlBool(s.IsDefault)})");

        await AppendTableDataAsync(sb, "MasterPriorities", "Id, Name, Color, Icon, OrderIndex, Description, IsDefault", 
            await _context.MasterPriorities.AsNoTracking().ToListAsync(), p =>
            $"({p.Id}, {SqlStr(p.Name)}, {SqlStr(p.Color)}, {SqlStr(p.Icon)}, {p.OrderIndex}, {SqlNullableStr(p.Description)}, {SqlBool(p.IsDefault)})");

        await AppendTableDataAsync(sb, "MasterMilestones", "Id, Name, Phase, Color, Icon, OrderIndex, Description, IsDefault", 
            await _context.MasterMilestones.AsNoTracking().ToListAsync(), m =>
            $"({m.Id}, {SqlStr(m.Name)}, {SqlStr(m.Phase)}, {SqlStr(m.Color)}, {SqlStr(m.Icon)}, {m.OrderIndex}, {SqlNullableStr(m.Description)}, {SqlBool(m.IsDefault)})");

        await AppendTableDataAsync(sb, "Categories", "Id, Name, Color, Description", 
            await _context.Categories.AsNoTracking().ToListAsync(), c =>
            $"({c.Id}, {SqlStr(c.Name)}, {SqlStr(c.Color)}, {SqlNullableStr(c.Description)})");

        await AppendTableDataAsync(sb, "MasterBadges", "Id, Code, Name, Description, Category, Icon, Color, Points, Rarity, TriggerType, TriggerThreshold, IsActive, OrderIndex, CreatedAt", 
            await _context.MasterBadges.AsNoTracking().ToListAsync(), b =>
            $"({b.Id}, {SqlStr(b.Code)}, {SqlStr(b.Name)}, {SqlStr(b.Description)}, {SqlStr(b.Category)}, {SqlStr(b.Icon)}, {SqlStr(b.Color)}, {b.Points}, {(int)b.Rarity}, {(int)b.TriggerType}, {b.TriggerThreshold}, {SqlBool(b.IsActive)}, {b.OrderIndex}, {SqlDate(b.CreatedAt)})");

        await AppendTableDataAsync(sb, "MasterHolidays", "Id, Name, Date, HolidayType, Color, Icon, Description, IsRecurringYearly, IsActive, CreatedAt", 
            await _context.MasterHolidays.AsNoTracking().ToListAsync(), h =>
            $"({h.Id}, {SqlStr(h.Name)}, '{h.Date:yyyy-MM-dd}', {SqlStr(h.HolidayType)}, {SqlStr(h.Color)}, {SqlStr(h.Icon)}, {SqlNullableStr(h.Description)}, {SqlBool(h.IsRecurringYearly)}, {SqlBool(h.IsActive)}, {SqlDate(h.CreatedAt)})");

        // 3. Modul Pengguna & Akun (AspNetUsers & AspNetRoles) menggunakan INSERT IGNORE agar tidak menimpa kredensial aktif jika sudah ada
        var roles = await _context.Roles.AsNoTracking().ToListAsync();
        if (roles.Count > 0)
        {
            sb.AppendLine($"-- Table: AspNetRoles ({roles.Count} records)");
            foreach (var r in roles)
            {
                sb.AppendLine($"INSERT IGNORE INTO `AspNetRoles` (`Id`, `Name`, `NormalizedName`, `ConcurrencyStamp`) VALUES ({SqlStr(r.Id)}, {SqlStr(r.Name)}, {SqlStr(r.NormalizedName)}, {SqlNullableStr(r.ConcurrencyStamp)});");
            }
            sb.AppendLine();
        }

        var users = await _context.Users.AsNoTracking().ToListAsync();
        if (users.Count > 0)
        {
            sb.AppendLine($"-- Table: AspNetUsers ({users.Count} records)");
            foreach (var u in users)
            {
                sb.AppendLine($"INSERT INTO `AspNetUsers` (`Id`, `UserName`, `NormalizedUserName`, `Email`, `NormalizedEmail`, `EmailConfirmed`, `PasswordHash`, `SecurityStamp`, `ConcurrencyStamp`, `PhoneNumber`, `PhoneNumberConfirmed`, `TwoFactorEnabled`, `LockoutEnd`, `LockoutEnabled`, `AccessFailedCount`, `FullName`, `JobTitle`, `AvatarColor`, `ProfilePictureUrl`, `CoverPictureUrl`, `CompanyId`, `IsApproved`, `ApprovedAt`, `ApprovedByUserId`, `RejectionReason`, `CreatedAt`) " +
                              $"VALUES ({SqlStr(u.Id)}, {SqlStr(u.UserName)}, {SqlStr(u.NormalizedUserName)}, {SqlStr(u.Email)}, {SqlStr(u.NormalizedEmail)}, {SqlBool(u.EmailConfirmed)}, {SqlNullableStr(u.PasswordHash)}, {SqlNullableStr(u.SecurityStamp)}, {SqlNullableStr(u.ConcurrencyStamp)}, {SqlNullableStr(u.PhoneNumber)}, {SqlBool(u.PhoneNumberConfirmed)}, {SqlBool(u.TwoFactorEnabled)}, {SqlDate(u.LockoutEnd?.UtcDateTime)}, {SqlBool(u.LockoutEnabled)}, {u.AccessFailedCount}, {SqlStr(u.FullName)}, {SqlStr(u.JobTitle)}, {SqlStr(u.AvatarColor)}, {SqlNullableStr(u.ProfilePictureUrl)}, {SqlNullableStr(u.CoverPictureUrl)}, {SqlNullableInt(u.CompanyId)}, {SqlBool(u.IsApproved)}, {SqlDate(u.ApprovedAt)}, {SqlNullableStr(u.ApprovedByUserId)}, {SqlNullableStr(u.RejectionReason)}, {SqlDate(u.CreatedAt)}) " +
                              $"ON DUPLICATE KEY UPDATE `FullName` = VALUES(`FullName`), `JobTitle` = VALUES(`JobTitle`), `AvatarColor` = VALUES(`AvatarColor`), `CompanyId` = VALUES(`CompanyId`), `IsApproved` = VALUES(`IsApproved`);");
            }
            sb.AppendLine();
        }

        var userRoles = await _context.UserRoles.AsNoTracking().ToListAsync();
        if (userRoles.Count > 0)
        {
            sb.AppendLine($"-- Table: AspNetUserRoles ({userRoles.Count} records)");
            foreach (var ur in userRoles)
            {
                sb.AppendLine($"INSERT IGNORE INTO `AspNetUserRoles` (`UserId`, `RoleId`) VALUES ({SqlStr(ur.UserId)}, {SqlStr(ur.RoleId)});");
            }
            sb.AppendLine();
        }

        // 4. Modul Manajemen Proyek (Projects)
        await AppendTableDataAsync(sb, "Projects", "Id, Name, Description, Color, Deadline, Status, CompanyId, CreatedAt", 
            await _context.Projects.AsNoTracking().ToListAsync(), p =>
            $"({p.Id}, {SqlStr(p.Name)}, {SqlNullableStr(p.Description)}, {SqlStr(p.Color)}, {SqlDate(p.Deadline)}, {(int)p.Status}, {SqlNullableInt(p.CompanyId)}, {SqlDate(p.CreatedAt)})");

        // 5. Modul Tugas Kerja (Tasks)
        await AppendTableDataAsync(sb, "Tasks", "Id, Title, Description, Status, Priority, Progress, ProjectId, CategoryId, CompanyId, AssignedToUserId, ParentTaskId, Milestone, Obstacle, Solution, StartDate, DueDate, Tags, CreatedAt, UpdatedAt", 
            await _context.Tasks.AsNoTracking().ToListAsync(), t =>
            $"({t.Id}, {SqlStr(t.Title)}, {SqlNullableStr(t.Description)}, {(int)t.Status}, {(int)t.Priority}, {t.Progress}, {SqlNullableInt(t.ProjectId)}, {SqlNullableInt(t.CategoryId)}, {SqlNullableInt(t.CompanyId)}, {SqlNullableStr(t.AssignedToUserId)}, {SqlNullableInt(t.ParentTaskId)}, {SqlNullableStr(t.Milestone)}, {SqlNullableStr(t.Obstacle)}, {SqlNullableStr(t.Solution)}, {SqlDate(t.StartDate)}, {SqlDate(t.DueDate)}, {SqlNullableStr(t.Tags)}, {SqlDate(t.CreatedAt)}, {SqlDate(t.UpdatedAt)})");

        // 6. Modul Sesi Jam Kerja / Timesheets (Sessions)
        await AppendTableDataAsync(sb, "Sessions", "Id, TaskId, UserId, StartTime, EndTime, Duration, Notes", 
            await _context.Sessions.AsNoTracking().ToListAsync(), s =>
            $"({s.Id}, {s.TaskId}, {SqlNullableStr(s.UserId)}, {SqlDate(s.StartTime)}, {SqlDate(s.EndTime)}, {s.Duration}, {SqlNullableStr(s.Notes)})");

        // 7. Modul Absensi / Attendance (Attendances)
        await AppendTableDataAsync(sb, "Attendances", "Id, UserId, Date, Type, WorkLocation, ClockIn, ClockOut, TotalHours, LeaveReason, Notes, Location, Status, ApprovedByUserId, CreatedAt, UpdatedAt", 
            await _context.Attendances.AsNoTracking().ToListAsync(), a =>
            $"({a.Id}, {SqlStr(a.UserId)}, {SqlDate(a.Date)}, {(int)a.Type}, {(int)a.WorkLocation}, {SqlDate(a.ClockIn)}, {SqlDate(a.ClockOut)}, {a.TotalHours.ToString(System.Globalization.CultureInfo.InvariantCulture)}, {SqlNullableStr(a.LeaveReason)}, {SqlNullableStr(a.Notes)}, {SqlNullableStr(a.Location)}, {(int)a.Status}, {SqlNullableStr(a.ApprovedByUserId)}, {SqlDate(a.CreatedAt)}, {SqlDate(a.UpdatedAt)})");

        // 8. Modul Catatan & Dokumentasi Teknis (Notes & NoteAttachments)
        await AppendTableDataAsync(sb, "Notes", "Id, Title, ContentHtml, Category, Color, IsPinned, AuthorUserId, TaskId, CompanyId, CreatedAt, UpdatedAt", 
            await _context.Notes.AsNoTracking().ToListAsync(), n =>
            $"({n.Id}, {SqlStr(n.Title)}, {SqlStr(n.ContentHtml)}, {SqlNullableStr(n.Category)}, {SqlNullableStr(n.Color)}, {SqlBool(n.IsPinned)}, {SqlNullableStr(n.AuthorUserId)}, {SqlNullableInt(n.TaskId)}, {SqlNullableInt(n.CompanyId)}, {SqlDate(n.CreatedAt)}, {SqlDate(n.UpdatedAt)})");

        await AppendTableDataAsync(sb, "NoteAttachments", "Id, NoteId, FileName, FilePath, FileSize, ContentType, FileExtension, UploadedByUserId, UploadedAt", 
            await _context.NoteAttachments.AsNoTracking().ToListAsync(), na =>
            $"({na.Id}, {na.NoteId}, {SqlStr(na.FileName)}, {SqlStr(na.FilePath)}, {na.FileSize}, {SqlNullableStr(na.ContentType)}, {SqlNullableStr(na.FileExtension)}, {SqlNullableStr(na.UploadedByUserId)}, {SqlDate(na.UploadedAt)})");

        // 9. Modul Tiket Bantuan & Helpdesk (Tickets & TicketComments)
        await AppendTableDataAsync(sb, "Tickets", "Id, TicketNumber, Title, Description, Category, Priority, Status, ProjectId, CreatedByUserId, AssignedToUserId, ResolutionNotes, ResolvedAt, ClosedAt, CreatedAt, UpdatedAt", 
            await _context.Tickets.AsNoTracking().ToListAsync(), tk =>
            $"({tk.Id}, {SqlStr(tk.TicketNumber)}, {SqlStr(tk.Title)}, {SqlStr(tk.Description)}, {(int)tk.Category}, {(int)tk.Priority}, {(int)tk.Status}, {SqlNullableInt(tk.ProjectId)}, {SqlStr(tk.CreatedByUserId)}, {SqlNullableStr(tk.AssignedToUserId)}, {SqlNullableStr(tk.ResolutionNotes)}, {SqlDate(tk.ResolvedAt)}, {SqlDate(tk.ClosedAt)}, {SqlDate(tk.CreatedAt)}, {SqlDate(tk.UpdatedAt)})");

        await AppendTableDataAsync(sb, "TicketComments", "Id, TicketId, UserId, Message, IsInternal, CreatedAt", 
            await _context.TicketComments.AsNoTracking().ToListAsync(), tc =>
            $"({tc.Id}, {tc.TicketId}, {SqlStr(tc.UserId)}, {SqlStr(tc.Message)}, {SqlBool(tc.IsInternal)}, {SqlDate(tc.CreatedAt)})");

        // 10. Modul Gamifikasi (UserBadges & RewardClaims)
        await AppendTableDataAsync(sb, "UserBadges", "Id, UserId, BadgeId, UnlockedAt, IsFeatured, AwardedBy", 
            await _context.UserBadges.AsNoTracking().ToListAsync(), ub =>
            $"({ub.Id}, {SqlStr(ub.UserId)}, {ub.BadgeId}, {SqlDate(ub.UnlockedAt)}, {SqlBool(ub.IsFeatured)}, {SqlNullableStr(ub.AwardedBy)})");

        await AppendTableDataAsync(sb, "RewardClaims", "Id, UserId, PointsClaimed, RupiahAmount, RewardType, AccountOrContactInfo, UserNotes, Status, AdminNotes, ProcessedByUserId, ProcessedAt, CreatedAt, UpdatedAt", 
            await _context.RewardClaims.AsNoTracking().ToListAsync(), rc =>
            $"({rc.Id}, {SqlStr(rc.UserId)}, {rc.PointsClaimed}, {rc.RupiahAmount.ToString(System.Globalization.CultureInfo.InvariantCulture)}, {(int)rc.RewardType}, {SqlStr(rc.AccountOrContactInfo)}, {SqlNullableStr(rc.UserNotes)}, {(int)rc.Status}, {SqlNullableStr(rc.AdminNotes)}, {SqlNullableStr(rc.ProcessedByUserId)}, {SqlDate(rc.ProcessedAt)}, {SqlDate(rc.CreatedAt)}, {SqlDate(rc.UpdatedAt)})");

        // 11. Modul Pengaturan Sistem & Email (SystemSettings & EmailTemplates)
        await AppendTableDataAsync(sb, "SystemSettings", "Key, Value, Description, UpdatedAt", 
            await _context.SystemSettings.AsNoTracking().ToListAsync(), ss =>
            $"({SqlStr(ss.Key)}, {SqlStr(ss.Value)}, {SqlNullableStr(ss.Description)}, {SqlDate(ss.UpdatedAt)})");

        await AppendTableDataAsync(sb, "EmailTemplates", "Id, EventCode, EventName, Category, Subject, BodyHtml, AvailableVariables, IsActive, CreatedAt, UpdatedAt, UpdatedByUserId", 
            await _context.EmailTemplates.AsNoTracking().ToListAsync(), et =>
            $"({et.Id}, {SqlStr(et.EventCode)}, {SqlStr(et.EventName)}, {SqlNullableStr(et.Category)}, {SqlStr(et.Subject)}, {SqlStr(et.BodyHtml)}, {SqlNullableStr(et.AvailableVariables)}, {SqlBool(et.IsActive)}, {SqlDate(et.CreatedAt)}, {SqlDate(et.UpdatedAt)}, {SqlNullableStr(et.UpdatedByUserId)})");

        // 12. Modul Riwayat Tools (SqlHistories & JsonHistories)
        await AppendTableDataAsync(sb, "SqlHistories", "Id, Name, Content, Dialect, TaskId, CreatedAt", 
            await _context.SqlHistories.AsNoTracking().ToListAsync(), sh =>
            $"({sh.Id}, {SqlStr(sh.Name)}, {SqlStr(sh.Content)}, {SqlStr(sh.Dialect)}, {SqlNullableInt(sh.TaskId)}, {SqlDate(sh.CreatedAt)})");

        await AppendTableDataAsync(sb, "JsonHistories", "Id, Name, Content, TaskId, CreatedAt", 
            await _context.JsonHistories.AsNoTracking().ToListAsync(), jh =>
            $"({jh.Id}, {SqlStr(jh.Name)}, {SqlStr(jh.Content)}, {SqlNullableInt(jh.TaskId)}, {SqlDate(jh.CreatedAt)})");

        sb.AppendLine("SET FOREIGN_KEY_CHECKS = 1;");
        return sb.ToString();
    }

    public async Task<byte[]> ExportPackageZipAsync(bool cleanBeforeSync = true)
    {
        var sqlContent = await ExportSqlDumpAsync(cleanBeforeSync);

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            // 1. Add SQL Dump
            var sqlEntry = archive.CreateEntry("database_dump.sql", CompressionLevel.Optimal);
            using (var entryStream = sqlEntry.Open())
            using (var writer = new StreamWriter(entryStream, Encoding.UTF8))
            {
                await writer.WriteAsync(sqlContent);
            }

            // 2. Add Manifest JSON
            var manifest = new
            {
                instanceId = Environment.MachineName,
                createdAtUtc = DateTime.UtcNow,
                version = "v3.6",
                databaseEngine = "MySQL 8.4 LTS",
                cleanBeforeSync,
                tables = new[]
                {
                    "Companies", "MasterStatuses", "MasterPriorities", "MasterMilestones",
                    "Categories", "MasterBadges", "MasterHolidays", "AspNetRoles", "AspNetUsers",
                    "AspNetUserRoles", "Projects", "Tasks", "Sessions", "Attendances",
                    "Notes", "NoteAttachments", "Tickets", "TicketComments", "UserBadges",
                    "RewardClaims", "SystemSettings", "EmailTemplates", "SqlHistories", "JsonHistories"
                }
            };
            var manifestEntry = archive.CreateEntry("manifest.json", CompressionLevel.Optimal);
            using (var entryStream = manifestEntry.Open())
            {
                await JsonSerializer.SerializeAsync(entryStream, manifest, new JsonSerializerOptions { WriteIndented = true });
            }

            // 3. Add Uploads files
            var uploadsDir = GetUploadsPhysicalPath();
            if (Directory.Exists(uploadsDir))
            {
                var files = Directory.GetFiles(uploadsDir, "*.*", SearchOption.AllDirectories);
                foreach (var file in files)
                {
                    var relativePath = Path.GetRelativePath(uploadsDir, file).Replace('\\', '/');
                    var fileEntry = archive.CreateEntry($"uploads/{relativePath}", CompressionLevel.Optimal);
                    using var fileStream = File.OpenRead(file);
                    using var entryStream = fileEntry.Open();
                    await fileStream.CopyToAsync(entryStream);
                }
            }
        }

        return memoryStream.ToArray();
    }

    public async Task<SyncResultDto> ImportSqlScriptAsync(string sqlScript, bool backupBeforeSync = true)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = new SyncResultDto { Timestamp = DateTime.UtcNow };

        if (string.IsNullOrWhiteSpace(sqlScript))
        {
            result.Success = false;
            result.Message = "Naskah SQL kosong.";
            return result;
        }

        string? backupFileName = null;
        if (backupBeforeSync)
        {
            backupFileName = await CreateLocalBackupSqlAsync();
            result.BackupFileName = backupFileName;
        }

        try
        {
            // Execute script within dedicated MySQL connection to avoid context connection state issues
            var connString = _context.Database.GetConnectionString();
            using var connection = new MySqlConnector.MySqlConnection(connString);
            await connection.OpenAsync();

            using var command = connection.CreateCommand();
            command.CommandTimeout = 300; // 5 minutes for large dumps

            // Split into statements
            var statements = SplitSqlStatements(sqlScript);
            int count = 0;

            // Turn off foreign key checks
            command.CommandText = "SET FOREIGN_KEY_CHECKS = 0;";
            await command.ExecuteNonQueryAsync();

            foreach (var stmt in statements)
            {
                if (string.IsNullOrWhiteSpace(stmt)) continue;

                try
                {
                    command.CommandText = stmt;
                    await command.ExecuteNonQueryAsync();
                    count++;
                }
                catch (Exception stmtEx)
                {
                    _logger.LogWarning("Error executing SQL statement during sync: {Stmt}. Error: {Msg}", stmt.Substring(0, Math.Min(100, stmt.Length)), stmtEx.Message);
                    // Lanjutkan statement lainnya agar sinkronisasi tidak berhenti total karena satu baris komentar/duplikasi
                }
            }

            // Re-enable foreign key checks
            command.CommandText = "SET FOREIGN_KEY_CHECKS = 1;";
            await command.ExecuteNonQueryAsync();

            sw.Stop();
            result.Success = true;
            result.ExecutedStatementsCount = count;
            result.ExecutionDurationMs = sw.ElapsedMilliseconds;
            result.Message = $"Sinkronisasi basis data berhasil dieksekusi ({count} pernyataan SQL berhasil diterapkan).";

            // Record audit log
            await RecordAuditLogAsync(null, "SyncImportSql", $"Impor SQL selesai. Statements: {count}, Durasi: {sw.ElapsedMilliseconds}ms");

            return result;
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Failed to execute sync SQL script");
            result.Success = false;
            result.Message = $"Gagal mengeksekusi SQL: {ex.Message}";
            result.ErrorDetails = ex.ToString();
            result.ExecutionDurationMs = sw.ElapsedMilliseconds;
            return result;
        }
    }

    public async Task<SyncResultDto> ImportPackageZipAsync(Stream zipStream, bool cleanBeforeSync = true, bool backupBeforeSync = true)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = new SyncResultDto { Timestamp = DateTime.UtcNow };

        try
        {
            using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);
            var sqlEntry = archive.GetEntry("database_dump.sql") 
                ?? archive.Entries.FirstOrDefault(e => e.Name.EndsWith(".sql", StringComparison.OrdinalIgnoreCase));

            if (sqlEntry == null)
            {
                result.Success = false;
                result.Message = "Berkas database_dump.sql tidak ditemukan dalam paket ZIP.";
                return result;
            }

            string sqlContent;
            using (var reader = new StreamReader(sqlEntry.Open(), Encoding.UTF8))
            {
                sqlContent = await reader.ReadToEndAsync();
            }

            // 1. Execute SQL
            var sqlRes = await ImportSqlScriptAsync(sqlContent, backupBeforeSync);
            if (!sqlRes.Success)
            {
                return sqlRes;
            }

            // 2. Extract uploads
            int syncedFiles = 0;
            long syncedBytes = 0;
            var uploadsDir = GetUploadsPhysicalPath();

            foreach (var entry in archive.Entries)
            {
                if (entry.FullName.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(entry.Name))
                {
                    var relativePath = entry.FullName.Substring("uploads/".Length);
                    var destFile = Path.Combine(uploadsDir, relativePath);
                    var destDir = Path.GetDirectoryName(destFile);

                    if (!string.IsNullOrEmpty(destDir) && !Directory.Exists(destDir))
                    {
                        Directory.CreateDirectory(destDir);
                    }

                    using var source = entry.Open();
                    using var dest = File.Create(destFile);
                    await source.CopyToAsync(dest);

                    syncedFiles++;
                    syncedBytes += entry.Length;
                }
            }

            sw.Stop();
            result.Success = true;
            result.Message = $"Paket sinkronisasi seluruh modul berhasil diterapkan ({sqlRes.ExecutedStatementsCount} pernyataan SQL, {syncedFiles} berkas uploads).";
            result.ExecutedStatementsCount = sqlRes.ExecutedStatementsCount;
            result.SyncedFilesCount = syncedFiles;
            result.SyncedFilesSizeBytes = syncedBytes;
            result.SyncedFilesSizeFormatted = FormatBytes(syncedBytes);
            result.ExecutionDurationMs = sw.ElapsedMilliseconds;
            result.BackupFileName = sqlRes.BackupFileName;

            await SetSettingAsync("Sync_LastSyncAt", DateTime.UtcNow.ToString("o"));
            await SetSettingAsync("Sync_LastSyncStatus", "Berhasil (Import ZIP Semua Modul)");
            await _context.SaveChangesAsync();

            return result;
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Failed to import zip package");
            result.Success = false;
            result.Message = $"Gagal mengekstrak paket ZIP: {ex.Message}";
            result.ErrorDetails = ex.ToString();
            result.ExecutionDurationMs = sw.ElapsedMilliseconds;
            return result;
        }
    }

    public async Task<SyncResultDto> PushToHostAsync(SyncPushRequestDto dto, string? currentUserId = null)
    {
        var targetHost = (dto.TargetHostUrl ?? "https://tracker.saidilmuna.space").TrimEnd('/');
        var sw = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _logger.LogInformation("Starting Push data to Host Induk {Host}", targetHost);

            // 1. Generate local SQL dump covering all modules
            var sqlDump = await ExportSqlDumpAsync(dto.CleanBeforeSync);

            // 2. Prepare files if requested
            string? filesZipBase64 = null;
            int fileCount = 0;
            long fileBytes = 0;

            if (dto.SyncFiles)
            {
                var packageBytes = await ExportPackageZipAsync(dto.CleanBeforeSync);
                filesZipBase64 = Convert.ToBase64String(packageBytes);
                fileBytes = packageBytes.Length;
                fileCount = 1;
            }

            var payload = new SyncReceiveRequestDto
            {
                CleanBeforeSync = dto.CleanBeforeSync,
                BackupBeforeSync = dto.BackupBeforeSync,
                SourceInstanceUrl = $"http://localhost:5000",
                SourceLabel = dto.SourceLabel ?? Environment.MachineName,
                Timestamp = DateTime.UtcNow,
                SqlScript = sqlDump,
                IncludeFiles = dto.SyncFiles,
                FilesZipBase64 = filesZipBase64,
                FilesCount = fileCount,
                FilesSizeBytes = fileBytes
            };

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromMinutes(5);

            if (!string.IsNullOrWhiteSpace(dto.ApiKey))
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation("X-Sync-ApiKey", dto.ApiKey);
            }

            if (!string.IsNullOrWhiteSpace(dto.BearerToken))
            {
                var cleanToken = dto.BearerToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                    ? dto.BearerToken.Substring(7).Trim()
                    : dto.BearerToken.Trim();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", cleanToken);
            }

            var response = await client.PostAsJsonAsync($"{targetHost}/api/sync/receive", payload);
            sw.Stop();

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<ApiResponse<SyncResultDto>>();
                var resData = result?.Data ?? new SyncResultDto { Success = true, Message = "Push seluruh modul berhasil diterima Host Induk." };
                resData.ExecutionDurationMs = sw.ElapsedMilliseconds;

                await SetSettingAsync("Sync_LastSyncAt", DateTime.UtcNow.ToString("o"));
                await SetSettingAsync("Sync_LastSyncStatus", "Berhasil (Push ke Host Induk)");
                await _context.SaveChangesAsync();

                await RecordAuditLogAsync(currentUserId, "SyncPush", $"Push seluruh data modul ke Host Induk {targetHost} sukses. Durasi: {sw.ElapsedMilliseconds}ms");
                return resData;
            }

            var errText = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Push to host {Host} failed with HTTP {Status}: {Body}", targetHost, response.StatusCode, errText);

            return new SyncResultDto
            {
                Success = false,
                Message = $"Host Induk menolak request (HTTP {(int)response.StatusCode}): {errText}",
                ExecutionDurationMs = sw.ElapsedMilliseconds
            };
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Exception during push to {Host}", targetHost);
            return new SyncResultDto
            {
                Success = false,
                Message = $"Gagal mengirimkan sinkronisasi ke Host Induk: {ex.Message}",
                ErrorDetails = ex.ToString(),
                ExecutionDurationMs = sw.ElapsedMilliseconds
            };
        }
    }

    public async Task<SyncResultDto> PullFromHostAsync(SyncPullRequestDto dto, string? currentUserId = null)
    {
        var targetHost = (dto.TargetHostUrl ?? "https://tracker.saidilmuna.space").TrimEnd('/');
        var sw = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _logger.LogInformation("Starting Pull data from Host Induk {Host}", targetHost);
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromMinutes(5);

            if (!string.IsNullOrWhiteSpace(dto.ApiKey))
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation("X-Sync-ApiKey", dto.ApiKey);
            }

            if (!string.IsNullOrWhiteSpace(dto.BearerToken))
            {
                var cleanToken = dto.BearerToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                    ? dto.BearerToken.Substring(7).Trim()
                    : dto.BearerToken.Trim();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", cleanToken);
            }

            // Decide whether to pull package or sql
            var endpoint = dto.SyncFiles
                ? $"{targetHost}/api/sync/export-package?cleanBeforeSync={dto.CleanBeforeSync.ToString().ToLower()}"
                : $"{targetHost}/api/sync/export-sql?cleanBeforeSync={dto.CleanBeforeSync.ToString().ToLower()}";

            var response = await client.GetAsync(endpoint);
            if (!response.IsSuccessStatusCode)
            {
                sw.Stop();
                var errText = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Pull from host {Host} failed: HTTP {Code}: {Body}", targetHost, response.StatusCode, errText);

                return new SyncResultDto
                {
                    Success = false,
                    Message = $"Gagal mengambil data dari Host Induk (HTTP {(int)response.StatusCode}): {errText}",
                    ExecutionDurationMs = sw.ElapsedMilliseconds
                };
            }

            SyncResultDto importResult;
            if (dto.SyncFiles)
            {
                using var stream = await response.Content.ReadAsStreamAsync();
                importResult = await ImportPackageZipAsync(stream, dto.CleanBeforeSync, dto.BackupBeforeSync);
            }
            else
            {
                var sqlScript = await response.Content.ReadAsStringAsync();
                importResult = await ImportSqlScriptAsync(sqlScript, dto.BackupBeforeSync);
            }

            sw.Stop();
            importResult.ExecutionDurationMs = sw.ElapsedMilliseconds;

            if (importResult.Success)
            {
                await SetSettingAsync("Sync_LastSyncAt", DateTime.UtcNow.ToString("o"));
                await SetSettingAsync("Sync_LastSyncStatus", "Berhasil (Pull dari Host Induk)");
                await _context.SaveChangesAsync();

                await RecordAuditLogAsync(currentUserId, "SyncPull", $"Pull data dari Host Induk {targetHost} sukses. Durasi: {sw.ElapsedMilliseconds}ms");
            }

            return importResult;
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Exception during pull from {Host}", targetHost);
            return new SyncResultDto
            {
                Success = false,
                Message = $"Gagal menarik data dari Host Induk: {ex.Message}",
                ErrorDetails = ex.ToString(),
                ExecutionDurationMs = sw.ElapsedMilliseconds
            };
        }
    }

    public async Task<SyncResultDto> ReceivePayloadAsync(SyncReceiveRequestDto dto)
    {
        if (dto.IncludeFiles && !string.IsNullOrWhiteSpace(dto.FilesZipBase64))
        {
            var zipBytes = Convert.FromBase64String(dto.FilesZipBase64);
            using var ms = new MemoryStream(zipBytes);
            return await ImportPackageZipAsync(ms, dto.CleanBeforeSync, dto.BackupBeforeSync);
        }

        if (!string.IsNullOrWhiteSpace(dto.SqlScript))
        {
            return await ImportSqlScriptAsync(dto.SqlScript, dto.BackupBeforeSync);
        }

        return new SyncResultDto
        {
            Success = false,
            Message = "Payload sinkronisasi tidak memuat naskah SQL maupun berkas ZIP."
        };
    }

    // Helper Methods
    private async Task AppendTableDataAsync<T>(StringBuilder sb, string tableName, string columns, List<T> items, Func<T, string> rowFormatter)
    {
        if (items.Count == 0) return;

        sb.AppendLine($"-- Table: {tableName} ({items.Count} records)");
        const int batchSize = 100;
        for (int i = 0; i < items.Count; i += batchSize)
        {
            var batch = items.Skip(i).Take(batchSize).ToList();
            sb.Append($"REPLACE INTO `{tableName}` ({columns}) VALUES ");
            sb.Append(string.Join(",\n", batch.Select(rowFormatter)));
            sb.AppendLine(";");
        }
        sb.AppendLine();
    }

    private string GetUploadsPhysicalPath()
    {
        return Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
    }

    private string FormatBytes(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{(bytes / 1024.0):F2} KB";
        if (bytes < 1024 * 1024 * 1024) return $"{(bytes / (1024.0 * 1024.0)):F2} MB";
        return $"{(bytes / (1024.0 * 1024.0 * 1024.0)):F2} GB";
    }

    private async Task<string> CreateLocalBackupSqlAsync()
    {
        try
        {
            var backupDir = Path.Combine(Directory.GetCurrentDirectory(), "backups");
            if (!Directory.Exists(backupDir))
            {
                Directory.CreateDirectory(backupDir);
            }

            var fileName = $"backup_pre_sync_{DateTime.UtcNow:yyyyMMdd_HHmmss}.sql";
            var filePath = Path.Combine(backupDir, fileName);

            var sqlDump = await ExportSqlDumpAsync(false);
            await File.WriteAllTextAsync(filePath, sqlDump, Encoding.UTF8);

            return fileName;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create automatic local backup before sync");
            return "backup_failed.sql";
        }
    }

    private List<string> SplitSqlStatements(string script)
    {
        var statements = new List<string>();
        var currentStatement = new StringBuilder();
        var lines = script.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();

            // Skip comments and empty lines
            if (string.IsNullOrEmpty(line) || line.StartsWith("--") || line.StartsWith("/*") || line.StartsWith("//"))
            {
                continue;
            }

            currentStatement.AppendLine(rawLine);

            if (line.EndsWith(";"))
            {
                statements.Add(currentStatement.ToString().Trim());
                currentStatement.Clear();
            }
        }

        if (currentStatement.Length > 0)
        {
            var remaining = currentStatement.ToString().Trim();
            if (!string.IsNullOrEmpty(remaining))
            {
                statements.Add(remaining);
            }
        }

        return statements;
    }

    private async Task SetSettingAsync(string key, string val)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null)
        {
            _context.SystemSettings.Add(new SystemSetting
            {
                Key = key,
                Value = val,
                Description = "Sync Configuration",
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            setting.Value = val;
            setting.UpdatedAt = DateTime.UtcNow;
        }
    }

    private async Task RecordAuditLogAsync(string? userId, string action, string details)
    {
        try
        {
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                ActionName = action,
                ControllerName = "SyncApiController",
                HttpMethod = "POST",
                Path = "/api/sync",
                Details = details,
                Timestamp = DateTime.UtcNow,
                IpAddress = "127.0.0.1",
                StatusCode = 200
            });
            await _context.SaveChangesAsync();
        }
        catch { }
    }

    // SQL Value Escapers
    private string SqlStr(string? val) => val == null ? "NULL" : $"'{val.Replace("\\", "\\\\").Replace("'", "''")}'";
    private string? SqlNullableStr(string? val) => val == null ? "NULL" : $"'{val.Replace("\\", "\\\\").Replace("'", "''")}'";
    private string SqlBool(bool val) => val ? "1" : "0";
    private string SqlDate(DateTime val) => $"'{val:yyyy-MM-dd HH:mm:ss}'";
    private string SqlDate(DateTime? val) => val.HasValue ? $"'{val.Value:yyyy-MM-dd HH:mm:ss}'" : "NULL";
    private string SqlNullableInt(int? val) => val.HasValue ? val.Value.ToString() : "NULL";
    private string SqlNullableDouble(double? val) => val.HasValue ? val.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) : "NULL";
}
