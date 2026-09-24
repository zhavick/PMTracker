using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

public class AppSettingsDto
{
    public string AppName { get; set; } = "Work Tracker Pro v3.6 • Enterprise Edition";
    public string CompanyName { get; set; } = "PT Elistec Teknologi";
    public string? Description { get; set; } = "Enterprise Task & Workforce Tracker";
    public string Version { get; set; } = "3.6.0";
}

public class UpdateAppSettingsDto
{
    public string AppName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

[ApiController]
[Route("api/app-settings")]
public class AppSettingsApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public AppSettingsApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _context.SystemSettings
            .Where(s => s.Key.StartsWith("App:"))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        var dto = new AppSettingsDto
        {
            AppName = settings.TryGetValue("App:Name", out var appName) && !string.IsNullOrWhiteSpace(appName)
                ? appName
                : "Work Tracker Pro v3.6 • Enterprise Edition",
            CompanyName = settings.TryGetValue("App:CompanyName", out var compName) && !string.IsNullOrWhiteSpace(compName)
                ? compName
                : "PT Elistec Teknologi",
            Description = settings.TryGetValue("App:Description", out var desc)
                ? desc
                : "Enterprise Task & Workforce Tracker",
            Version = "3.6.0"
        };

        return Ok(ApiResponse<AppSettingsDto>.Success(dto));
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateAppSettingsDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AppName) || string.IsNullOrWhiteSpace(dto.CompanyName))
        {
            return BadRequest(ApiResponse<object>.Fail("Nama aplikasi dan nama perusahaan tidak boleh kosong."));
        }

        await UpsertSettingAsync("App:Name", dto.AppName.Trim(), "Nama aplikasi resmi");
        await UpsertSettingAsync("App:CompanyName", dto.CompanyName.Trim(), "Nama perusahaan pengembang aplikasi");
        if (dto.Description != null)
        {
            await UpsertSettingAsync("App:Description", dto.Description.Trim(), "Deskripsi singkat aplikasi");
        }

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new 
        { 
            appName = dto.AppName.Trim(), 
            companyName = dto.CompanyName.Trim() 
        }, "Pengaturan identitas aplikasi berhasil diperbarui."));
    }

    private async Task UpsertSettingAsync(string key, string value, string description)
    {
        var existing = await _context.SystemSettings.FindAsync(key);
        if (existing == null)
        {
            _context.SystemSettings.Add(new SystemSetting
            {
                Key = key,
                Value = value,
                Description = description,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.Value = value;
            existing.Description = description;
            existing.UpdatedAt = DateTime.UtcNow;
        }
    }
}
