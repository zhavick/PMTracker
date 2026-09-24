using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/master-data/holidays")]
[Authorize]
public class HolidayApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public HolidayApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetHolidays(
        [FromQuery] int? year,
        [FromQuery] string? type,
        [FromQuery] bool? activeOnly)
    {
        var query = _context.MasterHolidays.AsNoTracking();

        if (year.HasValue)
            query = query.Where(h => h.Date.Year == year.Value);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(h => h.HolidayType == type);

        if (activeOnly == true)
            query = query.Where(h => h.IsActive);

        var list = await query.OrderBy(h => h.Date).ToListAsync();
        return Ok(ApiResponse<List<MasterHoliday>>.Success(list));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetHoliday(int id)
    {
        var holiday = await _context.MasterHolidays.FindAsync(id);
        if (holiday == null) return NotFound(ApiResponse<object>.Fail("Hari libur tidak ditemukan."));
        return Ok(ApiResponse<MasterHoliday>.Success(holiday));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateHoliday([FromBody] MasterHoliday model)
    {
        model.CreatedAt = DateTime.UtcNow;
        _context.MasterHolidays.Add(model);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterHoliday>.Success(model, "Hari libur berhasil ditambahkan."));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateHoliday(int id, [FromBody] MasterHoliday model)
    {
        var existing = await _context.MasterHolidays.FindAsync(id);
        if (existing == null) return NotFound(ApiResponse<object>.Fail("Data tidak ditemukan."));

        existing.Name = model.Name;
        existing.Date = model.Date;
        existing.HolidayType = model.HolidayType;
        existing.Color = model.Color;
        existing.Icon = model.Icon;
        existing.Description = model.Description;
        existing.IsRecurringYearly = model.IsRecurringYearly;
        existing.IsActive = model.IsActive;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterHoliday>.Success(existing, "Hari libur berhasil diperbarui."));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHoliday(int id)
    {
        var existing = await _context.MasterHolidays.FindAsync(id);
        if (existing == null) return NotFound(ApiResponse<object>.Fail("Data tidak ditemukan."));

        _context.MasterHolidays.Remove(existing);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(null, "Hari libur berhasil dihapus."));
    }

    /// <summary>
    /// Check if a given date is a holiday
    /// </summary>
    [HttpGet("check")]
    public async Task<IActionResult> CheckHoliday([FromQuery] string date)
    {
        if (!DateOnly.TryParse(date, out var d))
            return BadRequest(ApiResponse<object>.Fail("Format tanggal tidak valid. Gunakan YYYY-MM-DD."));

        // Check exact date match
        var holidays = await _context.MasterHolidays
            .Where(h => h.IsActive && (h.Date == d || (h.IsRecurringYearly && h.Date.Month == d.Month && h.Date.Day == d.Day)))
            .ToListAsync();

        return Ok(ApiResponse<object>.Success(new
        {
            isHoliday = holidays.Any(),
            holidays = holidays
        }));
    }

    /// <summary>
    /// Get holidays for a date range (useful for calendar integration)
    /// </summary>
    [HttpGet("range")]
    public async Task<IActionResult> GetHolidaysInRange([FromQuery] string from, [FromQuery] string to)
    {
        if (!DateOnly.TryParse(from, out var dateFrom) || !DateOnly.TryParse(to, out var dateTo))
            return BadRequest(ApiResponse<object>.Fail("Format tanggal tidak valid."));

        var holidays = await _context.MasterHolidays
            .Where(h => h.IsActive && h.Date >= dateFrom && h.Date <= dateTo)
            .OrderBy(h => h.Date)
            .ToListAsync();

        return Ok(ApiResponse<List<MasterHoliday>>.Success(holidays));
    }
}
