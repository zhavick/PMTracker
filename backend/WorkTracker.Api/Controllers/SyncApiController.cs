using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/sync")]
[Authorize(Roles = "Admin")]
public class SyncApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public SyncApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSyncSummary()
    {
        var projectCount = await _context.Projects.CountAsync();
        var taskCount = await _context.Tasks.CountAsync();
        var sessionCount = await _context.Sessions.CountAsync();
        var noteCount = await _context.Notes.CountAsync();
        var attendanceCount = await _context.Attendances.CountAsync();
        var userCount = await _context.Users.CountAsync();

        var summary = new
        {
            instanceId = Environment.MachineName,
            databaseEngine = "MySQL 8.4 LTS",
            serverTimeUtc = DateTime.UtcNow,
            totalUsers = userCount,
            totalProjects = projectCount,
            totalTasks = taskCount,
            totalSessions = sessionCount,
            totalNotes = noteCount,
            totalAttendances = attendanceCount,
            syncStatus = "Ready"
        };

        return Ok(ApiResponse<object>.Success(summary));
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult HealthCheck()
    {
        return Ok(ApiResponse<object>.Success(new { status = "Healthy", machine = Environment.MachineName, timeUtc = DateTime.UtcNow }, "Sync node reachable."));
    }

    [HttpPost("ping-host")]
    public async Task<IActionResult> PingHost([FromBody] Dictionary<string, string> dto)
    {
        var hostUrl = dto.GetValueOrDefault("hostUrl", "http://localhost:5000");
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            if (Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", authHeader.ToString());
            }

            var res = await client.GetAsync($"{hostUrl.TrimEnd('/')}/api/sync/summary");
            if (res.IsSuccessStatusCode)
            {
                return Ok(ApiResponse<object>.Success(null, "Koneksi ke Host Induk berhasil diverifikasi (200 OK)."));
            }
            return StatusCode((int)res.StatusCode, ApiResponse<object>.Fail($"Host Induk merespons dengan status: {res.StatusCode}"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Gagal menghubungi Host Induk: {ex.Message}"));
        }
    }
}
