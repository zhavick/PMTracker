using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/audit-trail")]
[Authorize(Roles = "Admin")]
public class AuditTrailApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuditTrailApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? search,
        [FromQuery] int? statusCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _context.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(a => 
                (a.Path != null && a.Path.ToLower().Contains(s)) ||
                (a.UserName != null && a.UserName.ToLower().Contains(s)) ||
                (a.UserEmail != null && a.UserEmail.ToLower().Contains(s)) ||
                (a.ActionName != null && a.ActionName.ToLower().Contains(s))
            );
        }

        if (statusCode.HasValue)
        {
            query = query.Where(a => a.StatusCode == statusCode.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<object>
        {
            Items = items.Cast<object>().ToList(),
            PageNumber = page,
            PageSize = pageSize,
            TotalItems = total
        };

        return Ok(ApiResponse<PagedResult<object>>.Success(result));
    }

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv()
    {
        var logs = await _context.AuditLogs
            .OrderByDescending(a => a.Timestamp)
            .Take(1000)
            .AsNoTracking()
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,Timestamp,HttpMethod,Path,StatusCode,UserName,UserEmail,IpAddress,DurationMs");

        foreach (var l in logs)
        {
            sb.AppendLine($"{l.Id},\"{l.Timestamp:yyyy-MM-dd HH:mm:ss}\",\"{l.HttpMethod}\",\"{l.Path}\",{l.StatusCode},\"{l.UserName}\",\"{l.UserEmail}\",\"{l.IpAddress}\",{l.DurationMs}");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"AuditTrail_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
    }
}
