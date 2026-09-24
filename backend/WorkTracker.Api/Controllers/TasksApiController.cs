using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Core.Enums;
using WorkTracker.Infrastructure.Data;

using WorkTracker.Infrastructure.Services;
using WorkTracker.Api.Extensions;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TaskExcelImportService _importService;
    private readonly ClosedXmlService _closedXmlService;

    public TasksApiController(
        AppDbContext context, 
        TaskExcelImportService importService,
        ClosedXmlService closedXmlService)
    {
        _context = context;
        _importService = importService;
        _closedXmlService = closedXmlService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks(
        [FromQuery] int? projectId,
        [FromQuery] WorkTaskStatus? status,
        [FromQuery] TaskPriority? priority,
        [FromQuery] string? assignedToUserId,
        [FromQuery] string? search,
        [FromQuery] string? milestone,
        [FromQuery] bool? parentOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] bool sortDesc = true)
    {
        var companyId = await User.GetCompanyIdAsync(_context);

        var query = _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Category)
            .Include(t => t.AssignedToUser)
            .Include(t => t.ParentTask)
            .Include(t => t.ChildTasks)
            .Include(t => t.Sessions)
            .AsNoTracking();

        if (companyId.HasValue)
        {
            query = query.Where(t => t.CompanyId == companyId.Value || (t.CompanyId == null && t.Project != null && t.Project.CompanyId == companyId.Value));
        }

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        if (priority.HasValue)
            query = query.Where(t => t.Priority == priority.Value);

        if (!string.IsNullOrWhiteSpace(assignedToUserId))
            query = query.Where(t => t.AssignedToUserId == assignedToUserId);

        if (!string.IsNullOrWhiteSpace(milestone))
            query = query.Where(t => t.Milestone == milestone);

        if (parentOnly.HasValue && parentOnly.Value)
            query = query.Where(t => t.ParentTaskId == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(s) 
                || (t.Description != null && t.Description.ToLower().Contains(s))
                || (t.Obstacle != null && t.Obstacle.ToLower().Contains(s))
                || (t.Solution != null && t.Solution.ToLower().Contains(s)));
        }

        // Sorting
        query = (sortBy?.ToLower()) switch
        {
            "title" => sortDesc ? query.OrderByDescending(t => t.Title) : query.OrderBy(t => t.Title),
            "status" => sortDesc ? query.OrderByDescending(t => t.Status) : query.OrderBy(t => t.Status),
            "priority" => sortDesc ? query.OrderByDescending(t => t.Priority) : query.OrderBy(t => t.Priority),
            "progress" => sortDesc ? query.OrderByDescending(t => t.Progress) : query.OrderBy(t => t.Progress),
            "duedate" => sortDesc ? query.OrderByDescending(t => t.DueDate) : query.OrderBy(t => t.DueDate),
            _ => sortDesc ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt)
        };

        var totalItems = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var dtoList = items.Select(t => MapToDto(t, false)).ToList();

        var result = new PagedResult<WorkTaskDto>
        {
            Items = dtoList,
            PageNumber = page,
            PageSize = pageSize,
            TotalItems = totalItems
        };

        return Ok(ApiResponse<PagedResult<WorkTaskDto>>.Success(result));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTaskById(int id)
    {
        var companyId = await User.GetCompanyIdAsync(_context);

        var query = _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Category)
            .Include(t => t.AssignedToUser)
            .Include(t => t.ParentTask)
            .Include(t => t.ChildTasks)
                .ThenInclude(c => c.Sessions)
            .Include(t => t.Sessions)
            .AsNoTracking();

        if (companyId.HasValue)
        {
            query = query.Where(t => t.CompanyId == companyId.Value || (t.CompanyId == null && t.Project != null && t.Project.CompanyId == companyId.Value));
        }

        var task = await query.FirstOrDefaultAsync(t => t.Id == id);

        if (task == null)
            return NotFound(ApiResponse<object>.Fail("Tugas tidak ditemukan."));

        return Ok(ApiResponse<WorkTaskDto>.Success(MapToDto(task, includeSubtasks: true)));
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data input tidak valid."));

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var companyId = await User.GetCompanyIdAsync(_context);

        var task = new WorkTask
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            Status = dto.Status,
            Priority = dto.Priority,
            Progress = dto.Status == WorkTaskStatus.Completed ? 100 : Math.Clamp(dto.Progress, 0, 100),
            ProjectId = dto.ProjectId,
            CategoryId = dto.CategoryId,
            CompanyId = companyId,
            AssignedToUserId = string.IsNullOrWhiteSpace(dto.AssignedToUserId) ? userId : dto.AssignedToUserId,
            ParentTaskId = dto.ParentTaskId,
            Milestone = string.IsNullOrWhiteSpace(dto.Milestone) ? "Implementation" : dto.Milestone.Trim(),
            Obstacle = dto.Obstacle?.Trim(),
            Solution = dto.Solution?.Trim(),
            StartDate = dto.StartDate,
            DueDate = dto.DueDate,
            Tags = dto.Tags,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, ApiResponse<object>.Success(new { id = task.Id }, "Tugas berhasil dibuat."));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data input tidak valid."));

        var companyId = await User.GetCompanyIdAsync(_context);
        var task = await _context.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id);
        if (task == null || (companyId.HasValue && task.CompanyId.HasValue && task.CompanyId.Value != companyId.Value))
            return NotFound(ApiResponse<object>.Fail("Tugas tidak ditemukan."));

        task.Title = dto.Title.Trim();
        task.Description = dto.Description?.Trim();
        task.Status = dto.Status;
        task.Priority = dto.Priority;
        task.Progress = dto.Status == WorkTaskStatus.Completed ? 100 : Math.Clamp(dto.Progress, 0, 100);
        task.ProjectId = dto.ProjectId;
        task.CategoryId = dto.CategoryId;
        task.AssignedToUserId = dto.AssignedToUserId;
        task.ParentTaskId = dto.ParentTaskId;
        task.Milestone = string.IsNullOrWhiteSpace(dto.Milestone) ? "Implementation" : dto.Milestone.Trim();
        task.Obstacle = dto.Obstacle?.Trim();
        task.Solution = dto.Solution?.Trim();
        task.StartDate = dto.StartDate;
        task.DueDate = dto.DueDate;
        task.Tags = dto.Tags;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { id = task.Id }, "Tugas berhasil diperbarui."));
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] TaskStatusUpdateDto dto)
    {
        var companyId = await User.GetCompanyIdAsync(_context);
        var task = await _context.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id);
        if (task == null || (companyId.HasValue && task.CompanyId.HasValue && task.CompanyId.Value != companyId.Value))
            return NotFound(ApiResponse<object>.Fail("Tugas tidak ditemukan."));

        task.Status = dto.Status;
        if (dto.Progress.HasValue)
        {
            task.Progress = Math.Clamp(dto.Progress.Value, 0, 100);
        }
        else if (dto.Status == WorkTaskStatus.Completed)
        {
            task.Progress = 100;
        }
        else if (task.Progress == 100 && dto.Status != WorkTaskStatus.Completed)
        {
            task.Progress = 50;
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { id = task.Id, status = task.Status, progress = task.Progress }, "Status tugas berhasil diperbarui."));
    }

    [HttpPut("{id}/unified-save")]
    public async Task<IActionResult> UnifiedSave(int id, [FromBody] UnifiedSaveTaskDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data input tidak valid."));

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var companyId = await User.GetCompanyIdAsync(_context);

        var strategy = _context.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                var task = await _context.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id);
                if (task == null || (companyId.HasValue && task.CompanyId.HasValue && task.CompanyId.Value != companyId.Value))
                    throw new KeyNotFoundException("Tugas tidak ditemukan.");

                // 1. Update Task details
                task.Title = dto.Title.Trim();
                task.Description = dto.Description?.Trim();
                task.Status = dto.Status;
                task.Priority = dto.Priority;
                task.Progress = dto.Status == WorkTaskStatus.Completed ? 100 : Math.Clamp(dto.Progress, 0, 100);
                task.ProjectId = dto.ProjectId;
                task.CategoryId = dto.CategoryId;
                task.AssignedToUserId = dto.AssignedToUserId;
                task.ParentTaskId = dto.ParentTaskId;
                task.Milestone = string.IsNullOrWhiteSpace(dto.Milestone) ? "Implementation" : dto.Milestone.Trim();
                task.Obstacle = dto.Obstacle?.Trim();
                task.Solution = dto.Solution?.Trim();
                task.StartDate = dto.StartDate;
                task.DueDate = dto.DueDate;
                task.Tags = dto.Tags;
                task.UpdatedAt = DateTime.UtcNow;

                // 2. Log manual work session if requested
                if (dto.LogSession && dto.DurationMinutes.HasValue && dto.DurationMinutes.Value > 0)
                {
                    var sessionEndTime = dto.SessionDate ?? DateTime.UtcNow;
                    var sessionStartTime = sessionEndTime.AddMinutes(-dto.DurationMinutes.Value);
                    var durationSeconds = dto.DurationMinutes.Value * 60L;

                    var session = new WorkSession
                    {
                        TaskId = task.Id,
                        UserId = userId,
                        StartTime = sessionStartTime,
                        EndTime = sessionEndTime,
                        Duration = durationSeconds,
                        Notes = dto.SessionNotes?.Trim() ?? "Manual session via Unified Save"
                    };

                    _context.Sessions.Add(session);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            return Ok(ApiResponse<object>.Success(new { id }, "Tugas dan sesi kerja berhasil disimpan secara terpadu."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.Fail("Tugas tidak ditemukan."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Gagal melakukan Unified Save: {ex.Message}"));
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var companyId = await User.GetCompanyIdAsync(_context);
        var task = await _context.Tasks
            .Include(t => t.ChildTasks)
            .Include(t => t.Sessions)
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null || (companyId.HasValue && task.CompanyId.HasValue && task.CompanyId.Value != companyId.Value))
            return NotFound(ApiResponse<object>.Fail("Tugas tidak ditemukan."));

        // If there are child tasks, unparent them
        foreach (var child in task.ChildTasks)
        {
            child.ParentTaskId = null;
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { id }, "Tugas berhasil dihapus."));
    }

    private static WorkTaskDto MapToDto(WorkTask t, bool includeSubtasks = false)
    {
        return new WorkTaskDto
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description,
            Status = t.Status,
            Priority = t.Priority,
            Progress = t.Progress,
            ProjectId = t.ProjectId,
            ProjectName = t.Project?.Name,
            ProjectColor = t.Project?.Color,
            CategoryId = t.CategoryId,
            CategoryName = t.Category?.Name,
            CompanyId = t.CompanyId,
            AssignedToUserId = t.AssignedToUserId,
            AssignedToName = t.AssignedToUser?.FullName ?? t.AssignedToUser?.UserName,
            ParentTaskId = t.ParentTaskId,
            ParentTaskTitle = t.ParentTask?.Title,
            SubtaskCount = t.ChildTasks?.Count ?? 0,
            SubtasksCompletedCount = t.ChildTasks?.Count(c => c.Status == WorkTaskStatus.Completed) ?? 0,
            Milestone = t.Milestone,
            Obstacle = t.Obstacle,
            Solution = t.Solution,
            StartDate = t.StartDate,
            DueDate = t.DueDate,
            Tags = t.Tags,
            TotalSecondsSpent = t.Sessions?.Sum(s => s.Duration) ?? 0,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            Subtasks = includeSubtasks && t.ChildTasks != null
                ? t.ChildTasks.Select(c => MapToDto(c, false)).ToList()
                : new List<WorkTaskDto>()
        };
    }

    [HttpPost("import-excel")]
    public async Task<IActionResult> ImportTasksExcel([FromForm] TaskImportUploadDto dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (dto.File != null && dto.File.Length > 0)
        {
            using var stream = dto.File.OpenReadStream();
            var res = await _importService.ImportTasksFromStreamAsync(stream, dto.File.FileName, currentUserId);
            return Ok(ApiResponse<TaskImportResultDto>.Success(res, $"Berhasil mengimpor {res.SuccessRows} tugas dari berkas Excel."));
        }
        else if (!string.IsNullOrWhiteSpace(dto.FilePath))
        {
            var res = await _importService.ImportTasksFromFilePathAsync(dto.FilePath, currentUserId);
            return Ok(ApiResponse<TaskImportResultDto>.Success(res, $"Berhasil mengimpor {res.SuccessRows} tugas dari path lokal: {dto.FilePath}"));
        }

        return BadRequest(ApiResponse<object>.Fail("Berkas Excel (.xlsx) atau FilePath wajib disediakan."));
    }

    [HttpPost("bulk-update")]
    public async Task<IActionResult> BulkUpdateTasks([FromBody] BulkUpdateTasksRequestDto dto)
    {
        if (dto.TaskIds == null || !dto.TaskIds.Any())
            return BadRequest(ApiResponse<object>.Fail("Pilih setidaknya satu tugas untuk diperbarui."));

        var companyId = await User.GetCompanyIdAsync(_context);
        var query = _context.Tasks.Where(t => dto.TaskIds.Contains(t.Id));
        if (companyId.HasValue)
        {
            query = query.Where(t => t.CompanyId == companyId.Value || (t.CompanyId == null && t.Project.CompanyId == companyId.Value));
        }

        var tasks = await query.ToListAsync();
        if (!tasks.Any())
            return NotFound(ApiResponse<object>.Fail("Tidak ada tugas yang ditemukan sesuai ID yang dipilih."));

        foreach (var task in tasks)
        {
            if (dto.Status.HasValue)
            {
                task.Status = dto.Status.Value;
                if (dto.Status.Value == WorkTaskStatus.Completed)
                    task.Progress = 100;
            }

            if (dto.Priority.HasValue)
            {
                task.Priority = dto.Priority.Value;
            }

            if (dto.AssignedToUserId != null)
            {
                task.AssignedToUserId = string.IsNullOrWhiteSpace(dto.AssignedToUserId) ? null : dto.AssignedToUserId;
            }

            if (dto.Progress.HasValue)
            {
                task.Progress = Math.Clamp(dto.Progress.Value, 0, 100);
            }

            task.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(new { count = tasks.Count }, $"Berhasil memperbarui {tasks.Count} tugas terpilih."));
    }

    [HttpPost("bulk-delete")]
    public async Task<IActionResult> BulkDeleteTasks([FromBody] BulkDeleteTasksRequestDto dto)
    {
        if (dto.TaskIds == null || !dto.TaskIds.Any())
            return BadRequest(ApiResponse<object>.Fail("Pilih setidaknya satu tugas untuk dihapus."));

        var companyId = await User.GetCompanyIdAsync(_context);
        var query = _context.Tasks
            .Include(t => t.ChildTasks)
            .Include(t => t.Sessions)
            .Where(t => dto.TaskIds.Contains(t.Id));

        if (companyId.HasValue)
        {
            query = query.Where(t => t.CompanyId == companyId.Value || (t.CompanyId == null && t.Project.CompanyId == companyId.Value));
        }

        var tasks = await query.ToListAsync();

        if (!tasks.Any())
            return NotFound(ApiResponse<object>.Fail("Tidak ada tugas yang ditemukan sesuai ID yang dipilih."));

        foreach (var task in tasks)
        {
            foreach (var child in task.ChildTasks)
            {
                child.ParentTaskId = null;
            }
        }

        _context.Tasks.RemoveRange(tasks);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { count = tasks.Count }, $"Berhasil menghapus {tasks.Count} tugas terpilih."));
    }

    [HttpGet("export-excel")]
    public async Task<IActionResult> ExportTasksExcel(
        [FromQuery] string? ids,
        [FromQuery] int? projectId,
        [FromQuery] WorkTaskStatus? status,
        [FromQuery] TaskPriority? priority,
        [FromQuery] string? assignedToUserId,
        [FromQuery] string? milestone,
        [FromQuery] string? search)
    {
        var companyId = await User.GetCompanyIdAsync(_context);
        var query = _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.AssignedToUser)
            .AsNoTracking();

        if (companyId.HasValue)
        {
            query = query.Where(t => t.CompanyId == companyId.Value || (t.CompanyId == null && t.Project.CompanyId == companyId.Value));
        }

        if (!string.IsNullOrWhiteSpace(ids))
        {
            var idList = ids.Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(s => int.TryParse(s.Trim(), out var parsed) ? parsed : 0)
                            .Where(i => i > 0)
                            .ToList();
            if (idList.Any())
            {
                query = query.Where(t => idList.Contains(t.Id));
            }
        }

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        if (priority.HasValue)
            query = query.Where(t => t.Priority == priority.Value);

        if (!string.IsNullOrWhiteSpace(assignedToUserId))
            query = query.Where(t => t.AssignedToUserId == assignedToUserId);

        if (!string.IsNullOrWhiteSpace(milestone))
            query = query.Where(t => t.Milestone == milestone);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(s)
                || (t.Description != null && t.Description.ToLower().Contains(s)));
        }

        var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        var dtoList = tasks.Select(t => MapToDto(t, false)).ToList();

        var title = "Daftar Tugas Kerja";
        if (projectId.HasValue)
        {
            var proj = await _context.Projects.FindAsync(projectId.Value);
            if (proj != null) title = $"Daftar Tugas - {proj.Name}";
        }

        var bytes = _closedXmlService.GenerateTaskListExcel(title, dtoList);
        var fileName = $"Daftar_Tugas_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}

public class TaskImportUploadDto
{
    public IFormFile? File { get; set; }
    public string? FilePath { get; set; }
}
