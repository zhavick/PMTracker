using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public TicketsApiController(AppDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var total = await _context.Tickets.CountAsync();
        var open = await _context.Tickets.CountAsync(t => t.Status == TicketStatus.Open);
        var inProgress = await _context.Tickets.CountAsync(t => t.Status == TicketStatus.InProgress);
        var resolved = await _context.Tickets.CountAsync(t => t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed);
        var critical = await _context.Tickets.CountAsync(t => t.Priority == TicketPriority.Critical && t.Status != TicketStatus.Closed && t.Status != TicketStatus.Rejected);
        var myAssigned = await _context.Tickets.CountAsync(t => t.AssignedToUserId == currentUserId && t.Status != TicketStatus.Closed);
        var myReported = await _context.Tickets.CountAsync(t => t.CreatedByUserId == currentUserId);

        return Ok(ApiResponse<object>.Success(new
        {
            total,
            open,
            inProgress,
            resolved,
            critical,
            myAssigned,
            myReported
        }));
    }

    [HttpGet]
    public async Task<IActionResult> GetTickets(
        [FromQuery] TicketStatus? status,
        [FromQuery] TicketPriority? priority,
        [FromQuery] TicketCategory? category,
        [FromQuery] int? projectId,
        [FromQuery] string? assignedToUserId,
        [FromQuery] string? createdByUserId,
        [FromQuery] string? search)
    {
        var query = _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Project)
            .Include(t => t.Comments)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        if (priority.HasValue)
            query = query.Where(t => t.Priority == priority.Value);

        if (category.HasValue)
            query = query.Where(t => t.Category == category.Value);

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        if (!string.IsNullOrEmpty(assignedToUserId))
            query = query.Where(t => t.AssignedToUserId == assignedToUserId);

        if (!string.IsNullOrEmpty(createdByUserId))
            query = query.Where(t => t.CreatedByUserId == createdByUserId);

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(s) 
                || t.TicketNumber.ToLower().Contains(s)
                || t.Description.ToLower().Contains(s));
        }

        var tickets = await query
            .OrderByDescending(t => t.Priority == TicketPriority.Critical)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.TicketNumber,
                t.Title,
                t.Description,
                Category = t.Category.ToString(),
                Priority = t.Priority.ToString(),
                Status = t.Status.ToString(),
                t.ProjectId,
                ProjectName = t.Project != null ? t.Project.Name : null,
                t.CreatedByUserId,
                CreatedByName = t.CreatedByUser != null ? (t.CreatedByUser.FullName ?? t.CreatedByUser.UserName) : "Pengguna",
                CreatedByAvatarColor = t.CreatedByUser != null ? t.CreatedByUser.AvatarColor : "#6366F1",
                t.AssignedToUserId,
                AssignedToName = t.AssignedToUser != null ? (t.AssignedToUser.FullName ?? t.AssignedToUser.UserName) : null,
                AssignedToAvatarColor = t.AssignedToUser != null ? t.AssignedToUser.AvatarColor : "#10B981",
                t.ResolutionNotes,
                t.ResolvedAt,
                t.ClosedAt,
                t.CreatedAt,
                t.UpdatedAt,
                CommentCount = t.Comments.Count
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Success(tickets));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTicketById(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Project)
            .Include(t => t.Comments)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
            return NotFound(ApiResponse<object>.Fail("Tiket tidak ditemukan."));

        var result = new
        {
            ticket.Id,
            ticket.TicketNumber,
            ticket.Title,
            ticket.Description,
            Category = ticket.Category.ToString(),
            Priority = ticket.Priority.ToString(),
            Status = ticket.Status.ToString(),
            ticket.ProjectId,
            ProjectName = ticket.Project != null ? ticket.Project.Name : null,
            ticket.CreatedByUserId,
            CreatedByName = ticket.CreatedByUser != null ? (ticket.CreatedByUser.FullName ?? ticket.CreatedByUser.UserName) : "Pengguna",
            CreatedByEmail = ticket.CreatedByUser?.Email,
            CreatedByAvatarColor = ticket.CreatedByUser != null ? ticket.CreatedByUser.AvatarColor : "#6366F1",
            ticket.AssignedToUserId,
            AssignedToName = ticket.AssignedToUser != null ? (ticket.AssignedToUser.FullName ?? ticket.AssignedToUser.UserName) : null,
            AssignedToEmail = ticket.AssignedToUser?.Email,
            AssignedToAvatarColor = ticket.AssignedToUser != null ? ticket.AssignedToUser.AvatarColor : "#10B981",
            ticket.ResolutionNotes,
            ticket.ResolvedAt,
            ticket.ClosedAt,
            ticket.CreatedAt,
            ticket.UpdatedAt,
            Comments = ticket.Comments.OrderBy(c => c.CreatedAt).Select(c => new
            {
                c.Id,
                c.TicketId,
                c.UserId,
                UserName = c.User != null ? (c.User.FullName ?? c.User.UserName) : "Pengguna",
                UserEmail = c.User?.Email,
                UserAvatarColor = c.User != null ? c.User.AvatarColor : "#6366F1",
                c.Message,
                c.IsInternal,
                c.CreatedAt
            }).ToList()
        };

        return Ok(ApiResponse<object>.Success(result));
    }

    [HttpPost]
    public async Task<IActionResult> CreateTicket([FromBody] CreateTicketRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.Description))
            return BadRequest(ApiResponse<object>.Fail("Judul dan deskripsi tiket wajib diisi."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Generate Ticket Number: TCK-YYYYMM-XXXX
        var datePrefix = DateTime.UtcNow.ToString("yyyyMM");
        var countThisMonth = await _context.Tickets
            .CountAsync(t => t.TicketNumber.StartsWith($"TCK-{datePrefix}"));

        var ticketNumber = $"TCK-{datePrefix}-{(countThisMonth + 1):D4}";

        var ticket = new Ticket
        {
            TicketNumber = ticketNumber,
            Title = req.Title.Trim(),
            Description = req.Description.Trim(),
            Category = req.Category,
            Priority = req.Priority,
            Status = TicketStatus.Open,
            ProjectId = req.ProjectId,
            CreatedByUserId = currentUserId!,
            AssignedToUserId = req.AssignedToUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(new { ticket.Id, ticket.TicketNumber }, $"Tiket #{ticket.TicketNumber} berhasil dilaporkan!"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTicket(int id, [FromBody] UpdateTicketRequest req)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return NotFound(ApiResponse<object>.Fail("Tiket tidak ditemukan."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && ticket.CreatedByUserId != currentUserId && ticket.AssignedToUserId != currentUserId)
            return Forbid();

        ticket.Title = req.Title.Trim();
        ticket.Description = req.Description.Trim();
        ticket.Category = req.Category;
        ticket.Priority = req.Priority;
        ticket.ProjectId = req.ProjectId;
        ticket.AssignedToUserId = req.AssignedToUserId;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Success(ticket, "Data tiket berhasil diperbarui."));
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTicketStatusRequest req)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return NotFound(ApiResponse<object>.Fail("Tiket tidak ditemukan."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        ticket.Status = req.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

        if (req.Status == TicketStatus.Resolved)
        {
            ticket.ResolvedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(req.ResolutionNotes))
                ticket.ResolutionNotes = req.ResolutionNotes.Trim();
        }
        else if (req.Status == TicketStatus.Closed)
        {
            ticket.ClosedAt = DateTime.UtcNow;
        }

        if (!string.IsNullOrWhiteSpace(req.ResolutionNotes))
            ticket.ResolutionNotes = req.ResolutionNotes.Trim();

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(ticket, $"Status tiket #{ticket.TicketNumber} diperbarui menjadi {ticket.Status}."));
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddTicketCommentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Message))
            return BadRequest(ApiResponse<object>.Fail("Pesan komentar tidak boleh kosong."));

        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return NotFound(ApiResponse<object>.Fail("Tiket tidak ditemukan."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var comment = new TicketComment
        {
            TicketId = id,
            UserId = currentUserId!,
            Message = req.Message.Trim(),
            IsInternal = req.IsInternal,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketComments.Add(comment);
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var user = await _userManager.FindByIdAsync(currentUserId!);

        var responseData = new
        {
            comment.Id,
            comment.TicketId,
            comment.UserId,
            UserName = user != null ? (user.FullName ?? user.UserName) : "Pengguna",
            UserEmail = user?.Email,
            UserAvatarColor = user?.AvatarColor ?? "#6366F1",
            comment.Message,
            comment.IsInternal,
            comment.CreatedAt
        };

        return Ok(ApiResponse<object>.Success(responseData, "Komentar berhasil ditambahkan."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return NotFound(ApiResponse<object>.Fail("Tiket tidak ditemukan."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && (ticket.CreatedByUserId != currentUserId || ticket.Status != TicketStatus.Open))
            return Forbid();

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Success(null, $"Tiket #{ticket.TicketNumber} berhasil dihapus."));
    }
}

public class CreateTicketRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketCategory Category { get; set; } = TicketCategory.Bug;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public int? ProjectId { get; set; }
    public string? AssignedToUserId { get; set; }
}

public class UpdateTicketRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketCategory Category { get; set; } = TicketCategory.Bug;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public int? ProjectId { get; set; }
    public string? AssignedToUserId { get; set; }
}

public class UpdateTicketStatusRequest
{
    public TicketStatus Status { get; set; }
    public string? ResolutionNotes { get; set; }
}

public class AddTicketCommentRequest
{
    public string Message { get; set; } = string.Empty;
    public bool IsInternal { get; set; } = false;
}
