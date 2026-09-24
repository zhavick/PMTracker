using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

using WorkTracker.Api.Extensions;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/members")]
[Authorize]
public class MembersApiController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public MembersApiController(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        AppDbContext context,
        IWebHostEnvironment env)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetMembers(
        [FromQuery] string? search, 
        [FromQuery] bool? pendingOnly,
        [FromQuery] int? companyId)
    {
        var isAdmin = User.IsInRole("Admin");
        var userCompanyId = await User.GetCompanyIdAsync(_context);

        var usersQuery = _userManager.Users
            .Include(u => u.Company)
            .AsNoTracking();

        if (!isAdmin && userCompanyId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.CompanyId == userCompanyId.Value);
        }
        else if (isAdmin && companyId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.CompanyId == companyId.Value);
        }

        if (pendingOnly.HasValue && pendingOnly.Value)
        {
            usersQuery = usersQuery.Where(u => !u.IsApproved);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            usersQuery = usersQuery.Where(u => 
                (u.FullName != null && u.FullName.ToLower().Contains(s)) ||
                (u.Email != null && u.Email.ToLower().Contains(s)) ||
                (u.JobTitle != null && u.JobTitle.ToLower().Contains(s))
            );
        }

        var users = await usersQuery.OrderBy(u => u.FullName).ToListAsync();

        var memberDtos = new List<MemberDto>();
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            var mainRole = roles.FirstOrDefault() ?? "User";

            var taskCount = await _context.Tasks.CountAsync(t => t.AssignedToUserId == u.Id);
            var totalSeconds = await _context.Sessions
                .Where(s => s.UserId == u.Id)
                .SumAsync(s => s.Duration);

            memberDtos.Add(new MemberDto
            {
                Id = u.Id,
                UserName = u.UserName ?? string.Empty,
                Email = u.Email ?? string.Empty,
                FullName = u.FullName ?? u.UserName ?? "Anggota",
                JobTitle = u.JobTitle ?? "Anggota Tim",
                Department = u.Company?.Name ?? "Tim Teknis",
                CompanyId = u.CompanyId,
                CompanyName = u.Company?.Name,
                PhoneNumber = u.PhoneNumber,
                Role = mainRole,
                IsApproved = u.IsApproved,
                IsActive = u.IsApproved,
                AvatarUrl = u.ProfilePictureUrl,
                CoverPictureUrl = u.CoverPictureUrl,
                AvatarColor = u.AvatarColor,
                TotalTasksAssigned = taskCount,
                TotalHoursLogged = Math.Round(totalSeconds / 3600.0, 1),
                CreatedAt = u.CreatedAt
            });
        }

        return Ok(ApiResponse<List<MemberDto>>.Success(memberDtos));
    }

    [HttpGet("companies")]
    public async Task<IActionResult> GetCompanies()
    {
        var isAdmin = User.IsInRole("Admin");
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
                MemberCount = c.Users.Count
            })
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(ApiResponse<object>.Success(list));
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleManager.Roles
            .OrderBy(r => r.Name)
            .Select(r => r.Name!)
            .ToListAsync();
        return Ok(ApiResponse<List<string>>.Success(roles));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,PM,Project Manager,ProjectManager")]
    public async Task<IActionResult> UpdateMember(string id, [FromBody] UpdateMemberProfileDto dto)
    {
        var targetUser = await _userManager.FindByIdAsync(id);
        if (targetUser == null)
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var currentUser = await _userManager.FindByIdAsync(currentUserId!);
        if (currentUser == null)
            return Unauthorized();

        var currentRoles = await _userManager.GetRolesAsync(currentUser);
        var isAdmin = currentRoles.Contains("Admin");
        var isPM = currentRoles.Contains("PM") || currentRoles.Contains("Project Manager") || currentRoles.Contains("ProjectManager");

        var targetRoles = await _userManager.GetRolesAsync(targetUser);

        // Jika pemanggil adalah PM (bukan Admin)
        if (!isAdmin && isPM)
        {
            // 1. Verifikasi isolasi perusahaan
            if (targetUser.CompanyId != currentUser.CompanyId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, 
                    ApiResponse<object>.Fail("Project Manager hanya dapat mengubah informasi member pada perusahaan yang sama."));
            }

            // 2. PM tidak boleh mengubah user dengan peran Administrator
            if (targetRoles.Contains("Admin"))
            {
                return StatusCode(StatusCodes.Status403Forbidden, 
                    ApiResponse<object>.Fail("Project Manager tidak memiliki hak akses untuk mengubah akun Administrator."));
            }

            // 3. PM HANYA boleh mengubah Nama (FullName) dan Role
            if (!string.IsNullOrWhiteSpace(dto.FullName))
            {
                targetUser.FullName = dto.FullName.Trim();
            }

            if (!string.IsNullOrWhiteSpace(dto.Role))
            {
                // PM tidak boleh mempromosikan user menjadi Admin
                if (dto.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, 
                        ApiResponse<object>.Fail("Project Manager tidak diizinkan memberikan peran Administrator."));
                }

                if (await _roleManager.RoleExistsAsync(dto.Role))
                {
                    await _userManager.RemoveFromRolesAsync(targetUser, targetRoles);
                    await _userManager.AddToRoleAsync(targetUser, dto.Role);
                }
                else
                {
                    return BadRequest(ApiResponse<object>.Fail($"Peran '{dto.Role}' tidak valid."));
                }
            }
        }
        else if (isAdmin)
        {
            // Admin memiliki akses penuh mengubah profil
            if (!string.IsNullOrWhiteSpace(dto.FullName))
                targetUser.FullName = dto.FullName.Trim();

            if (dto.JobTitle != null)
                targetUser.JobTitle = dto.JobTitle.Trim();

            if (dto.PhoneNumber != null)
                targetUser.PhoneNumber = dto.PhoneNumber.Trim();

            if (dto.CompanyId.HasValue && dto.CompanyId.Value > 0)
                targetUser.CompanyId = dto.CompanyId.Value;

            if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email.Trim().ToLowerInvariant() != targetUser.Email?.ToLowerInvariant())
            {
                var cleanEmail = dto.Email.Trim();
                var existing = await _userManager.FindByEmailAsync(cleanEmail);
                if (existing != null && existing.Id != targetUser.Id)
                {
                    return BadRequest(ApiResponse<object>.Fail("Alamat email sudah digunakan oleh pengguna lain."));
                }
                targetUser.Email = cleanEmail;
                targetUser.UserName = cleanEmail;
            }

            if (!string.IsNullOrWhiteSpace(dto.Role))
            {
                if (await _roleManager.RoleExistsAsync(dto.Role))
                {
                    await _userManager.RemoveFromRolesAsync(targetUser, targetRoles);
                    await _userManager.AddToRoleAsync(targetUser, dto.Role);
                }
                else
                {
                    return BadRequest(ApiResponse<object>.Fail($"Peran '{dto.Role}' tidak valid."));
                }
            }

            if (dto.ProfilePictureUrl != null) targetUser.ProfilePictureUrl = string.IsNullOrWhiteSpace(dto.ProfilePictureUrl) ? null : dto.ProfilePictureUrl.Trim();
            else if (dto.AvatarUrl != null) targetUser.ProfilePictureUrl = string.IsNullOrWhiteSpace(dto.AvatarUrl) ? null : dto.AvatarUrl.Trim();

            if (dto.CoverPictureUrl != null) targetUser.CoverPictureUrl = string.IsNullOrWhiteSpace(dto.CoverPictureUrl) ? null : dto.CoverPictureUrl.Trim();

            if (!string.IsNullOrWhiteSpace(dto.AvatarColor)) targetUser.AvatarColor = dto.AvatarColor.Trim();
        }

        var updateResult = await _userManager.UpdateAsync(targetUser);
        if (!updateResult.Succeeded)
        {
            var errors = updateResult.Errors.Select(e => e.Description).ToList();
            return BadRequest(ApiResponse<object>.Fail("Gagal memperbarui informasi pengguna.", errors));
        }

        return Ok(ApiResponse<object>.Success(new { id = targetUser.Id, fullName = targetUser.FullName }, "Informasi member berhasil diperbarui."));
    }

    [HttpPut("{id}/approval")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateApproval(string id, [FromBody] ApproveUserDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        user.IsApproved = dto.IsApproved;
        if (!dto.IsApproved && !string.IsNullOrWhiteSpace(dto.RejectionReason))
        {
            user.RejectionReason = dto.RejectionReason;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(ApiResponse<object>.Fail("Gagal memperbarui status persetujuan."));

        return Ok(ApiResponse<object>.Success(
            new { id = user.Id, isApproved = user.IsApproved }, 
            dto.IsApproved ? "Akun pengguna berhasil disetujui." : "Pendaftaran akun telah ditolak."
        ));
    }

    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "Admin,PM,Project Manager,ProjectManager")]
    public async Task<IActionResult> AdminResetPassword(string id, [FromBody] AdminResetPasswordDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Kata sandi baru tidak memenuhi syarat minimal 6 karakter."));

        var targetUser = await _userManager.FindByIdAsync(id);
        if (targetUser == null)
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var currentUser = await _userManager.FindByIdAsync(currentUserId!);
        if (currentUser == null)
            return Unauthorized();

        var currentRoles = await _userManager.GetRolesAsync(currentUser);
        var isAdmin = currentRoles.Contains("Admin");
        var isPM = currentRoles.Contains("PM") || currentRoles.Contains("Project Manager") || currentRoles.Contains("ProjectManager");
        var targetRoles = await _userManager.GetRolesAsync(targetUser);

        // Jika pemanggil adalah PM (bukan Admin)
        if (!isAdmin && isPM)
        {
            if (targetUser.CompanyId != currentUser.CompanyId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, 
                    ApiResponse<object>.Fail("Project Manager hanya dapat mereset kata sandi member di perusahaan yang sama."));
            }

            if (targetRoles.Contains("Admin"))
            {
                return StatusCode(StatusCodes.Status403Forbidden, 
                    ApiResponse<object>.Fail("Project Manager tidak dapat mereset kata sandi Administrator."));
            }
        }

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(targetUser);
        var result = await _userManager.ResetPasswordAsync(targetUser, resetToken, dto.NewPassword);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(ApiResponse<object>.Fail("Gagal mereset kata sandi pengguna.", errors));
        }

        return Ok(ApiResponse<object>.Success(new { id = targetUser.Id }, $"Kata sandi untuk pengguna {targetUser.FullName} berhasil diperbarui."));
    }

    [HttpDelete("{id}/permanent")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PermanentDeleteUser(string id, [FromBody] PermanentDeleteUserDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data konfirmasi tidak lengkap."));

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var adminUser = await _userManager.FindByIdAsync(adminId!);
        if (adminUser == null)
            return Unauthorized();

        // 1. Verify admin's own password
        var isPasswordValid = await _userManager.CheckPasswordAsync(adminUser, dto.AdminPassword);
        if (!isPasswordValid)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Kata sandi Administrator yang Anda masukkan salah."));
        }

        // 2. Prevent self-deletion
        if (adminId == id)
        {
            return BadRequest(ApiResponse<object>.Fail("Administrator tidak dapat menghapus akun miliknya sendiri."));
        }

        var targetUser = await _userManager.FindByIdAsync(id);
        if (targetUser == null)
            return NotFound(ApiResponse<object>.Fail("Pengguna target tidak ditemukan."));

        // 3. Verify exact full name match
        var expectedName = targetUser.FullName?.Trim().ToLowerInvariant() ?? targetUser.UserName?.Trim().ToLowerInvariant();
        var confirmedName = dto.FullNameConfirmation.Trim().ToLowerInvariant();
        if (expectedName != confirmedName)
        {
            return BadRequest(ApiResponse<object>.Fail("Teks konfirmasi nama lengkap tidak sesuai dengan data pengguna."));
        }

        // 4. Safely unassign or clean up related entities
        var assignedTasks = await _context.Tasks.Where(t => t.AssignedToUserId == id).ToListAsync();
        foreach (var task in assignedTasks)
        {
            task.AssignedToUserId = null;
        }

        var attendances = await _context.Attendances.Where(a => a.UserId == id).ToListAsync();
        _context.Attendances.RemoveRange(attendances);

        var sessions = await _context.Sessions.Where(s => s.UserId == id).ToListAsync();
        _context.Sessions.RemoveRange(sessions);

        await _context.SaveChangesAsync();

        // 5. Delete identity user
        var result = await _userManager.DeleteAsync(targetUser);
        if (!result.Succeeded)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<object>.Fail("Gagal menghapus pengguna dari basis data Identity."));
        }

        return Ok(ApiResponse<object>.Success(new { id }, $"Pengguna {targetUser.FullName} berhasil dihapus permanen dari sistem."));
    }

    [HttpPost("profile/cover")]
    public async Task<IActionResult> UploadCoverPicture([FromForm] UploadImageFileDto model)
    {
        var file = model.File;
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Fail("Berkas gambar tidak ditemukan."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(currentUserId!);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var coversDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "covers");
        if (!Directory.Exists(coversDir))
            Directory.CreateDirectory(coversDir);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{user.UserName}_cover_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";
        var fullPath = Path.Combine(coversDir, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.CoverPictureUrl = $"/uploads/covers/{fileName}";
        await _userManager.UpdateAsync(user);

        return Ok(ApiResponse<object>.Success(new { coverPictureUrl = user.CoverPictureUrl }, "Foto sampul profil berhasil diperbarui."));
    }

    [HttpPost("profile/avatar")]
    public async Task<IActionResult> UploadAvatarPicture([FromForm] UploadImageFileDto model)
    {
        var file = model.File;
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Fail("Berkas gambar tidak ditemukan."));

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(currentUserId!);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var avatarsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "avatars");
        if (!Directory.Exists(avatarsDir))
            Directory.CreateDirectory(avatarsDir);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{user.UserName}_avatar_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";
        var fullPath = Path.Combine(avatarsDir, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.ProfilePictureUrl = $"/uploads/avatars/{fileName}";
        await _userManager.UpdateAsync(user);

        return Ok(ApiResponse<object>.Success(new { profilePictureUrl = user.ProfilePictureUrl }, "Foto profil berhasil diperbarui."));
    }

    [HttpPost("{id}/avatar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadMemberAvatar(string id, [FromForm] UploadImageFileDto model)
    {
        var file = model.File;
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Fail("Berkas gambar tidak ditemukan."));

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var avatarsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "avatars");
        if (!Directory.Exists(avatarsDir))
            Directory.CreateDirectory(avatarsDir);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{user.UserName}_avatar_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";
        var fullPath = Path.Combine(avatarsDir, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.ProfilePictureUrl = $"/uploads/avatars/{fileName}";
        await _userManager.UpdateAsync(user);

        return Ok(ApiResponse<object>.Success(new { profilePictureUrl = user.ProfilePictureUrl }, $"Foto profil {user.FullName} berhasil diperbarui."));
    }

    [HttpPost("{id}/cover")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadMemberCover(string id, [FromForm] UploadImageFileDto model)
    {
        var file = model.File;
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Fail("Berkas gambar tidak ditemukan."));

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Pengguna tidak ditemukan."));

        var coversDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "covers");
        if (!Directory.Exists(coversDir))
            Directory.CreateDirectory(coversDir);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{user.UserName}_cover_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";
        var fullPath = Path.Combine(coversDir, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.CoverPictureUrl = $"/uploads/covers/{fileName}";
        await _userManager.UpdateAsync(user);

        return Ok(ApiResponse<object>.Success(new { coverPictureUrl = user.CoverPictureUrl }, $"Foto sampul {user.FullName} berhasil diperbarui."));
    }
}

public class UploadImageFileDto
{
    public IFormFile? File { get; set; }
}
