using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Core.Enums;
using WorkTracker.Infrastructure.Data;
using WorkTracker.Api.Extensions;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectsApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects(
        [FromQuery] string? search, 
        [FromQuery] ProjectStatus? status,
        [FromQuery] int? companyId)
    {
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");
        var userCompanyId = await User.GetCompanyIdAsync(_context);

        var query = _context.Projects
            .Include(p => p.Company)
            .Include(p => p.Tasks)
                .ThenInclude(t => t.Sessions)
            .AsNoTracking();

        if (isAdmin)
        {
            // Administrator can see all projects or filter by a specific company if provided
            if (companyId.HasValue)
            {
                query = query.Where(p => p.CompanyId == companyId.Value);
            }
        }
        else
        {
            // Regular user only sees projects from their registered company
            if (userCompanyId.HasValue)
            {
                query = query.Where(p => p.CompanyId == userCompanyId.Value);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || (p.Description != null && p.Description.ToLower().Contains(s)));
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        var projects = await query
            .OrderBy(p => p.Company != null ? p.Company.Name : string.Empty)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync();

        var result = projects.Select(p =>
        {
            var totalTasks = p.Tasks.Count;
            var completedTasks = p.Tasks.Count(t => t.Status == WorkTaskStatus.Completed);
            var inProgressTasks = p.Tasks.Count(t => t.Status == WorkTaskStatus.InProgress);
            var progressPercent = totalTasks > 0 
                ? (int)Math.Round(p.Tasks.Average(t => (double)t.Progress)) 
                : 0;
            var totalSeconds = p.Tasks.SelectMany(t => t.Sessions).Sum(s => s.Duration);

            return new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Color = p.Color,
                Deadline = p.Deadline,
                Status = p.Status,
                CompanyId = p.CompanyId,
                CompanyName = p.Company != null ? p.Company.Name : "Perusahaan Mandiri",
                CreatedAt = p.CreatedAt,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                InProgressTasks = inProgressTasks,
                ProgressPercent = progressPercent,
                TotalSecondsLogged = totalSeconds
            };
        }).ToList();

        return Ok(ApiResponse<List<ProjectDto>>.Success(result));
    }

    [HttpGet("companies")]
    public async Task<IActionResult> GetCompanies()
    {
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");
        var userCompanyId = await User.GetCompanyIdAsync(_context);

        var query = _context.Companies.AsNoTracking();
        if (!isAdmin && userCompanyId.HasValue)
        {
            query = query.Where(c => c.Id == userCompanyId.Value);
        }

        var list = await query
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Code,
                ProjectCount = c.Projects.Count
            })
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(ApiResponse<object>.Success(list));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProjectById(int id)
    {
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");
        var userCompanyId = await User.GetCompanyIdAsync(_context);

        var query = _context.Projects
            .Include(x => x.Company)
            .Include(x => x.Tasks)
                .ThenInclude(t => t.Sessions)
            .AsNoTracking();

        if (!isAdmin && userCompanyId.HasValue)
        {
            query = query.Where(p => p.CompanyId == userCompanyId.Value);
        }

        var p = await query.FirstOrDefaultAsync(x => x.Id == id);

        if (p == null)
            return NotFound(ApiResponse<object>.Fail("Proyek tidak ditemukan."));

        var totalTasks = p.Tasks.Count;
        var completedTasks = p.Tasks.Count(t => t.Status == WorkTaskStatus.Completed);
        var inProgressTasks = p.Tasks.Count(t => t.Status == WorkTaskStatus.InProgress);
        var progressPercent = totalTasks > 0 
            ? (int)Math.Round(p.Tasks.Average(t => (double)t.Progress)) 
            : 0;
        var totalSeconds = p.Tasks.SelectMany(t => t.Sessions).Sum(s => s.Duration);

        var dto = new ProjectDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            Color = p.Color,
            Deadline = p.Deadline,
            Status = p.Status,
            CompanyId = p.CompanyId,
            CompanyName = p.Company != null ? p.Company.Name : "Perusahaan Mandiri",
            CreatedAt = p.CreatedAt,
            TotalTasks = totalTasks,
            CompletedTasks = completedTasks,
            InProgressTasks = inProgressTasks,
            ProgressPercent = progressPercent,
            TotalSecondsLogged = totalSeconds
        };

        return Ok(ApiResponse<ProjectDto>.Success(dto));
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data input tidak valid."));

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");
        var userCompanyId = await User.GetCompanyIdAsync(_context);
        var targetCompanyId = (isAdmin && dto.CompanyId.HasValue) ? dto.CompanyId.Value : userCompanyId;

        var project = new Project
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "#6366F1" : dto.Color.Trim(),
            Deadline = dto.Deadline,
            Status = dto.Status,
            CompanyId = targetCompanyId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var comp = targetCompanyId.HasValue ? await _context.Companies.FindAsync(targetCompanyId.Value) : null;

        var resultDto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Color = project.Color,
            Deadline = project.Deadline,
            Status = project.Status,
            CompanyId = project.CompanyId,
            CompanyName = comp?.Name ?? "Perusahaan Mandiri",
            CreatedAt = project.CreatedAt,
            TotalTasks = 0,
            CompletedTasks = 0,
            InProgressTasks = 0,
            ProgressPercent = 0,
            TotalSecondsLogged = 0
        };

        return CreatedAtAction(nameof(GetProjectById), new { id = project.Id }, ApiResponse<ProjectDto>.Success(resultDto, "Proyek berhasil dibuat."));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data input tidak valid."));

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");
        var userCompanyId = await User.GetCompanyIdAsync(_context);
        var project = await _context.Projects.FindAsync(id);
        if (project == null || (!isAdmin && userCompanyId.HasValue && project.CompanyId != userCompanyId.Value))
            return NotFound(ApiResponse<object>.Fail("Proyek tidak ditemukan."));

        project.Name = dto.Name.Trim();
        project.Description = dto.Description?.Trim();
        project.Color = string.IsNullOrWhiteSpace(dto.Color) ? "#6366F1" : dto.Color.Trim();
        project.Deadline = dto.Deadline;
        project.Status = dto.Status;
        if (isAdmin && dto.CompanyId.HasValue)
        {
            project.CompanyId = dto.CompanyId.Value;
        }

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { id = project.Id }, "Proyek berhasil diperbarui."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("System Analyst");
        var userCompanyId = await User.GetCompanyIdAsync(_context);
        var project = await _context.Projects
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null || (!isAdmin && userCompanyId.HasValue && project.CompanyId != userCompanyId.Value))
            return NotFound(ApiResponse<object>.Fail("Proyek tidak ditemukan."));

        if (project.Tasks.Any())
        {
            // Set status to Archived instead of hard deletion to protect work tasks history
            project.Status = ProjectStatus.Archived;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.Success(new { id = project.Id, archived = true }, "Proyek memiliki daftar tugas aktif sehingga otomatis diarsipkan (Archived)."));
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { id }, "Proyek berhasil dihapus."));
    }
}

