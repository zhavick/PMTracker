using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/maintenance")]
[Authorize(Roles = "Admin")]
public class MaintenanceApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<MaintenanceApiController> _logger;

    public MaintenanceApiController(AppDbContext context, ILogger<MaintenanceApiController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = new DatabaseModuleStatsDto
        {
            TasksCount = await _context.Tasks.CountAsync(),
            SessionsCount = await _context.Sessions.CountAsync(),
            AttendancesCount = await _context.Attendances.CountAsync(),
            DailyCheckInsCount = await _context.DailyCheckIns.CountAsync(),
            NotesCount = await _context.Notes.CountAsync(),
            NoteAttachmentsCount = await _context.NoteAttachments.CountAsync(),
            TicketsCount = await _context.Tickets.CountAsync(),
            TicketCommentsCount = await _context.TicketComments.CountAsync(),
            RewardClaimsCount = await _context.RewardClaims.CountAsync(),
            UserBadgesCount = await _context.UserBadges.CountAsync(),
            AuditLogsCount = await _context.AuditLogs.CountAsync(),
            ImportLogsCount = await _context.ImportLogs.CountAsync(),
            SqlHistoriesCount = await _context.SqlHistories.CountAsync(),
            JsonHistoriesCount = await _context.JsonHistories.CountAsync()
        };

        return Ok(ApiResponse<DatabaseModuleStatsDto>.Success(stats));
    }

    [HttpPost("purge-partial")]
    public async Task<IActionResult> PurgePartial([FromBody] PurgePartialRequestDto dto)
    {
        if (dto.Modules == null || dto.Modules.Count == 0)
        {
            return BadRequest(ApiResponse<object>.Fail("Pilih minimal satu modul untuk dihapus."));
        }

        if (string.IsNullOrWhiteSpace(dto.ConfirmationText) || 
            !dto.ConfirmationText.Trim().Equals("HAPUS SELEKSI", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(ApiResponse<object>.Fail("Konfirmasi teks tidak valid. Ketik 'HAPUS SELEKSI' untuk melanjutkan."));
        }

        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            var deletedCounts = new Dictionary<string, int>();
            int totalDeleted = 0;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _context.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 0;");

                foreach (var rawModule in dto.Modules)
                {
                    var mod = rawModule.Trim().ToLowerInvariant();
                    switch (mod)
                    {
                        case "tasks":
                        {
                            var sCount = await _context.Sessions.CountAsync();
                            var tCount = await _context.Tasks.CountAsync();
                            await _context.Database.ExecuteSqlRawAsync("UPDATE Notes SET TaskId = NULL;");
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Sessions;");
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Tasks;");
                            deletedCounts["Tugas & Sesi Kerja"] = sCount + tCount;
                            totalDeleted += sCount + tCount;
                            break;
                        }
                        case "attendance":
                        {
                            var dCount = await _context.DailyCheckIns.CountAsync();
                            var aCount = await _context.Attendances.CountAsync();
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM DailyCheckIns;");
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Attendances;");
                            deletedCounts["Presensi & Check-in"] = dCount + aCount;
                            totalDeleted += dCount + aCount;
                            break;
                        }
                        case "notes":
                        {
                            var naCount = await _context.NoteAttachments.CountAsync();
                            var nCount = await _context.Notes.CountAsync();
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM NoteAttachments;");
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Notes;");
                            deletedCounts["Catatan & Lampiran"] = naCount + nCount;
                            totalDeleted += naCount + nCount;
                            break;
                        }
                        case "tickets":
                        {
                            var tcCount = await _context.TicketComments.CountAsync();
                            var tkCount = await _context.Tickets.CountAsync();
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM TicketComments;");
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Tickets;");
                            deletedCounts["Tiket & Komentar"] = tcCount + tkCount;
                            totalDeleted += tcCount + tkCount;
                            break;
                        }
                        case "gamification":
                        {
                            var rcCount = await _context.RewardClaims.CountAsync();
                            var ubCount = await _context.UserBadges.CountAsync();
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM RewardClaims;");
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM UserBadges;");
                            deletedCounts["Gamifikasi & Klaim Hadiah"] = rcCount + ubCount;
                            totalDeleted += rcCount + ubCount;
                            break;
                        }
                        case "logs":
                        {
                            var alCount = await _context.AuditLogs.CountAsync();
                            var ilCount = await _context.ImportLogs.CountAsync();
                            var shCount = await _context.SqlHistories.CountAsync();
                            var jhCount = await _context.JsonHistories.CountAsync();
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM ImportLogs;");
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM SqlHistories;");
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM JsonHistories;");
                            await _context.Database.ExecuteSqlRawAsync("DELETE FROM AuditLogs;");
                            deletedCounts["Log Audit & Riwayat"] = alCount + ilCount + shCount + jhCount;
                            totalDeleted += alCount + ilCount + shCount + jhCount;
                            break;
                        }
                    }
                }

                await _context.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 1;");
                await transaction.CommitAsync();

                _logger.LogInformation("Pembersihan parsial data berhasil dieksekusi oleh user {User}. Modul: {Modules}. Total baris terhapus: {Total}",
                    User.Identity?.Name, string.Join(", ", dto.Modules), totalDeleted);

                var result = new PurgeResultDto
                {
                    Success = true,
                    Message = $"Berhasil membersihkan {totalDeleted:N0} baris data pada {dto.Modules.Count} modul terpilih.",
                    DeletedCounts = deletedCounts,
                    TotalDeletedRows = totalDeleted,
                    ExecutedAt = DateTime.UtcNow
                };

                return (IActionResult)Ok(ApiResponse<PurgeResultDto>.Success(result));
            }
            catch (Exception ex)
            {
                await _context.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 1;");
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Gagal melakukan pembersihan parsial data");
                return StatusCode(500, ApiResponse<object>.Fail($"Gagal menghapus data: {ex.Message}"));
            }
        });
    }

    [HttpPost("purge-full")]
    public async Task<IActionResult> PurgeFull([FromBody] PurgeFullRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ConfirmationText) ||
            !dto.ConfirmationText.Trim().Equals("RESET PENUH", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(ApiResponse<object>.Fail("Konfirmasi teks tidak valid. Ketik 'RESET PENUH' untuk melanjutkan."));
        }

        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            var deletedCounts = new Dictionary<string, int>();
            int totalDeleted = 0;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Count all rows before deletion
                var sessionsCount = await _context.Sessions.CountAsync();
                var tasksCount = await _context.Tasks.CountAsync();
                var checkInsCount = await _context.DailyCheckIns.CountAsync();
                var attendancesCount = await _context.Attendances.CountAsync();
                var noteAttsCount = await _context.NoteAttachments.CountAsync();
                var notesCount = await _context.Notes.CountAsync();
                var ticketCommentsCount = await _context.TicketComments.CountAsync();
                var ticketsCount = await _context.Tickets.CountAsync();
                var rewardClaimsCount = await _context.RewardClaims.CountAsync();
                var userBadgesCount = await _context.UserBadges.CountAsync();
                var auditLogsCount = await _context.AuditLogs.CountAsync();
                var importLogsCount = await _context.ImportLogs.CountAsync();
                var sqlHistoriesCount = await _context.SqlHistories.CountAsync();
                var jsonHistoriesCount = await _context.JsonHistories.CountAsync();

                await _context.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 0;");

                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Sessions;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Tasks;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM DailyCheckIns;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Attendances;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM NoteAttachments;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Notes;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM TicketComments;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Tickets;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM RewardClaims;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM UserBadges;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM ImportLogs;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM SqlHistories;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM JsonHistories;");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM AuditLogs;");

                if (dto.ResetUserPoints)
                {
                    await _context.Database.ExecuteSqlRawAsync("UPDATE AspNetUsers SET TotalPointsEarned = 0, CurrentStreak = 0, LongestStreak = 0;");
                }

                await _context.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 1;");
                await transaction.CommitAsync();

                deletedCounts["Tugas & Sesi Kerja"] = sessionsCount + tasksCount;
                deletedCounts["Presensi & Check-in"] = checkInsCount + attendancesCount;
                deletedCounts["Catatan & Lampiran"] = noteAttsCount + notesCount;
                deletedCounts["Tiket & Komentar"] = ticketCommentsCount + ticketsCount;
                deletedCounts["Gamifikasi & Klaim Hadiah"] = rewardClaimsCount + userBadgesCount;
                deletedCounts["Log Audit & Riwayat"] = auditLogsCount + importLogsCount + sqlHistoriesCount + jsonHistoriesCount;

                totalDeleted = deletedCounts.Values.Sum();

                _logger.LogWarning("RESET PENUH (Full Data Purge) dieksekusi oleh user {User}. Total data dibersihkan: {Total}",
                    User.Identity?.Name, totalDeleted);

                var result = new PurgeResultDto
                {
                    Success = true,
                    Message = $"Reset Penuh Berhasil! Sebanyak {totalDeleted:N0} baris data operasional telah dibersihkan. Akun pengguna, role, dan konfigurasi master tetap dipertahankan.",
                    DeletedCounts = deletedCounts,
                    TotalDeletedRows = totalDeleted,
                    ExecutedAt = DateTime.UtcNow
                };

                return (IActionResult)Ok(ApiResponse<PurgeResultDto>.Success(result));
            }
            catch (Exception ex)
            {
                await _context.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 1;");
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Gagal melakukan reset penuh database");
                return StatusCode(500, ApiResponse<object>.Fail($"Gagal melakukan reset data: {ex.Message}"));
            }
        });
    }
}
