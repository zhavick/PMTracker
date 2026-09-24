using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Api.Extensions;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Core.Enums;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public class AttendanceApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public AttendanceApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetTodayAttendance()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var today = DateTime.UtcNow.Date;

        var record = await _context.Attendances
            .Include(a => a.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date.Date == today);

        if (record == null)
            return Ok(ApiResponse<AttendanceRecordDto?>.Success(null, "Belum ada presensi untuk hari ini."));

        return Ok(ApiResponse<AttendanceRecordDto>.Success(MapToDto(record)));
    }

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var today = DateTime.UtcNow.Date;

        var record = await _context.Attendances
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date.Date == today);

        if (record != null)
        {
            if (record.ClockIn.HasValue)
            {
                return BadRequest(ApiResponse<object>.Fail("Anda sudah melakukan Check-In untuk hari ini."));
            }
            record.ClockIn = DateTime.UtcNow;
            record.Type = dto.Type;
            record.WorkLocation = dto.WorkLocation;
            record.Notes = dto.Notes?.Trim();
            record.Location = dto.Location?.Trim();
            record.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            record = new AttendanceRecord
            {
                UserId = userId!,
                Date = today,
                Type = dto.Type,
                WorkLocation = dto.WorkLocation,
                ClockIn = DateTime.UtcNow,
                Notes = dto.Notes?.Trim(),
                Location = dto.Location?.Trim(),
                Status = AttendanceStatus.Approved,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Attendances.Add(record);
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<AttendanceRecordDto>.Success(MapToDto(record), "Check-In berhasil dicatat."));
    }

    [HttpPost("check-out")]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutRequestDto? dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var today = DateTime.UtcNow.Date;

        var record = await _context.Attendances
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Date.Date == today);

        if (record == null || !record.ClockIn.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Anda belum melakukan Check-In untuk hari ini."));
        }

        if (record.ClockOut.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Anda sudah melakukan Check-Out untuk hari ini."));
        }

        record.ClockOut = DateTime.UtcNow;
        var duration = record.ClockOut.Value - record.ClockIn.Value;
        record.TotalHours = Math.Round(duration.TotalHours, 2);

        if (!string.IsNullOrWhiteSpace(dto?.Notes))
        {
            record.Notes = string.IsNullOrWhiteSpace(record.Notes) 
                ? dto.Notes.Trim() 
                : $"{record.Notes} | Checkout: {dto.Notes.Trim()}";
        }

        record.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<AttendanceRecordDto>.Success(MapToDto(record), "Check-Out berhasil dicatat. Durasi kerja tersimpan."));
    }

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthlyAttendance([FromQuery] int? month, [FromQuery] int? year, [FromQuery] string? userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        var companyId = await User.GetCompanyIdAsync(_context);

        var targetUserId = isAdmin && !string.IsNullOrEmpty(userId) ? userId : currentUserId;
        var m = month ?? DateTime.UtcNow.Month;
        var y = year ?? DateTime.UtcNow.Year;

        var query = _context.Attendances
            .Include(a => a.User)
            .AsNoTracking()
            .Where(a => a.Date.Year == y && a.Date.Month == m);

        if (companyId.HasValue)
        {
            query = query.Where(a => a.User.CompanyId == companyId.Value);
        }

        if (!isAdmin || !string.IsNullOrEmpty(userId))
        {
            query = query.Where(a => a.UserId == targetUserId);
        }

        var records = await query.OrderBy(a => a.Date).ToListAsync();
        var dtoList = records.Select(MapToDto).ToList();

        return Ok(ApiResponse<List<AttendanceRecordDto>>.Success(dtoList));
    }

    [HttpPost("reconciliation")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ReconcileAttendance([FromBody] ReconciliationRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data input rekonsiliasi tidak valid."));

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var companyId = await User.GetCompanyIdAsync(_context);
        var targetUser = await _context.Users.FindAsync(dto.UserId);
        if (targetUser == null || (companyId.HasValue && targetUser.CompanyId != companyId.Value))
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var targetDate = dto.Date.Date;

        var record = await _context.Attendances
            .FirstOrDefaultAsync(a => a.UserId == dto.UserId && a.Date.Date == targetDate);

        if (record == null)
        {
            record = new AttendanceRecord
            {
                UserId = dto.UserId,
                Date = targetDate,
                Type = dto.Type,
                WorkLocation = dto.WorkLocation,
                ClockIn = dto.ClockIn,
                ClockOut = dto.ClockOut,
                TotalHours = dto.TotalHours,
                Notes = dto.Notes?.Trim(),
                Status = dto.Status,
                ApprovedByUserId = adminId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Attendances.Add(record);
        }
        else
        {
            record.Type = dto.Type;
            record.WorkLocation = dto.WorkLocation;
            record.ClockIn = dto.ClockIn;
            record.ClockOut = dto.ClockOut;
            record.TotalHours = dto.TotalHours;
            record.Notes = dto.Notes?.Trim();
            record.Status = dto.Status;
            record.ApprovedByUserId = adminId;
            record.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(new { id = record.Id }, "Rekonsiliasi absensi berhasil disimpan."));
    }

    [HttpPost("manual")]
    public async Task<IActionResult> ManualAttendance([FromBody] ManualAttendanceDto dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        var companyId = await User.GetCompanyIdAsync(_context);

        var targetUserId = isAdmin && !string.IsNullOrWhiteSpace(dto.UserId) ? dto.UserId : currentUserId;
        if (string.IsNullOrEmpty(targetUserId))
            return BadRequest(ApiResponse<object>.Fail("User ID tidak valid."));

        var targetUser = await _context.Users.FindAsync(targetUserId);
        if (targetUser == null || (companyId.HasValue && targetUser.CompanyId != companyId.Value))
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var targetDate = dto.Date.Date;

        var record = await _context.Attendances
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == targetUserId && a.Date.Date == targetDate);

        DateTime? parsedClockIn = null;
        DateTime? parsedClockOut = null;

        if (!string.IsNullOrWhiteSpace(dto.ClockIn))
        {
            if (TimeSpan.TryParse(dto.ClockIn, out var tsIn))
            {
                parsedClockIn = targetDate.Add(tsIn);
            }
            else if (DateTime.TryParse(dto.ClockIn, out var dtIn))
            {
                parsedClockIn = dtIn;
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.ClockOut))
        {
            if (TimeSpan.TryParse(dto.ClockOut, out var tsOut))
            {
                parsedClockOut = targetDate.Add(tsOut);
            }
            else if (DateTime.TryParse(dto.ClockOut, out var dtOut))
            {
                parsedClockOut = dtOut;
            }
        }

        double totalHours = 0;
        if (dto.TotalHours.HasValue && dto.TotalHours.Value > 0)
        {
            totalHours = dto.TotalHours.Value;
        }
        else if (parsedClockIn.HasValue && parsedClockOut.HasValue)
        {
            var diff = parsedClockOut.Value - parsedClockIn.Value;
            totalHours = Math.Round(Math.Max(0, diff.TotalHours), 2);
        }

        if (record == null)
        {
            record = new AttendanceRecord
            {
                UserId = targetUserId,
                Date = targetDate,
                Type = dto.Type,
                WorkLocation = dto.WorkLocation,
                ClockIn = parsedClockIn,
                ClockOut = parsedClockOut,
                TotalHours = totalHours,
                Notes = dto.Notes?.Trim(),
                Location = string.IsNullOrWhiteSpace(dto.Location) ? "Input Manual" : dto.Location.Trim(),
                Status = AttendanceStatus.Approved,
                ApprovedByUserId = isAdmin ? currentUserId : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Attendances.Add(record);
        }
        else
        {
            record.Type = dto.Type;
            record.WorkLocation = dto.WorkLocation;
            if (parsedClockIn.HasValue) record.ClockIn = parsedClockIn.Value;
            if (parsedClockOut.HasValue) record.ClockOut = parsedClockOut.Value;
            if (totalHours > 0) record.TotalHours = totalHours;
            if (!string.IsNullOrWhiteSpace(dto.Notes)) record.Notes = dto.Notes.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Location)) record.Location = dto.Location.Trim();
            record.Status = AttendanceStatus.Approved;
            record.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Reload user navigation if needed
        if (record.User == null)
        {
            await _context.Entry(record).Reference(r => r.User).LoadAsync();
        }

        return Ok(ApiResponse<AttendanceRecordDto>.Success(MapToDto(record), "Data presensi berhasil disimpan secara manual."));
    }

    private static AttendanceRecordDto MapToDto(AttendanceRecord a)
    {
        return new AttendanceRecordDto
        {
            Id = a.Id,
            UserId = a.UserId,
            UserName = a.User?.FullName ?? a.User?.UserName ?? "Pengguna",
            UserEmail = a.User?.Email ?? "-",
            Date = a.Date,
            Type = a.Type,
            WorkLocation = a.WorkLocation,
            ClockIn = a.ClockIn,
            ClockOut = a.ClockOut,
            TotalHours = a.TotalHours,
            LeaveReason = a.LeaveReason,
            Notes = a.Notes,
            Location = a.Location,
            Status = a.Status
        };
    }
}
