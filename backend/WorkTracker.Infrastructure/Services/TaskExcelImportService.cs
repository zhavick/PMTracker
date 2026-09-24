using System.Globalization;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.DTOs;
using WorkTracker.Core.Entities;
using WorkTracker.Core.Enums;
using WorkTracker.Infrastructure.Data;

namespace WorkTracker.Infrastructure.Services;

public class TaskExcelImportService
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;

    private static readonly Dictionary<string, (string Email, string FullName, string JobTitle, string Role)> MemberProfiles = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Syafix", ("syafix.said@elistec.com", "Syafix Said", "Business Analyst", "System Analyst") },
        { "Haviz", ("haviz.indra@elistec.com", "Haviz Indra", "Lead Software Engineer", "User") },
        { "Danang", ("mohammad.danang@elistec.com", "Mohammad Danang", "Quality Assurance & Tester", "User") },
        { "Atha", ("athallah.bariq@elistec.com", "Athallah Bariq", "Technical Writer", "Technical Writer") },
        { "Iqbal", ("iqbal.ali@elistec.com", "Iqbal Ali", "Software Engineer", "User") },
        { "Glenn", ("glenn.hakim@elistec.com", "Glenn Hakim", "Software Engineer", "User") },
        { "Heni", ("heni.rahayu@elistec.com", "Heni Rahayu", "Software Engineer", "User") },
    };

    private static readonly string[] ProjectColors = new[]
    {
        "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E",
        "#10B981", "#14B8A6", "#06B6D4", "#F59E0B", "#D97706"
    };

    public TaskExcelImportService(
        AppDbContext context, 
        UserManager<ApplicationUser> userManager, 
        RoleManager<ApplicationRole> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task<TaskImportResultDto> ImportTasksFromFilePathAsync(string filePath, string? importedByUserId)
    {
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"Berkas Excel tidak ditemukan pada path: {filePath}");
        }

        using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        return await ImportTasksFromStreamAsync(stream, Path.GetFileName(filePath), importedByUserId);
    }

    public async Task<TaskImportResultDto> ImportTasksFromStreamAsync(Stream stream, string fileName, string? importedByUserId)
    {
        var result = new TaskImportResultDto();

        // 1. Resolve default company
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Code == "ELISTEC") 
                     ?? await _context.Companies.FirstOrDefaultAsync();

        if (company == null)
        {
            company = new Company
            {
                Name = "PT Elistec Teknologi",
                Code = "ELISTEC",
                Description = "Perusahaan Utama",
                CreatedAt = DateTime.UtcNow
            };
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();
        }

        int companyId = company.Id;

        // Caches for fast lookup
        var projectCache = await _context.Projects
            .Where(p => p.CompanyId == companyId)
            .ToDictionaryAsync(p => p.Name.Trim(), p => p, StringComparer.OrdinalIgnoreCase);

        var userCache = await _context.Users
            .Where(u => u.CompanyId == companyId || u.CompanyId == null)
            .ToDictionaryAsync(u => (u.Email ?? u.UserName ?? "").Trim(), u => u, StringComparer.OrdinalIgnoreCase);

        using var workbook = new XLWorkbook(stream);

        // Determine sheets to process (exclude metadata/lookup/formula-only sheets)
        var sheetsToProcess = new List<IXLWorksheet>();
        foreach (var ws in workbook.Worksheets)
        {
            var sheetName = ws.Name.Trim();
            if (sheetName.Equals("Lookup", StringComparison.OrdinalIgnoreCase) ||
                sheetName.Equals("RealTime_Dashboard", StringComparison.OrdinalIgnoreCase) ||
                sheetName.Equals("Master_Data", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }
            sheetsToProcess.Add(ws);
        }

        if (sheetsToProcess.Count == 0)
        {
            sheetsToProcess = workbook.Worksheets.Where(w => w.Visibility == XLWorksheetVisibility.Visible).ToList();
        }

        var newTasks = new List<WorkTask>();

        foreach (var ws in sheetsToProcess)
        {
            var sheetName = ws.Name.Trim();

            // 1. Cari email untuk user ini pada lembar kerja
            var picEmail = FindEmailForSheet(ws, sheetName);
            var picFullName = DeriveFullName(sheetName, picEmail);
            var picJobTitle = MemberProfiles.TryGetValue(sheetName, out var mp) ? mp.JobTitle : "Team Member";
            var picRole = MemberProfiles.TryGetValue(sheetName, out var mpRole) ? mpRole.Role : "User";

            // 2. Daftarkan user ke sistem dengan password default 'Password123!'
            var picUser = await EnsureUserAsync(picEmail, picFullName, picJobTitle, picRole, companyId, userCache, result);

            int lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
            if (lastRow < 2) continue;

            for (int r = 2; r <= lastRow; r++)
            {
                var row = ws.Row(r);
                var title = row.Cell(4).GetString()?.Trim();

                if (string.IsNullOrWhiteSpace(title))
                {
                    continue;
                }

                result.TotalRows++;

                try
                {
                    // Nama project menggunakan Kolom 2. Jika belum ada di sistem, import nama project tersebut.
                    var projectName = row.Cell(2).GetString()?.Trim();
                    int? projectId = null;

                    if (!string.IsNullOrWhiteSpace(projectName))
                    {
                        if (!projectCache.TryGetValue(projectName, out var proj))
                        {
                            proj = new Project
                            {
                                Name = projectName,
                                Description = $"Proyek {projectName} diimpor dari Task Tracker",
                                Color = ProjectColors[Math.Abs(projectName.GetHashCode()) % ProjectColors.Length],
                                CompanyId = companyId,
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.Projects.Add(proj);
                            await _context.SaveChangesAsync();
                            projectCache[projectName] = proj;
                            result.ProjectsCreated++;
                            result.CreatedProjectNames.Add(projectName);
                        }
                        projectId = proj.Id;
                    }

                    // Extract Status
                    var statusStr = row.Cell(5).GetString()?.Trim().ToUpperInvariant() ?? "";
                    var status = statusStr switch
                    {
                        "DONE" or "SELESAI" or "COMPLETED" => WorkTaskStatus.Done,
                        "IN_PROGRESS" or "IN PROGRESS" or "PROGRESS" => WorkTaskStatus.InProgress,
                        "IN_REVIEW" or "IN REVIEW" or "REVIEW" => WorkTaskStatus.InReview,
                        "OVERDUE" => WorkTaskStatus.Overdue,
                        _ => WorkTaskStatus.Todo
                    };

                    // Extract Priority
                    var priorityStr = row.Cell(6).GetString()?.Trim().ToUpperInvariant() ?? "";
                    var priority = priorityStr switch
                    {
                        "CRITICAL" or "URGENT" => TaskPriority.Critical,
                        "HIGH" => TaskPriority.High,
                        "LOW" => TaskPriority.Low,
                        _ => TaskPriority.Medium
                    };

                    // Milestone from jenis_task (Col 7)
                    var jenisTask = row.Cell(7).GetString()?.Trim();
                    var milestone = !string.IsNullOrWhiteSpace(jenisTask) ? jenisTask : "Implementation";

                    // Progress (Col 10)
                    int progress = 0;
                    var cellProg = row.Cell(10);
                    if (cellProg.TryGetValue<double>(out var pDbl))
                    {
                        progress = pDbl <= 1.0 ? (int)Math.Round(pDbl * 100) : (int)Math.Min(100, Math.Round(pDbl));
                    }
                    else if (int.TryParse(cellProg.GetString(), out var pInt))
                    {
                        progress = pInt <= 1 ? pInt * 100 : Math.Min(100, pInt);
                    }

                    if (status == WorkTaskStatus.Done && progress < 100)
                    {
                        progress = 100;
                    }

                    // Dates (Col 11, 12, 13)
                    DateTime? startDate = null;
                    if (row.Cell(11).TryGetValue<DateTime>(out var sDate)) startDate = sDate;

                    DateTime? dueDate = null;
                    if (row.Cell(12).TryGetValue<DateTime>(out var dDate)) dueDate = dDate;

                    DateTime? completedDate = null;
                    if (row.Cell(13).TryGetValue<DateTime>(out var cDate)) completedDate = cDate;

                    // Metadata for Description
                    var reqCode = row.Cell(3).GetString()?.Trim();
                    var moduleName = row.Cell(8).GetString()?.Trim();
                    var bugType = row.Cell(9).GetString()?.Trim();

                    var descParts = new List<string>();
                    if (!string.IsNullOrEmpty(moduleName)) descParts.Add($"Modul: {moduleName}");
                    if (!string.IsNullOrEmpty(reqCode)) descParts.Add($"Kode: {reqCode}");
                    if (!string.IsNullOrEmpty(bugType)) descParts.Add($"Bug Type: {bugType}");
                    if (completedDate.HasValue) descParts.Add($"Selesai: {completedDate.Value:dd/MM/yyyy}");
                    
                    var description = descParts.Count > 0 ? string.Join(" | ", descParts) : null;

                    // Check if task already exists (update if exists, add if new)
                    var existingTask = await _context.Tasks.FirstOrDefaultAsync(t =>
                        t.Title == title &&
                        t.ProjectId == projectId &&
                        t.CompanyId == companyId &&
                        t.AssignedToUserId == picUser.Id);

                    if (existingTask != null)
                    {
                        existingTask.Status = status;
                        existingTask.Priority = priority;
                        existingTask.Progress = progress;
                        existingTask.Milestone = milestone;
                        existingTask.StartDate = startDate;
                        existingTask.DueDate = dueDate;
                        if (!string.IsNullOrEmpty(description)) existingTask.Description = description;
                        existingTask.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        var task = new WorkTask
                        {
                            Title = title,
                            Description = description,
                            Status = status,
                            Priority = priority,
                            Progress = progress,
                            Milestone = milestone,
                            ProjectId = projectId,
                            CompanyId = companyId,
                            AssignedToUserId = picUser.Id,
                            StartDate = startDate,
                            DueDate = dueDate,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        newTasks.Add(task);
                    }

                    result.SuccessRows++;
                }
                catch (Exception ex)
                {
                    result.FailedRows++;
                    result.Errors.Add($"Sheet {sheetName} Baris {r}: {ex.Message}");
                }
            }
        }

        if (newTasks.Count > 0)
        {
            _context.Tasks.AddRange(newTasks);
        }

        await _context.SaveChangesAsync();

        // Save ImportLog
        try
        {
            var importLog = new ImportLog
            {
                FileName = fileName,
                TotalRows = result.TotalRows,
                SuccessRows = result.SuccessRows,
                FailedRows = result.FailedRows,
                Errors = result.Errors.Count > 0 ? string.Join("; ", result.Errors.Take(5)) : null,
                ImportedAt = DateTime.UtcNow,
                ImportedBy = importedByUserId
            };
            _context.ImportLogs.Add(importLog);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Ignore logging error
        }

        return result;
    }

    private static string FindEmailForSheet(IXLWorksheet ws, string sheetName)
    {
        var candidateEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        int lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
        int checkRows = Math.Min(lastRow, 100);

        for (int r = 2; r <= checkRows; r++)
        {
            var row = ws.Row(r);
            int lastCol = Math.Min(25, ws.LastColumnUsed()?.ColumnNumber() ?? 20);
            for (int c = 1; c <= lastCol; c++)
            {
                var val = row.Cell(c).GetString()?.Trim();
                if (!string.IsNullOrEmpty(val) && val.Contains('@'))
                {
                    foreach (var part in val.Split(new[] { ',', ';', ' ', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                    {
                        var clean = part.Trim().Trim('"', '\'', '<', '>');
                        if (clean.Contains('@') && clean.Contains('.'))
                        {
                            candidateEmails.Add(clean);
                        }
                    }
                }
            }
        }

        var lowerSheet = sheetName.ToLowerInvariant();
        var matched = candidateEmails.FirstOrDefault(e => e.ToLowerInvariant().Contains(lowerSheet));
        if (!string.IsNullOrEmpty(matched))
        {
            return matched;
        }

        if (MemberProfiles.TryGetValue(sheetName, out var profile))
        {
            return profile.Email;
        }

        if (candidateEmails.Count > 0)
        {
            return candidateEmails.First();
        }

        return $"{lowerSheet}@elistec.com";
    }

    private static string DeriveFullName(string sheetName, string email)
    {
        if (MemberProfiles.TryGetValue(sheetName, out var profile) && !string.IsNullOrWhiteSpace(profile.FullName))
        {
            return profile.FullName;
        }

        if (!string.IsNullOrWhiteSpace(email) && email.Contains('@'))
        {
            var userPart = email.Split('@')[0];
            var parts = userPart.Split('.', '-', '_');
            var capitalized = parts.Select(p => p.Length > 0 ? char.ToUpper(p[0]) + p.Substring(1).ToLowerInvariant() : "");
            var name = string.Join(" ", capitalized).Trim();
            if (!string.IsNullOrWhiteSpace(name)) return name;
        }

        return sheetName;
    }

    private async Task<ApplicationUser> EnsureUserAsync(
        string email, 
        string fullName, 
        string jobTitle, 
        string role, 
        int companyId, 
        Dictionary<string, ApplicationUser> userCache, 
        TaskImportResultDto result)
    {
        if (userCache.TryGetValue(email, out var existingUser))
        {
            await ResetPasswordToDefaultAsync(existingUser);
            return existingUser;
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                FullName = fullName,
                JobTitle = jobTitle,
                CompanyId = companyId,
                IsApproved = true,
                ApprovedAt = DateTime.UtcNow,
                AvatarColor = ProjectColors[Math.Abs(fullName.GetHashCode()) % ProjectColors.Length],
                CreatedAt = DateTime.UtcNow
            };

            var createRes = await _userManager.CreateAsync(user, "Password123!");
            if (createRes.Succeeded)
            {
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new ApplicationRole(role));
                }
                await _userManager.AddToRoleAsync(user, role);
                result.UsersCreated++;
                result.CreatedUserEmails.Add(email);
            }
        }
        else
        {
            user.IsApproved = true;
            user.ApprovedAt ??= DateTime.UtcNow;
            if (string.IsNullOrWhiteSpace(user.FullName) || user.FullName == user.UserName)
            {
                user.FullName = fullName;
            }
            if (string.IsNullOrWhiteSpace(user.JobTitle))
            {
                user.JobTitle = jobTitle;
            }
            await _userManager.UpdateAsync(user);
            await ResetPasswordToDefaultAsync(user);
        }

        userCache[email] = user;
        return user;
    }

    private async Task ResetPasswordToDefaultAsync(ApplicationUser user)
    {
        try
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            await _userManager.ResetPasswordAsync(user, token, "Password123!");
        }
        catch
        {
            // Ignore if reset fails
        }
    }
}
