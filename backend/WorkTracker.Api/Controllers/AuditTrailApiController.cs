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
        [FromQuery] string? method,
        [FromQuery] string? userName,
        [FromQuery] string? module,
        [FromQuery] string? activity,
        [FromQuery] string? dateFrom,
        [FromQuery] string? dateTo,
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
                (a.ActionName != null && a.ActionName.ToLower().Contains(s)));
        }

        if (statusCode.HasValue)
            query = query.Where(a => a.StatusCode == statusCode.Value);

        if (!string.IsNullOrWhiteSpace(method) && method != "ALL")
            query = query.Where(a => a.HttpMethod == method.ToUpper());

        if (!string.IsNullOrWhiteSpace(userName))
        {
            var un = userName.Trim().ToLower();
            query = query.Where(a =>
                (a.UserName != null && a.UserName.ToLower().Contains(un)) ||
                (a.UserEmail != null && a.UserEmail.ToLower().Contains(un)));
        }

        if (!string.IsNullOrWhiteSpace(module))
        {
            var m = module.Trim().ToLower();
            query = query.Where(a => a.ControllerName != null && a.ControllerName.ToLower().Contains(m));
        }

        if (!string.IsNullOrWhiteSpace(activity))
        {
            var act = activity.Trim().ToLower();
            query = query.Where(a => a.ActionName != null && a.ActionName.ToLower().Contains(act));
        }

        if (!string.IsNullOrWhiteSpace(dateFrom) && DateTime.TryParse(dateFrom, out var dtFrom))
            query = query.Where(a => a.Timestamp >= dtFrom);

        if (!string.IsNullOrWhiteSpace(dateTo) && DateTime.TryParse(dateTo, out var dtTo))
            query = query.Where(a => a.Timestamp <= dtTo.AddDays(1));

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

    /// <summary>
    /// Chart data: daily request counts per HTTP method for a date range
    /// </summary>
    [HttpGet("chart")]
    public async Task<IActionResult> GetChartData(
        [FromQuery] string? dateFrom,
        [FromQuery] string? dateTo,
        [FromQuery] string? userName,
        [FromQuery] string? module)
    {
        var from = DateTime.TryParse(dateFrom, out var df) ? df : DateTime.UtcNow.AddDays(-30);
        var to = DateTime.TryParse(dateTo, out var dt) ? dt.AddDays(1) : DateTime.UtcNow.AddDays(1);

        var query = _context.AuditLogs.AsNoTracking()
            .Where(a => a.Timestamp >= from && a.Timestamp <= to);

        if (!string.IsNullOrWhiteSpace(userName))
        {
            var un = userName.Trim().ToLower();
            query = query.Where(a =>
                (a.UserName != null && a.UserName.ToLower().Contains(un)) ||
                (a.UserEmail != null && a.UserEmail.ToLower().Contains(un)));
        }

        if (!string.IsNullOrWhiteSpace(module))
        {
            var m = module.Trim().ToLower();
            query = query.Where(a => a.ControllerName != null && a.ControllerName.ToLower().Contains(m));
        }

        var raw = await query
            .Select(a => new { a.Timestamp, a.HttpMethod, a.StatusCode, a.DurationMs })
            .ToListAsync();

        // Group by date + method
        var grouped = raw
            .GroupBy(a => new { Date = a.Timestamp.Date, Method = a.HttpMethod.ToUpper() })
            .Select(g => new
            {
                date = g.Key.Date.ToString("yyyy-MM-dd"),
                method = g.Key.Method,
                count = g.Count(),
                avgDurationMs = Math.Round(g.Average(x => x.DurationMs), 1),
                errorCount = g.Count(x => x.StatusCode >= 400)
            })
            .OrderBy(g => g.date)
            .ThenBy(g => g.method)
            .ToList();

        // Summary stats
        var summary = new
        {
            totalRequests = raw.Count,
            getCount = raw.Count(a => a.HttpMethod.ToUpper() == "GET"),
            postCount = raw.Count(a => a.HttpMethod.ToUpper() == "POST"),
            putCount = raw.Count(a => a.HttpMethod.ToUpper() == "PUT"),
            deleteCount = raw.Count(a => a.HttpMethod.ToUpper() == "DELETE"),
            errorCount = raw.Count(a => a.StatusCode >= 400),
            avgDurationMs = raw.Any() ? Math.Round(raw.Average(a => a.DurationMs), 1) : 0
        };

        // Distinct dates for x-axis
        var dates = raw.Select(a => a.Timestamp.Date.ToString("yyyy-MM-dd")).Distinct().OrderBy(d => d).ToList();

        return Ok(ApiResponse<object>.Success(new { dates, series = grouped, summary }));
    }

    /// <summary>
    /// Get distinct user names for filter dropdown
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetDistinctUsers()
    {
        var users = await _context.AuditLogs
            .Where(a => a.UserName != null)
            .Select(a => new { a.UserName, a.UserEmail })
            .Distinct()
            .OrderBy(u => u.UserName)
            .Take(200)
            .ToListAsync();
        return Ok(ApiResponse<object>.Success(users));
    }

    /// <summary>
    /// Get distinct modules (controllers) for filter dropdown
    /// </summary>
    [HttpGet("modules")]
    public async Task<IActionResult> GetDistinctModules()
    {
        var modules = await _context.AuditLogs
            .Where(a => a.ControllerName != null)
            .Select(a => a.ControllerName!)
            .Distinct()
            .OrderBy(m => m)
            .ToListAsync();
        return Ok(ApiResponse<object>.Success(modules));
    }

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] string? dateFrom,
        [FromQuery] string? dateTo,
        [FromQuery] string? method)
    {
        var query = _context.AuditLogs.AsNoTracking();

        if (DateTime.TryParse(dateFrom, out var df)) query = query.Where(a => a.Timestamp >= df);
        if (DateTime.TryParse(dateTo, out var dt)) query = query.Where(a => a.Timestamp <= dt.AddDays(1));
        if (!string.IsNullOrWhiteSpace(method) && method != "ALL") query = query.Where(a => a.HttpMethod == method.ToUpper());

        var logs = await query.OrderByDescending(a => a.Timestamp).Take(5000).ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,Timestamp,HttpMethod,Path,StatusCode,ControllerName,ActionName,UserName,UserEmail,IpAddress,DurationMs");

        foreach (var l in logs)
        {
            sb.AppendLine($"{l.Id},\"{l.Timestamp:yyyy-MM-dd HH:mm:ss}\",\"{l.HttpMethod}\",\"{l.Path}\",{l.StatusCode},\"{l.ControllerName}\",\"{l.ActionName}\",\"{l.UserName}\",\"{l.UserEmail}\",\"{l.IpAddress}\",{l.DurationMs}");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"AuditTrail_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
    }
}
