using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Extensions;

public static class UserContextExtensions
{
    public static int? GetCompanyId(this ClaimsPrincipal principal)
    {
        var claimVal = principal.FindFirst("companyId")?.Value;
        if (int.TryParse(claimVal, out var cid) && cid > 0)
            return cid;
        return null;
    }

    public static async Task<int?> GetCompanyIdAsync(this ClaimsPrincipal principal, AppDbContext context)
    {
        var cid = principal.GetCompanyId();
        if (cid.HasValue) return cid.Value;

        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            var userCompanyId = await context.Users
                .Where(u => u.Id == userId)
                .Select(u => u.CompanyId)
                .FirstOrDefaultAsync();
            return userCompanyId;
        }

        return null;
    }
}
