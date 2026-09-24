using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.Entities;

namespace WorkTracker.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<WorkTask> Tasks => Set<WorkTask>();
    public DbSet<WorkSession> Sessions => Set<WorkSession>();
    public DbSet<AttendanceRecord> Attendances => Set<AttendanceRecord>();
    public DbSet<WorkNote> Notes => Set<WorkNote>();
    public DbSet<NoteAttachment> NoteAttachments => Set<NoteAttachment>();
    public DbSet<MasterBadge> MasterBadges => Set<MasterBadge>();
    public DbSet<UserBadge> UserBadges => Set<UserBadge>();
    public DbSet<MasterPriority> MasterPriorities => Set<MasterPriority>();
    public DbSet<MasterStatus> MasterStatuses => Set<MasterStatus>();
    public DbSet<MasterMilestone> MasterMilestones => Set<MasterMilestone>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ImportLog> ImportLogs => Set<ImportLog>();
    public DbSet<SqlHistory> SqlHistories => Set<SqlHistory>();
    public DbSet<JsonHistory> JsonHistories => Set<JsonHistory>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Explicit Table Names to match MySQL schema
        builder.Entity<Company>().ToTable("Companies");
        builder.Entity<Project>().ToTable("Projects");
        builder.Entity<Category>().ToTable("Categories");
        builder.Entity<WorkTask>().ToTable("Tasks");
        builder.Entity<WorkSession>().ToTable("Sessions");
        builder.Entity<AttendanceRecord>().ToTable("Attendances");
        builder.Entity<WorkNote>().ToTable("Notes");
        builder.Entity<NoteAttachment>().ToTable("NoteAttachments");
        builder.Entity<MasterBadge>().ToTable("MasterBadges");
        builder.Entity<UserBadge>().ToTable("UserBadges");
        builder.Entity<MasterPriority>().ToTable("MasterPriorities");
        builder.Entity<MasterStatus>().ToTable("MasterStatuses");
        builder.Entity<MasterMilestone>().ToTable("MasterMilestones");
        builder.Entity<SystemSetting>().ToTable("SystemSettings");
        builder.Entity<EmailTemplate>().ToTable("EmailTemplates");
        builder.Entity<AuditLog>().ToTable("AuditLogs");
        builder.Entity<ImportLog>().ToTable("ImportLogs");
        builder.Entity<SqlHistory>().ToTable("SqlHistories");
        builder.Entity<JsonHistory>().ToTable("JsonHistories");

        // Relationships & Foreign Key Rules as per TSD Section 3.3
        builder.Entity<WorkTask>()
            .HasOne(t => t.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<WorkTask>()
            .HasOne(t => t.Category)
            .WithMany(c => c.Tasks)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<WorkTask>()
            .HasOne(t => t.Company)
            .WithMany(c => c.Tasks)
            .HasForeignKey(t => t.CompanyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<WorkTask>()
            .HasOne(t => t.AssignedToUser)
            .WithMany(u => u.AssignedTasks)
            .HasForeignKey(t => t.AssignedToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<WorkTask>()
            .HasOne(t => t.ParentTask)
            .WithMany(p => p.ChildTasks)
            .HasForeignKey(t => t.ParentTaskId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<WorkSession>()
            .HasOne(s => s.Task)
            .WithMany(t => t.Sessions)
            .HasForeignKey(s => s.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<WorkSession>()
            .HasOne(s => s.User)
            .WithMany(u => u.WorkSessions)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<AttendanceRecord>()
            .HasOne(a => a.User)
            .WithMany(u => u.AttendanceRecords)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<AttendanceRecord>()
            .HasOne(a => a.ApprovedByUser)
            .WithMany()
            .HasForeignKey(a => a.ApprovedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<WorkNote>()
            .HasOne(n => n.AuthorUser)
            .WithMany(u => u.Notes)
            .HasForeignKey(n => n.AuthorUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<WorkNote>()
            .HasOne(n => n.Task)
            .WithMany(t => t.Notes)
            .HasForeignKey(n => n.TaskId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<WorkNote>()
            .HasOne(n => n.Company)
            .WithMany(c => c.Notes)
            .HasForeignKey(n => n.CompanyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<NoteAttachment>()
            .HasOne(a => a.Note)
            .WithMany(n => n.Attachments)
            .HasForeignKey(a => a.NoteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserBadge>()
            .HasOne(ub => ub.User)
            .WithMany(u => u.Badges)
            .HasForeignKey(ub => ub.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserBadge>()
            .HasOne(ub => ub.Badge)
            .WithMany(b => b.UserBadges)
            .HasForeignKey(ub => ub.BadgeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.Entity<WorkTask>().HasIndex(t => t.ProjectId);
        builder.Entity<WorkTask>().HasIndex(t => t.AssignedToUserId);
        builder.Entity<WorkTask>().HasIndex(t => t.ParentTaskId);
        builder.Entity<WorkTask>().HasIndex(t => t.Status);
        builder.Entity<WorkTask>().HasIndex(t => t.DueDate);
        builder.Entity<WorkSession>().HasIndex(s => s.TaskId);
        builder.Entity<WorkSession>().HasIndex(s => s.UserId);
        builder.Entity<AttendanceRecord>().HasIndex(a => new { a.UserId, a.Date });
        builder.Entity<AuditLog>().HasIndex(a => a.Timestamp);
    }
}
