using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/notes")]
[Authorize]
public class NotesApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public NotesApiController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotes([FromQuery] string? search, [FromQuery] string? category)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var query = _context.Notes
            .Include(n => n.Task)
            .Include(n => n.AuthorUser)
            .Include(n => n.Attachments)
            .AsNoTracking();

        if (!isAdmin)
        {
            query = query.Where(n => n.AuthorUserId == currentUserId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(n => n.Title.ToLower().Contains(s) || n.ContentHtml.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(n => n.Category == category);
        }

        var notes = await query
            .OrderByDescending(n => n.IsPinned)
            .ThenByDescending(n => n.UpdatedAt)
            .ToListAsync();

        var dtoList = notes.Select(MapToDto).ToList();
        return Ok(ApiResponse<List<WorkNoteDto>>.Success(dtoList));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNoteById(int id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        var note = await _context.Notes
            .Include(n => n.Task)
            .Include(n => n.AuthorUser)
            .Include(n => n.Attachments)
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id);

        if (note == null)
            return NotFound(ApiResponse<object>.Fail("Catatan tidak ditemukan."));

        if (!isAdmin && note.AuthorUserId != currentUserId)
            return Forbid();

        return Ok(ApiResponse<WorkNoteDto>.Success(MapToDto(note)));
    }

    [HttpPost]
    public async Task<IActionResult> CreateNote()
    {
        CreateNoteDto dto;
        var files = new List<IFormFile>();

        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync();
            dto = new CreateNoteDto
            {
                Title = form["title"].ToString(),
                ContentHtml = form["contentHtml"].ToString(),
                Category = string.IsNullOrWhiteSpace(form["category"]) ? "General" : form["category"].ToString(),
                Color = string.IsNullOrWhiteSpace(form["color"]) ? "#6366F1" : form["color"].ToString(),
                IsPinned = bool.TryParse(form["isPinned"], out var p) && p,
                TaskId = int.TryParse(form["taskId"], out var t) ? t : null
            };
            files = form.Files.ToList();
        }
        else
        {
            dto = await System.Text.Json.JsonSerializer.DeserializeAsync<CreateNoteDto>(
                Request.Body, 
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            ) ?? new CreateNoteDto();
        }

        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.ContentHtml))
            return BadRequest(ApiResponse<object>.Fail("Judul dan isi catatan wajib diisi."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FindAsync(currentUserId);
        var username = user?.UserName ?? "user";

        var note = new WorkNote
        {
            Title = dto.Title.Trim(),
            ContentHtml = dto.ContentHtml,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "#6366F1" : dto.Color.Trim(),
            IsPinned = dto.IsPinned,
            TaskId = dto.TaskId,
            AuthorUserId = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Notes.Add(note);
        await _context.SaveChangesAsync();

        // Process attachments if any
        if (files.Count > 0)
        {
            var userUploadDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "notes", username);
            if (!Directory.Exists(userUploadDir))
                Directory.CreateDirectory(userUploadDir);

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                var ext = Path.GetExtension(file.FileName);
                var rawName = Path.GetFileNameWithoutExtension(file.FileName);
                var cleanName = string.Concat(rawName.Split(Path.GetInvalidFileNameChars()));
                var guid8 = Guid.NewGuid().ToString("N")[..8];
                var savedFileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmss}_{guid8}_{cleanName}{ext}";
                var fullFilePath = Path.Combine(userUploadDir, savedFileName);

                using (var stream = new FileStream(fullFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var attachment = new NoteAttachment
                {
                    NoteId = note.Id,
                    FileName = file.FileName,
                    FilePath = $"/uploads/notes/{username}/{savedFileName}",
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    FileExtension = ext,
                    UploadedByUserId = currentUserId,
                    UploadedAt = DateTime.UtcNow
                };

                _context.NoteAttachments.Add(attachment);
            }

            await _context.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetNoteById), new { id = note.Id }, ApiResponse<object>.Success(new { id = note.Id }, "Catatan berhasil dibuat."));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateNote(int id, [FromBody] UpdateNoteDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data input tidak valid."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var note = await _context.Notes.FindAsync(id);
        if (note == null)
            return NotFound(ApiResponse<object>.Fail("Catatan tidak ditemukan."));

        if (!User.IsInRole("Admin") && note.AuthorUserId != currentUserId)
            return Forbid();

        note.Title = dto.Title.Trim();
        note.ContentHtml = dto.ContentHtml;
        note.Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim();
        note.Color = string.IsNullOrWhiteSpace(dto.Color) ? "#6366F1" : dto.Color.Trim();
        note.IsPinned = dto.IsPinned;
        note.TaskId = dto.TaskId;
        note.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(new { id = note.Id }, "Catatan berhasil diperbarui."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNote(int id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var note = await _context.Notes
            .Include(n => n.Attachments)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (note == null)
            return NotFound(ApiResponse<object>.Fail("Catatan tidak ditemukan."));

        if (!User.IsInRole("Admin") && note.AuthorUserId != currentUserId)
            return Forbid();

        // Remove physical files
        foreach (var att in note.Attachments)
        {
            try
            {
                var relativePath = att.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var fullPath = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), relativePath);
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to delete physical file: {ex.Message}");
            }
        }

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(new { id }, "Catatan berhasil dihapus."));
    }

    private static WorkNoteDto MapToDto(WorkNote n)
    {
        return new WorkNoteDto
        {
            Id = n.Id,
            Title = n.Title,
            ContentHtml = n.ContentHtml,
            Category = n.Category,
            Color = n.Color,
            IsPinned = n.IsPinned,
            TaskId = n.TaskId,
            TaskTitle = n.Task?.Title,
            AuthorUserId = n.AuthorUserId,
            AuthorName = n.AuthorUser?.FullName ?? n.AuthorUser?.UserName ?? "User",
            CreatedAt = n.CreatedAt,
            UpdatedAt = n.UpdatedAt,
            Attachments = n.Attachments.Select(a => new NoteAttachmentDto
            {
                Id = a.Id,
                NoteId = a.NoteId,
                FileName = a.FileName,
                FileUrl = a.FilePath,
                FileSize = a.FileSize,
                ContentType = a.ContentType
            }).ToList()
        };
    }
}
