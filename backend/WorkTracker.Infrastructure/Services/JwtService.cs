using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;

namespace WorkTracker.Infrastructure.Services;

public class JwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public (string Token, DateTime ExpiresAt) GenerateToken(ApplicationUser user, IList<string> roles, string? companyName)
    {
        var keyString = _config["Jwt:Key"] ?? "WorkTrackerPro_SuperSecretKey_Production_2026_Minimum256BitsKey!";
        var issuer = _config["Jwt:Issuer"] ?? "WorkTrackerPro";
        var audience = _config["Jwt:Audience"] ?? "WorkTrackerProClient";
        var expirationMinutes = int.TryParse(_config["Jwt:ExpirationMinutes"], out var exp) ? exp : 1440; // 24 hours default

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim("jobTitle", user.JobTitle),
            new Claim("companyId", user.CompanyId?.ToString() ?? string.Empty),
            new Claim("companyName", companyName ?? string.Empty)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim("role", role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        var tokenHandler = new JwtSecurityTokenHandler();
        return (tokenHandler.WriteToken(token), expiresAt);
    }
}
