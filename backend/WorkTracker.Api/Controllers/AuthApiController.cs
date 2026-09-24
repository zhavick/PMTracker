using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;
using WorkTracker.Infrastructure.Services;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthApiController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;

    public AuthApiController(UserManager<ApplicationUser> userManager, AppDbContext context, JwtService jwtService)
    {
        _userManager = userManager;
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data login tidak valid."));

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return Unauthorized(ApiResponse<object>.Fail("Email atau kata sandi tidak sesuai."));

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, model.Password);
        if (!isPasswordValid)
            return Unauthorized(ApiResponse<object>.Fail("Email atau kata sandi tidak sesuai."));

        // Admin Approval Check
        if (!user.IsApproved)
        {
            return StatusCode(StatusCodes.Status403Forbidden, 
                ApiResponse<object>.Fail("Akun Anda sedang menunggu persetujuan (approval) dari Administrator. Silakan hubungi admin tim Anda."));
        }

        var roles = await _userManager.GetRolesAsync(user);
        var company = user.CompanyId.HasValue ? await _context.Companies.FindAsync(user.CompanyId.Value) : null;

        var (token, expiresAt) = _jwtService.GenerateToken(user, roles, company?.Name);

        var response = new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                JobTitle = user.JobTitle,
                AvatarColor = user.AvatarColor,
                ProfilePictureUrl = user.ProfilePictureUrl,
                CoverPictureUrl = user.CoverPictureUrl,
                CompanyId = user.CompanyId,
                CompanyName = company?.Name,
                Role = roles.FirstOrDefault() ?? "User",
                IsApproved = user.IsApproved
            }
        };

        return Ok(ApiResponse<AuthResponseDto>.Success(response, "Login berhasil."));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data pendaftaran tidak valid."));

        var existingUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingUser != null)
            return BadRequest(ApiResponse<object>.Fail("Alamat email sudah terdaftar."));

        int? companyId = null;

        if (model.CompanyOption == "new" && !string.IsNullOrWhiteSpace(model.NewCompanyName))
        {
            var newCompany = new Company
            {
                Name = model.NewCompanyName.Trim(),
                Code = string.IsNullOrWhiteSpace(model.NewCompanyCode) ? model.NewCompanyName.Substring(0, Math.Min(5, model.NewCompanyName.Length)).ToUpper() : model.NewCompanyCode.Trim().ToUpper(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Companies.Add(newCompany);
            await _context.SaveChangesAsync();
            companyId = newCompany.Id;
        }
        else if (model.ExistingCompanyId.HasValue)
        {
            var company = await _context.Companies.FindAsync(model.ExistingCompanyId.Value);
            if (company != null) companyId = company.Id;
        }

        // Fallback to first company if none selected
        if (!companyId.HasValue)
        {
            var defaultCompany = await _context.Companies.FirstOrDefaultAsync();
            companyId = defaultCompany?.Id;
        }

        var newUser = new ApplicationUser
        {
            UserName = model.Email,
            Email = model.Email,
            FullName = model.FullName,
            JobTitle = model.JobTitle,
            AvatarColor = "#6366F1",
            CompanyId = companyId,
            IsApproved = false, // Default requires Admin approval
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(newUser, model.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(ApiResponse<object>.Fail("Gagal mendaftarkan akun.", errors));
        }

        await _userManager.AddToRoleAsync(newUser, "User");

        return Ok(ApiResponse<object>.Success(
            new { userId = newUser.Id, email = newUser.Email }, 
            "Pendaftaran akun berhasil. Akun Anda sedang menunggu persetujuan (approval) dari Administrator."));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Pengguna tidak terautentikasi."));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Data pengguna tidak ditemukan."));

        var roles = await _userManager.GetRolesAsync(user);
        var company = user.CompanyId.HasValue ? await _context.Companies.FindAsync(user.CompanyId.Value) : null;

        var profile = new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            JobTitle = user.JobTitle,
            AvatarColor = user.AvatarColor,
            ProfilePictureUrl = user.ProfilePictureUrl,
            CoverPictureUrl = user.CoverPictureUrl,
            CompanyId = user.CompanyId,
            CompanyName = company?.Name,
            Role = roles.FirstOrDefault() ?? "User",
            IsApproved = user.IsApproved
        };

        return Ok(ApiResponse<UserProfileDto>.Success(profile));
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UserProfileDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Pengguna tidak terautentikasi."));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Data pengguna tidak ditemukan."));

        user.FullName = model.FullName;
        user.JobTitle = model.JobTitle;
        if (!string.IsNullOrWhiteSpace(model.AvatarColor)) user.AvatarColor = model.AvatarColor;
        if (model.ProfilePictureUrl != null) user.ProfilePictureUrl = model.ProfilePictureUrl;
        if (model.CoverPictureUrl != null) user.CoverPictureUrl = model.CoverPictureUrl;

        await _userManager.UpdateAsync(user);
        return Ok(ApiResponse<object>.Success(null, "Profil berhasil diperbarui."));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Data kata sandi baru tidak valid."));

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<object>.Fail("Pengguna tidak terautentikasi."));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Data pengguna tidak ditemukan."));

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(ApiResponse<object>.Fail("Gagal mengubah kata sandi. Pastikan kata sandi lama Anda benar.", errors));
        }

        return Ok(ApiResponse<object>.Success(null, "Kata sandi Anda berhasil diperbarui."));
    }
}
