using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc.Filters;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Api.Middlewares;

public class AuditLogActionFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _serviceProvider;

    public AuditLogActionFilter(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var stopwatch = Stopwatch.StartNew();
        var resultContext = await next();
        stopwatch.Stop();

        var httpMethod = context.HttpContext.Request.Method;
        // Only log mutating operations (POST, PUT, DELETE, PATCH)
        if (httpMethod is "POST" or "PUT" or "DELETE" or "PATCH")
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var user = context.HttpContext.User;
                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
                var userEmail = user.FindFirstValue(ClaimTypes.Email);
                var userName = user.FindFirstValue(ClaimTypes.Name);

                var controllerName = context.RouteData.Values["controller"]?.ToString();
                var actionName = context.RouteData.Values["action"]?.ToString();
                var path = context.HttpContext.Request.Path.ToString();
                var queryString = context.HttpContext.Request.QueryString.ToString();
                var ipAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString();
                var statusCode = context.HttpContext.Response.StatusCode;

                var log = new AuditLog
                {
                    UserId = userId,
                    UserEmail = userEmail,
                    UserName = userName,
                    ControllerName = controllerName,
                    ActionName = actionName,
                    HttpMethod = httpMethod,
                    Path = path,
                    QueryString = string.IsNullOrEmpty(queryString) ? null : queryString,
                    IpAddress = ipAddress,
                    StatusCode = statusCode,
                    DurationMs = (int)stopwatch.ElapsedMilliseconds,
                    Timestamp = DateTime.UtcNow
                };

                db.AuditLogs.Add(log);
                await db.SaveChangesAsync();
            }
            catch
            {
                // Background audit logging must never break user transactions
            }
        }
    }
}
