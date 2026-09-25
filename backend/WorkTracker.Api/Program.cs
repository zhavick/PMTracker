using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using WorkTracker.Api.Middlewares;
using WorkTracker.Core.Entities;
using WorkTracker.Infrastructure.Data;
using WorkTracker.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Configuration (Pomelo MySQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Port=3306;Database=worktracker_db;User=tracker_user;Password=TrackerPassword2026!;CharSet=utf8mb4;";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString), mysqlOptions =>
    {
        mysqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
    });
});

// 2. Identity Configuration
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// 3. Register Domain Services
builder.Services.AddHttpClient();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<ClosedXmlService>();
builder.Services.AddScoped<TaskExcelImportService>();
builder.Services.AddScoped<AuditLogActionFilter>();
builder.Services.AddScoped<ISyncService, SyncService>();

// 4. JWT Bearer Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "WorkTrackerPro_SuperSecretKey_Production_2026_Minimum256BitsKey!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "WorkTrackerPro";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "WorkTrackerProClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 5. CORS Configuration
var envFrontendUrl = builder.Configuration["FRONTEND_BASE_URL"] ?? builder.Configuration["CORS_ALLOWED_ORIGINS"];
var allowedOrigins = !string.IsNullOrWhiteSpace(envFrontendUrl)
    ? envFrontendUrl.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    : builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
      ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 6. Controllers & JSON Formatting
builder.Services.AddControllers(options =>
{
    options.Filters.Add<AuditLogActionFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

// 7. Swagger Documentation with JWT & Sync API Key Authorize Modal
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Work Tracker Pro API & Sync Engine",
        Version = "v3.6",
        Description = "Enterprise Work Task Management, Multi-Timer Timesheet Tracking, Attendance & Master Server Synchronization REST API.\n\n" +
                      "**Otorisasi Penggunaan API:**\n" +
                      "- **Bearer JWT Token:** Login via `POST /api/auth/login` untuk mendapatkan token, lalu klik tombol **Authorize** di kanan atas dan masukkan: `Bearer <token_jwt>`\n" +
                      "- **X-Sync-ApiKey:** Untuk modul sinkronisasi antar server, sertakan header `X-Sync-ApiKey` atau atur pada skema otorisasi di bawah.\n" +
                      "- **Server Induk Default:** `https://tracker.saidilmuna.space/`"
    });

    // Add Bearer JWT definition to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.\n\nMasukkan 'Bearer' [spasi] dan token JWT Anda.\n\nContoh: `Bearer eyJhbGciOi...`",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    // Add X-Sync-ApiKey definition to Swagger
    c.AddSecurityDefinition("X-Sync-ApiKey", new OpenApiSecurityScheme
    {
        Description = "Custom API Key header untuk sinkronisasi antar server induk & node lokal.\n\nMasukkan Secret Key yang terdaftar (contoh: `TrackerKerja_Default_Sync_Secret_Key_2026!`).",
        Name = "X-Sync-ApiKey",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header
            },
            new List<string>()
        },
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "X-Sync-ApiKey"
                },
                Name = "X-Sync-ApiKey",
                In = ParameterLocation.Header
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// 8. Auto-Migration & Database Seeding on Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<AppDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

        // Apply migrations
        await dbContext.Database.MigrateAsync();

        // Seed initial data
        await DatabaseSeeder.SeedAsync(dbContext, userManager, roleManager);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Terjadi kesalahan saat menerapkan migrasi atau seeding basis data.");
    }
}

// 9. Middleware Pipeline
if (app.Environment.IsDevelopment() || true) // Enable Swagger in all environments for API documentation
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Work Tracker Pro API & Sync v3.6");
        c.RoutePrefix = "swagger";
        c.EnablePersistAuthorization();
        c.DisplayRequestDuration();
    });
}

app.UseStaticFiles();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
