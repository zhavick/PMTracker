using System.Security.Claims;
using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/email-settings")]
[Authorize(Roles = "Admin")]
public class EmailSettingsApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public EmailSettingsApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("smtp")]
    public async Task<IActionResult> GetSmtpSettings()
    {
        var settings = await _context.SystemSettings
            .Where(s => s.Key.StartsWith("Smtp:"))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        var result = new
        {
            host = settings.GetValueOrDefault("Smtp:Host", "smtp.gmail.com"),
            port = int.TryParse(settings.GetValueOrDefault("Smtp:Port", "587"), out var p) ? p : 587,
            username = settings.GetValueOrDefault("Smtp:Username", "tracker@example.com"),
            enableSsl = bool.TryParse(settings.GetValueOrDefault("Smtp:EnableSsl", "true"), out var ssl) && ssl,
            senderEmail = settings.GetValueOrDefault("Smtp:SenderEmail", "noreply@trackerkerja.com"),
            senderName = settings.GetValueOrDefault("Smtp:SenderName", "Work Tracker Pro Notifications")
        };

        return Ok(ApiResponse<object>.Success(result));
    }

    [HttpPost("smtp")]
    public async Task<IActionResult> SaveSmtpSettings([FromBody] Dictionary<string, string> dto)
    {
        foreach (var (key, value) in dto)
        {
            var dbKey = key.StartsWith("Smtp:") ? key : $"Smtp:{key}";
            var setting = await _context.SystemSettings.FindAsync(dbKey);
            if (setting == null)
            {
                _context.SystemSettings.Add(new SystemSetting { Key = dbKey, Value = value, UpdatedAt = DateTime.UtcNow });
            }
            else
            {
                setting.Value = value;
                setting.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(null, "Pengaturan SMTP berhasil disimpan."));
    }

    [HttpPost("test-connection")]
    public async Task<IActionResult> TestConnection([FromBody] Dictionary<string, string> dto)
    {
        var host = dto.GetValueOrDefault("host", "smtp.gmail.com");
        var port = int.TryParse(dto.GetValueOrDefault("port", "587"), out var p) ? p : 587;
        var username = dto.GetValueOrDefault("username", "");
        var password = dto.GetValueOrDefault("password", "");
        var enableSsl = bool.TryParse(dto.GetValueOrDefault("enableSsl", "true"), out var ssl) && ssl;

        try
        {
            using var client = new SmtpClient();
            client.Timeout = 5000;
            await client.ConnectAsync(host, port, enableSsl ? MailKit.Security.SecureSocketOptions.StartTls : MailKit.Security.SecureSocketOptions.None);
            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                await client.AuthenticateAsync(username, password);
            }
            await client.DisconnectAsync(true);

            return Ok(ApiResponse<object>.Success(null, "Koneksi ke server SMTP berhasil diverifikasi!"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Gagal tersambung ke SMTP: {ex.Message}"));
        }
    }

    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _context.EmailTemplates.OrderBy(t => t.Id).ToListAsync();
        return Ok(ApiResponse<List<EmailTemplate>>.Success(templates));
    }

    [HttpPut("templates/{id}")]
    public async Task<IActionResult> UpdateTemplate(int id, [FromBody] EmailTemplate model)
    {
        var existing = await _context.EmailTemplates.FindAsync(id);
        if (existing == null) return NotFound(ApiResponse<object>.Fail("Template tidak ditemukan."));

        existing.Subject = model.Subject;
        existing.BodyHtml = model.BodyHtml;
        existing.IsActive = model.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<EmailTemplate>.Success(existing, "Template email berhasil diperbarui."));
    }
}
