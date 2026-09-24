using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/master-data")]
[Authorize]
public class MasterDataApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public MasterDataApiController(AppDbContext context)
    {
        _context = context;
    }

    // 1. Priorities
    [HttpGet("priorities")]
    public async Task<IActionResult> GetPriorities()
    {
        var list = await _context.MasterPriorities.OrderBy(p => p.OrderIndex).ToListAsync();
        return Ok(ApiResponse<List<MasterPriority>>.Success(list));
    }

    [HttpPost("priorities")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreatePriority([FromBody] MasterPriority model)
    {
        _context.MasterPriorities.Add(model);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterPriority>.Success(model, "Prioritas berhasil ditambahkan."));
    }

    [HttpPut("priorities/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePriority(int id, [FromBody] MasterPriority model)
    {
        var existing = await _context.MasterPriorities.FindAsync(id);
        if (existing == null) return NotFound(ApiResponse<object>.Fail("Data tidak ditemukan."));

        existing.Name = model.Name;
        existing.Color = model.Color;
        existing.Icon = model.Icon;
        existing.OrderIndex = model.OrderIndex;
        existing.Description = model.Description;
        existing.IsDefault = model.IsDefault;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterPriority>.Success(existing, "Prioritas berhasil diperbarui."));
    }

    // 2. Statuses
    [HttpGet("statuses")]
    public async Task<IActionResult> GetStatuses()
    {
        var list = await _context.MasterStatuses.OrderBy(s => s.OrderIndex).ToListAsync();
        return Ok(ApiResponse<List<MasterStatus>>.Success(list));
    }

    [HttpPost("statuses")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateStatus([FromBody] MasterStatus model)
    {
        _context.MasterStatuses.Add(model);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterStatus>.Success(model, "Status berhasil ditambahkan."));
    }

    [HttpPut("statuses/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] MasterStatus model)
    {
        var existing = await _context.MasterStatuses.FindAsync(id);
        if (existing == null) return NotFound(ApiResponse<object>.Fail("Data tidak ditemukan."));

        existing.Name = model.Name;
        existing.Color = model.Color;
        existing.IsDoneState = model.IsDoneState;
        existing.OrderIndex = model.OrderIndex;
        existing.Description = model.Description;
        existing.IsDefault = model.IsDefault;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterStatus>.Success(existing, "Status berhasil diperbarui."));
    }

    // 3. SDLC Milestones
    [HttpGet("milestones")]
    public async Task<IActionResult> GetMilestones()
    {
        var list = await _context.MasterMilestones.OrderBy(m => m.OrderIndex).ToListAsync();
        return Ok(ApiResponse<List<MasterMilestone>>.Success(list));
    }

    [HttpPost("milestones")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateMilestone([FromBody] MasterMilestone model)
    {
        _context.MasterMilestones.Add(model);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterMilestone>.Success(model, "Milestone berhasil ditambahkan."));
    }

    [HttpPut("milestones/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateMilestone(int id, [FromBody] MasterMilestone model)
    {
        var existing = await _context.MasterMilestones.FindAsync(id);
        if (existing == null) return NotFound(ApiResponse<object>.Fail("Data tidak ditemukan."));

        existing.Name = model.Name;
        existing.Phase = model.Phase;
        existing.Color = model.Color;
        existing.Icon = model.Icon;
        existing.OrderIndex = model.OrderIndex;
        existing.Description = model.Description;
        existing.IsDefault = model.IsDefault;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<MasterMilestone>.Success(existing, "Milestone berhasil diperbarui."));
    }

    // 4. Categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var list = await _context.Categories.ToListAsync();
        return Ok(ApiResponse<List<Category>>.Success(list));
    }

    [HttpPost("categories")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] Category model)
    {
        _context.Categories.Add(model);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<Category>.Success(model, "Kategori berhasil ditambahkan."));
    }
}
