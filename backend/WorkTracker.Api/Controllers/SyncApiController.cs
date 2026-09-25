using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Infrastructure.Data;
using WorkTracker.Infrastructure.Services;

namespace WorkTracker.Api.Controllers;

/// <summary>
/// Modul Sinkronisasi Basis Data & Asset antara Node Lokal dan Server Induk (https://tracker.saidilmuna.space/)
/// </summary>
[ApiController]
[Route("api/sync")]
public class SyncApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ISyncService _syncService;
    private readonly IConfiguration _config;
    private readonly ILogger<SyncApiController> _logger;

    public SyncApiController(
        AppDbContext context, 
        ISyncService syncService, 
        IConfiguration config, 
        ILogger<SyncApiController> logger)
    {
        _context = context;
        _syncService = syncService;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Ping status node lokal dan remote server induk (https://tracker.saidilmuna.space/).
    /// Dapat diakses publik untuk health check atau dengan otorisasi untuk detail lengkap.
    /// </summary>
    [HttpGet("ping")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<SyncPingResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Ping([FromQuery] string? remoteUrl = null, [FromQuery] string? apiKey = null, [FromQuery] string? bearerToken = null)
    {
        var targetUrl = !string.IsNullOrWhiteSpace(remoteUrl) 
            ? remoteUrl 
            : _config["Sync:RemoteHostUrl"] ?? "https://tracker.saidilmuna.space/";
            
        var targetApiKey = !string.IsNullOrWhiteSpace(apiKey)
            ? apiKey
            : Request.Headers["X-Sync-ApiKey"].FirstOrDefault() ?? _config["Sync:ApiKey"];

        var targetBearer = !string.IsNullOrWhiteSpace(bearerToken)
            ? bearerToken
            : Request.Headers["Authorization"].FirstOrDefault();

        var pingResult = await _syncService.PingHostAsync(targetUrl, targetApiKey, targetBearer);

        return Ok(ApiResponse<SyncPingResponseDto>.Success(pingResult, "Ping selesai dieksekusi."));
    }

    /// <summary>
    /// Mengambil status node lokal dan statistik entitas (Task, Project, User, dsb).
    /// </summary>
    [HttpGet("status")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<SyncPingResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus()
    {
        var status = await _syncService.GetLocalStatusAsync();
        return Ok(ApiResponse<SyncPingResponseDto>.Success(status));
    }

    /// <summary>
    /// Mengambil konfigurasi sinkronisasi saat ini (Target Remote Host, API Key terdaftar, Auto Sync, Interval).
    /// Memerlukan hak akses Admin.
    /// </summary>
    [HttpGet("settings")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<SyncSettingsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _syncService.GetSettingsAsync();
        return Ok(ApiResponse<SyncSettingsDto>.Success(settings));
    }

    /// <summary>
    /// Memperbarui konfigurasi sinkronisasi server induk.
    /// Memerlukan hak akses Admin.
    /// </summary>
    [HttpPut("settings")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<SyncSettingsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateSettings([FromBody] SyncSettingsDto dto)
    {
        var updated = await _syncService.SaveSettingsAsync(dto);
        return Ok(ApiResponse<SyncSettingsDto>.Success(updated, "Pengaturan sinkronisasi berhasil disimpan."));
    }

    /// <summary>
    /// Melakukan PUSH data lokal ke Server Induk (default: https://tracker.saidilmuna.space/).
    /// Memerlukan hak akses Admin.
    /// </summary>
    [HttpPost("push")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<SyncResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PushToHost([FromBody] SyncPushRequestDto? dto)
    {
        dto ??= new SyncPushRequestDto();
        var result = await _syncService.PushToHostAsync(dto);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<SyncResultDto>.Fail(result.Message, new List<string> { result.Message }));
        }
        return Ok(ApiResponse<SyncResultDto>.Success(result, result.Message));
    }

    /// <summary>
    /// Melakukan PULL data dari Server Induk ke basis data lokal.
    /// Memerlukan hak akses Admin.
    /// </summary>
    [HttpPost("pull")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<SyncResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PullFromHost([FromBody] SyncPullRequestDto? dto)
    {
        dto ??= new SyncPullRequestDto();
        var result = await _syncService.PullFromHostAsync(dto);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<SyncResultDto>.Fail(result.Message, new List<string> { result.Message }));
        }
        return Ok(ApiResponse<SyncResultDto>.Success(result, result.Message));
    }

    /// <summary>
    /// Mengunduh file SQL Dump lengkap dari basis data saat ini.
    /// </summary>
    [HttpGet("export-sql")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ExportSql()
    {
        var sqlContent = await _syncService.ExportSqlDumpAsync();
        var bytes = System.Text.Encoding.UTF8.GetBytes(sqlContent);
        var fileName = $"worktracker_backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.sql";
        return File(bytes, "application/sql", fileName);
    }

    /// <summary>
    /// Mengimpor dan mengeksekusi file SQL Dump ke basis data lokal.
    /// </summary>
    [HttpPost("import-sql")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportSql(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<object>.Fail("File SQL tidak valid atau kosong."));
        }

        using var reader = new StreamReader(file.OpenReadStream());
        var sql = await reader.ReadToEndAsync();
        var res = await _syncService.ImportSqlScriptAsync(sql);

        if (!res.Success)
        {
            return BadRequest(ApiResponse<object>.Fail($"Gagal impor SQL: {res.Message}"));
        }

        return Ok(ApiResponse<object>.Success(new { StatementsExecuted = res.ExecutedStatementsCount }, res.Message));
    }

    /// <summary>
    /// Mengunduh paket ZIP arsip lengkap yang berisi basis data (JSON format) beserta file berkas uploads.
    /// </summary>
    [HttpGet("export-package")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ExportPackage()
    {
        var zipBytes = await _syncService.ExportPackageZipAsync();
        var fileName = $"worktracker_package_{DateTime.UtcNow:yyyyMMdd_HHmmss}.zip";
        return File(zipBytes, "application/zip", fileName);
    }

    /// <summary>
    /// Mengimpor paket ZIP arsip dan mengekstrak entitas basis data serta file uploads ke node lokal.
    /// </summary>
    [HttpPost("import-package")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportPackage(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<object>.Fail("File paket ZIP tidak valid atau kosong."));
        }

        using var stream = file.OpenReadStream();
        var res = await _syncService.ImportPackageZipAsync(stream);

        if (!res.Success)
        {
            return BadRequest(ApiResponse<object>.Fail(res.Message));
        }

        return Ok(ApiResponse<object>.Success(res, res.Message));
    }

    /// <summary>
    /// Endpoint penerima muatan sinkronisasi data dari node lain atau server induk.
    /// Diotorisasi via header 'X-Sync-ApiKey' atau Bearer Token Admin.
    /// </summary>
    [HttpPost("receive")]
    [AllowAnonymous] // Validasi manual ApiKey atau JWT Bearer di bawah
    [ProducesResponseType(typeof(ApiResponse<SyncResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Receive([FromBody] SyncReceiveRequestDto dto)
    {
        // 1. Verifikasi X-Sync-ApiKey atau User Admin
        var incomingApiKey = Request.Headers["X-Sync-ApiKey"].FirstOrDefault();
        var configuredApiKey = _config["Sync:ApiKey"] ?? "TrackerKerja_Default_Sync_Secret_Key_2026!";

        bool isAuthorized = false;
        if (!string.IsNullOrWhiteSpace(incomingApiKey) && incomingApiKey == configuredApiKey)
        {
            isAuthorized = true;
        }
        else if (User.Identity?.IsAuthenticated == true && User.IsInRole("Admin"))
        {
            isAuthorized = true;
        }

        if (!isAuthorized)
        {
            _logger.LogWarning("Otorisasi sinkronisasi gagal untuk endpoint receive.");
            return Unauthorized(ApiResponse<object>.Fail("Akses ditolak. Header X-Sync-ApiKey tidak valid atau token admin tidak ditemukan."));
        }

        var result = await _syncService.ReceivePayloadAsync(dto);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<SyncResultDto>.Fail(result.Message));
        }

        return Ok(ApiResponse<SyncResultDto>.Success(result, result.Message));
    }

    /// <summary>
    /// Endpoint ringkasan entitas lokal untuk kompatibilitas.
    /// </summary>
    [HttpGet("summary")]
    [Authorize]
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

    /// <summary>
    /// Health check status sinkronisasi node.
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult HealthCheck()
    {
        return Ok(ApiResponse<object>.Success(new { 
            status = "Healthy", 
            machine = Environment.MachineName, 
            timeUtc = DateTime.UtcNow,
            masterHost = _config["Sync:RemoteHostUrl"] ?? "https://tracker.saidilmuna.space/"
        }, "Sync node reachable."));
    }

    /// <summary>
    /// Menguji koneksi HTTP langsung ke Host Induk melalui backend.
    /// </summary>
    [HttpPost("ping-host")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PingHost([FromBody] Dictionary<string, string> dto)
    {
        var hostUrl = dto.GetValueOrDefault("hostUrl", _config["Sync:RemoteHostUrl"] ?? "https://tracker.saidilmuna.space/");
        var apiKey = dto.GetValueOrDefault("apiKey", _config["Sync:ApiKey"] ?? "TrackerKerja_Default_Sync_Secret_Key_2026!");
        var bearerToken = dto.GetValueOrDefault("bearerToken", "");

        try
        {
            var result = await _syncService.PingHostAsync(hostUrl, apiKey, bearerToken);
            return Ok(ApiResponse<SyncPingResponseDto>.Success(result, result.IsOnline 
                ? $"Berhasil terhubung ke Host Induk ({hostUrl})." 
                : $"Host Induk merespons: {result.Message}"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Gagal menghubungi Host Induk: {ex.Message}"));
        }
    }
}
