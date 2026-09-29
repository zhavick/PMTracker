using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WorkTracker.Core.Entities;
using WorkTracker.Core.Enums;

namespace WorkTracker.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext context, UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
    {
        // 1. Ensure Company
        var company = await context.Companies.FirstOrDefaultAsync(c => c.Code == "ELISTEC");
        if (company == null)
        {
            company = new Company
            {
                Name = "PT Elistec Teknologi",
                Code = "ELISTEC",
                Description = "Tim Inti Pengembangan Sistem TrackerKerja",
                Address = "Jakarta, Indonesia",
                ContactEmail = "info@elistec.com",
                CreatedAt = DateTime.UtcNow
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();
        }

        // 2. Ensure Roles
        string[] roles = ["Admin", "PM", "Project Manager", "User", "System Analyst", "Technical Writer"];
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new ApplicationRole(roleName));
            }
        }

        // 3. Ensure Default Admin User
        var adminEmail = "admin@trackerkerja.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FullName = "Administrator Pro",
                JobTitle = "Lead System Architect",
                AvatarColor = "#6366F1",
                CompanyId = company.Id,
                IsApproved = true,
                ApprovedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(adminUser, "Admin@123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        // 4. Ensure Master Statuses
        if (!await context.MasterStatuses.AnyAsync())
        {
            context.MasterStatuses.AddRange(
                new MasterStatus { Name = "Todo", Color = "#94A3B8", IsDoneState = false, OrderIndex = 1, IsDefault = true, Description = "Tugas siap dikerjakan" },
                new MasterStatus { Name = "In Progress", Color = "#3B82F6", IsDoneState = false, OrderIndex = 2, IsDefault = false, Description = "Sedang dalam pengerjaan" },
                new MasterStatus { Name = "Review", Color = "#EAB308", IsDoneState = false, OrderIndex = 3, IsDefault = false, Description = "Dalam peninjauan kualitas" },
                new MasterStatus { Name = "Done", Color = "#22C55E", IsDoneState = true, OrderIndex = 4, IsDefault = false, Description = "Selesai tuntas" },
                new MasterStatus { Name = "Overdue", Color = "#EF4444", IsDoneState = false, OrderIndex = 5, IsDefault = false, Description = "Melewati batas tenggat" }
            );
            await context.SaveChangesAsync();
        }

        // 5. Ensure Master Priorities
        if (!await context.MasterPriorities.AnyAsync())
        {
            context.MasterPriorities.AddRange(
                new MasterPriority { Name = "Low", Color = "#10B981", Icon = "Flag", OrderIndex = 1, Description = "Prioritas rendah" },
                new MasterPriority { Name = "Medium", Color = "#3B82F6", Icon = "Flag", OrderIndex = 2, IsDefault = true, Description = "Prioritas normal" },
                new MasterPriority { Name = "High", Color = "#F59E0B", Icon = "Flag", OrderIndex = 3, Description = "Prioritas tinggi" },
                new MasterPriority { Name = "Critical", Color = "#EF4444", Icon = "AlertTriangle", OrderIndex = 4, Description = "Mendesak / Kritis" }
            );
            await context.SaveChangesAsync();
        }

        // 6. Ensure Master Milestones (SDLC Waterfall)
        if (!await context.MasterMilestones.AnyAsync())
        {
            context.MasterMilestones.AddRange(
                new MasterMilestone { Name = "Requirement Analysis", Phase = "Planning", Color = "#8B5CF6", Icon = "FileText", OrderIndex = 1 },
                new MasterMilestone { Name = "System Design", Phase = "Design", Color = "#EC4899", Icon = "Layout", OrderIndex = 2 },
                new MasterMilestone { Name = "Implementation", Phase = "Development", Color = "#3B82F6", Icon = "Code", OrderIndex = 3, IsDefault = true },
                new MasterMilestone { Name = "Testing & QA", Phase = "Quality", Color = "#F59E0B", Icon = "CheckSquare", OrderIndex = 4 },
                new MasterMilestone { Name = "Deployment", Phase = "Release", Color = "#10B981", Icon = "Send", OrderIndex = 5 },
                new MasterMilestone { Name = "Maintenance", Phase = "Support", Color = "#64748B", Icon = "Tool", OrderIndex = 6 }
            );
            await context.SaveChangesAsync();
        }

        // 7. Ensure Categories
        if (!await context.Categories.AnyAsync())
        {
            context.Categories.AddRange(
                new Category { Name = "Backend Development", Color = "#3B82F6", Description = "Implementasi REST API & Business Logic" },
                new Category { Name = "Frontend Development", Color = "#10B981", Description = "Antarmuka Pengguna & Komponen React" },
                new Category { Name = "API & Integration", Color = "#8B5CF6", Description = "Integrasi Layanan Eksternal & Webhook" },
                new Category { Name = "Database & Architecture", Color = "#F59E0B", Description = "Pemodelan Data, Migrasi & Kueri" },
                new Category { Name = "Bugfix & QA", Color = "#EF4444", Description = "Perbaikan Bug & Pengujian Kualitas" }
            );
            await context.SaveChangesAsync();
        }

        // 8. Ensure Master Badges (40+ Indonesian Youth-Themed Across 5 Tiers)
        var initialBadges = new List<MasterBadge>
        {
            // Tier 1: Perunggu (Common)
            new MasterBadge { Code = "CHECKIN_FIRST", Name = "Langkah Awal 🐾", Description = "Lakukan presensi check-in pertamamu di sistem", Points = 50, Rarity = BadgeRarity.Common, TriggerType = BadgeTriggerType.Auto_TotalCheckIns, TriggerThreshold = 1, Icon = "CalendarCheck", Color = "#10B981", OrderIndex = 1 },
            new MasterBadge { Code = "CHECKIN_3",     Name = "Konsisten Santuy 🌱", Description = "Pertahankan streak presensi 3 hari berturut-turut", Points = 75, Rarity = BadgeRarity.Common, TriggerType = BadgeTriggerType.Auto_CheckInStreak, TriggerThreshold = 3, Icon = "Flame", Color = "#22C55E", OrderIndex = 2 },
            new MasterBadge { Code = "CHECKIN_7",     Name = "Pejuang Fajar 🌅", Description = "Pertahankan streak presensi 7 hari berturut-turut", Points = 100, Rarity = BadgeRarity.Common, TriggerType = BadgeTriggerType.Auto_CheckInStreak, TriggerThreshold = 7, Icon = "Sun", Color = "#F59E0B", OrderIndex = 3 },
            new MasterBadge { Code = "TASK_FIRST",    Name = "Selesai Dong 🎯", Description = "Selesaikan tugas pertamamu di sistem", Points = 50, Rarity = BadgeRarity.Common, TriggerType = BadgeTriggerType.Auto_DoneTasks, TriggerThreshold = 1, Icon = "CheckCircle2", Color = "#10B981", OrderIndex = 4 },
            new MasterBadge { Code = "TASK_FIVE",     Name = "Mulai Produktif 🚀", Description = "Selesaikan 5 tugas kerja dengan baik", Points = 75, Rarity = BadgeRarity.Common, TriggerType = BadgeTriggerType.Auto_DoneTasks, TriggerThreshold = 5, Icon = "Target", Color = "#3B82F6", OrderIndex = 5 },
            new MasterBadge { Code = "NOTE_FIRST",    Name = "Pencatat Rapi 📝", Description = "Buat catatan atau dokumen pertama di sistem", Points = 30, Rarity = BadgeRarity.Common, TriggerType = BadgeTriggerType.Auto_NotesCreated, TriggerThreshold = 1, Icon = "BookOpen", Color = "#64748B", OrderIndex = 6 },
            new MasterBadge { Code = "HOURS_TEN",     Name = "Pemanasan Dulu ⏱️", Description = "Catat akumulasi 10 jam kerja di timesheet", Points = 60, Rarity = BadgeRarity.Common, TriggerType = BadgeTriggerType.Auto_WorkHours, TriggerThreshold = 10, Icon = "Clock", Color = "#06B6D4", OrderIndex = 7 },
            new MasterBadge { Code = "EARLY_BIRD",    Name = "Anti Telat Club ⏰", Description = "Check-in pagi hari sebelum 07:30 (3 kali)", Points = 70, Rarity = BadgeRarity.Common, TriggerType = BadgeTriggerType.Auto_EarlyBird, TriggerThreshold = 3, Icon = "Coffee", Color = "#EAB308", OrderIndex = 8 },

            // Tier 2: Perak (Rare)
            new MasterBadge { Code = "CHECKIN_14",    Name = "Rajin Pangkal Hebat 🌟", Description = "Streak presensi aktif selama 14 hari penuh", Points = 150, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_CheckInStreak, TriggerThreshold = 14, Icon = "Zap", Color = "#3B82F6", OrderIndex = 9 },
            new MasterBadge { Code = "TASK_TEN",      Name = "Gaspol Rem Blong ⚡", Description = "Selesaikan 10 tugas kerja tanpa hambatan", Points = 120, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_DoneTasks, TriggerThreshold = 10, Icon = "Zap", Color = "#3B82F6", OrderIndex = 10 },
            new MasterBadge { Code = "TASK_25",       Name = "Mesin Tempur 🔥", Description = "Selesaikan 25 tugas — andalan tim operasional", Points = 160, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_DoneTasks, TriggerThreshold = 25, Icon = "Flame", Color = "#F59E0B", OrderIndex = 11 },
            new MasterBadge { Code = "HOURS_FORTY",   Name = "Fokus Mode On ⏳", Description = "Catat 40 jam kerja produktif di timesheet", Points = 150, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_WorkHours, TriggerThreshold = 40, Icon = "Clock", Color = "#8B5CF6", OrderIndex = 12 },
            new MasterBadge { Code = "SPEED_DEMON",   Name = "Sat-Set Bro 🏎️", Description = "Selesaikan 3 tugas kilat di bawah 2 jam", Points = 150, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_SpeedDemon, TriggerThreshold = 3, Icon = "Rocket", Color = "#EC4899", OrderIndex = 13 },
            new MasterBadge { Code = "NOTE_TEN",      Name = "Dokumentator Pro 📚", Description = "Buat 10 catatan dan dokumentasi berkualitas", Points = 120, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_NotesCreated, TriggerThreshold = 10, Icon = "BookOpen", Color = "#06B6D4", OrderIndex = 14 },
            new MasterBadge { Code = "OVERTIME_5",    Name = "Lembur Berfaedah 🌙", Description = "Catat 5 sesi kerja lembur melebihi 8 jam", Points = 130, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_OvertimeHours, TriggerThreshold = 5, Icon = "Moon", Color = "#7C3AED", OrderIndex = 15 },
            new MasterBadge { Code = "NIGHT_OWL",     Name = "Ksatria Coding Malam 🦉", Description = "Check-out presensi malam hari setelah pukul 20:00 (5 kali)", Points = 140, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_NightOwl, TriggerThreshold = 5, Icon = "Moon", Color = "#6366F1", OrderIndex = 16 },
            new MasterBadge { Code = "WEEKEND_WARRIOR", Name = "Pejuang Weekend 🛡️", Description = "Selesaikan 2 tugas kerja di akhir pekan", Points = 150, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_WeekendWarrior, TriggerThreshold = 2, Icon = "ShieldCheck", Color = "#8B5CF6", OrderIndex = 17 },
            new MasterBadge { Code = "ZERO_DEFECT_LITE", Name = "Anti Revisi 🎯", Description = "Selesaikan 3 tugas berprioritas tinggi tanpa kendala", Points = 160, Rarity = BadgeRarity.Rare, TriggerType = BadgeTriggerType.Auto_ZeroDefect, TriggerThreshold = 3, Icon = "Award", Color = "#10B981", OrderIndex = 18 },

            // Tier 3: Emas (Epic)
            new MasterBadge { Code = "CHECKIN_30",    Name = "Sultan Disiplin 👑", Description = "Streak presensi 30 hari penuh tanpa putus", Points = 300, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_CheckInStreak, TriggerThreshold = 30, Icon = "Crown", Color = "#F59E0B", OrderIndex = 19 },
            new MasterBadge { Code = "TASK_50",       Name = "Master Eksekusi 💎", Description = "Selesaikan 50 tugas kerja di sistem", Points = 250, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_DoneTasks, TriggerThreshold = 50, Icon = "Shield", Color = "#6366F1", OrderIndex = 20 },
            new MasterBadge { Code = "HOURS_100",     Name = "Workaholic Positif ⌛", Description = "Catat 100 jam kerja produktif di timesheet", Points = 250, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_WorkHours, TriggerThreshold = 100, Icon = "Clock", Color = "#EC4899", OrderIndex = 21 },
            new MasterBadge { Code = "HOURS_200",     Name = "Waktu Emas ⏰", Description = "Catat 200 jam kerja total — dedikasi luar biasa", Points = 350, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_WorkHours, TriggerThreshold = 200, Icon = "Clock", Color = "#F59E0B", OrderIndex = 22 },
            new MasterBadge { Code = "OVERTIME_20",   Name = "Night Rider Sejati 🦇", Description = "Lembur 20 kali demi kesuksesan proyek tim", Points = 250, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_OvertimeHours, TriggerThreshold = 20, Icon = "Moon", Color = "#4F46E5", OrderIndex = 23 },
            new MasterBadge { Code = "MONTHLY_TOP",   Name = "MVP Bulan Ini 🏆", Description = "Penyelesai tugas terbanyak dalam kurun bulan berjalan", Points = 400, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_MonthlyTopTasks, TriggerThreshold = 0, Icon = "Trophy", Color = "#F59E0B", OrderIndex = 24 },
            new MasterBadge { Code = "DOC_GURU",      Name = "Ensiklopedia Tim 📖", Description = "Tulis 20 catatan/arsitektur dokumentasi proyek", Points = 250, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_NotesCreated, TriggerThreshold = 20, Icon = "FileText", Color = "#14B8A6", OrderIndex = 25 },
            new MasterBadge { Code = "ZERO_DEFECT",   Name = "Master of Excellence 🎖️", Description = "Selesaikan 10 tugas Critical/High tanpa revisi", Points = 350, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_ZeroDefect, TriggerThreshold = 10, Icon = "Award", Color = "#F43F5E", OrderIndex = 26 },
            new MasterBadge { Code = "POINTS_1000",   Name = "Jutawan Poin 💰", Description = "Akumulasi total 1.000 poin gamifikasi", Points = 300, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_TotalPoints, TriggerThreshold = 1000, Icon = "Coins", Color = "#EAB308", OrderIndex = 27 },
            new MasterBadge { Code = "PROJECT_CAPTAIN", Name = "Kapten Proyek 🧭", Description = "Pimpin setidaknya 1 proyek sebagai Project Manager", Points = 300, Rarity = BadgeRarity.Epic, TriggerType = BadgeTriggerType.Auto_ProjectsManaged, TriggerThreshold = 1, Icon = "Compass", Color = "#3B82F6", OrderIndex = 28 },

            // Tier 4: Platinum (Legendary)
            new MasterBadge { Code = "CHECKIN_60",    Name = "Legenda Absen 🏰", Description = "Streak presensi 60 hari berturut-turut tanpa jeda", Points = 500, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_CheckInStreak, TriggerThreshold = 60, Icon = "ShieldCheck", Color = "#6366F1", OrderIndex = 29 },
            new MasterBadge { Code = "TASK_100",      Name = "Penakluk Deadline 🌟", Description = "Selesaikan 100 tugas kerja — pencapaian monumental!", Points = 500, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_TasksAbove100, TriggerThreshold = 100, Icon = "Star", Color = "#FBBF24", OrderIndex = 30 },
            new MasterBadge { Code = "TASK_150",      Name = "Grandmaster Centurion 🔱", Description = "Menembus 150 tugas kerja — keteladanan tertinggi", Points = 750, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_TasksAbove100, TriggerThreshold = 150, Icon = "Sparkles", Color = "#A855F7", OrderIndex = 31 },
            new MasterBadge { Code = "HOURS_350",     Name = "Iron Man Kantor 🦾", Description = "Catat 350 jam kerja produktif di timesheet", Points = 600, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_WorkHours, TriggerThreshold = 350, Icon = "Zap", Color = "#EF4444", OrderIndex = 32 },
            new MasterBadge { Code = "HOURS_500",     Name = "Pahlawan Waktu ⚔️", Description = "Catat 500 jam kerja total — dedikasi tak tertandingi", Points = 800, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_WorkHours, TriggerThreshold = 500, Icon = "Crown", Color = "#F97316", OrderIndex = 33 },
            new MasterBadge { Code = "POINTS_2500",   Name = "Miliarder Poin 💎", Description = "Akumulasi total 2.500 poin penghargaan sistem", Points = 600, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_TotalPoints, TriggerThreshold = 2500, Icon = "Gem", Color = "#06B6D4", OrderIndex = 34 },
            new MasterBadge { Code = "PROJECT_ARCHITECT", Name = "Arsitek Solusi 🏛️", Description = "Pimpin 3 proyek sebagai Project Manager", Points = 500, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_ProjectsManaged, TriggerThreshold = 3, Icon = "Building", Color = "#8B5CF6", OrderIndex = 35 },
            new MasterBadge { Code = "SPEED_MASTER",  Name = "Dewa Kecepatan ⚡", Description = "Selesaikan 10 tugas kilat di bawah 2 jam", Points = 500, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_SpeedDemon, TriggerThreshold = 10, Icon = "Flame", Color = "#EC4899", OrderIndex = 36 },

            // Tier 5: Berlian (Legendary / Special Milestone)
            new MasterBadge { Code = "CHECKIN_100",   Name = "Dewa Disiplin Abadi 🌌", Description = "Streak presensi 100 hari berturut-turut — rekor mutlak!", Points = 1000, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_CheckInStreak, TriggerThreshold = 100, Icon = "Sparkles", Color = "#EC4899", OrderIndex = 37 },
            new MasterBadge { Code = "TASK_250",      Name = "Dewa Produktif 🪐", Description = "Selesaikan 250 tugas kerja — sang legenda hidup", Points = 1200, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_TasksAbove100, TriggerThreshold = 250, Icon = "Trophy", Color = "#F59E0B", OrderIndex = 38 },
            new MasterBadge { Code = "HOURS_1000",    Name = "Zen Master ⛩️", Description = "Catat 1000 jam kerja total — master kesabaran & fokus", Points = 1500, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_WorkHours, TriggerThreshold = 1000, Icon = "Sunrise", Color = "#10B981", OrderIndex = 39 },
            new MasterBadge { Code = "POINTS_5000",   Name = "Sultan Gamifikasi 👑", Description = "Akumulasi total 5.000 poin penghargaan tertinggi", Points = 1200, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_TotalPoints, TriggerThreshold = 5000, Icon = "Crown", Color = "#F59E0B", OrderIndex = 40 },
            new MasterBadge { Code = "PROJECT_PILLAR", Name = "Pilar Perusahaan 🏢", Description = "Pimpin 5 proyek sebagai Project Manager", Points = 1000, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_ProjectsManaged, TriggerThreshold = 5, Icon = "Building2", Color = "#3B82F6", OrderIndex = 41 },
            new MasterBadge { Code = "MONTHLY_MILESTONE_3", Name = "Kolektor Milestone 🎁", Description = "Capai 30-hari streak presensi sebanyak 3 siklus", Points = 800, Rarity = BadgeRarity.Legendary, TriggerType = BadgeTriggerType.Auto_MonthlyMilestone, TriggerThreshold = 1, Icon = "Gift", Color = "#F43F5E", OrderIndex = 42 }
        };

        foreach (var b in initialBadges)
        {
            var exists = await context.MasterBadges.AnyAsync(x => x.Code == b.Code);
            if (!exists)
            {
                context.MasterBadges.Add(b);
            }
        }
        await context.SaveChangesAsync();

        // 8a. Ensure Default Reward Items Catalog
        if (!await context.RewardItems.AnyAsync())
        {
            context.RewardItems.AddRange(
                new RewardItem { Name = "Voucher Kopi Kenangan / Janji Jiwa Rp 25.000", Description = "Klaim voucher digital minuman kopi favorit untuk menemani kerja", PointCost = 250, Stock = 50, Category = "Kopi", Icon = "Coffee", Color = "#8B5CF6", OrderIndex = 1 },
                new RewardItem { Name = "Saldo GoPay / OVO / ShopeePay Rp 50.000", Description = "Top-up saldo e-wallet langsung ke nomor ponsel terdaftar", PointCost = 500, Stock = 30, Category = "E-Wallet", Icon = "Smartphone", Color = "#06B6D4", OrderIndex = 2 },
                new RewardItem { Name = "Saldo GoPay / OVO / ShopeePay Rp 100.000", Description = "Top-up saldo e-wallet Rp 100.000 instan", PointCost = 1000, Stock = 20, Category = "E-Wallet", Icon = "CreditCard", Color = "#10B981", OrderIndex = 3 },
                new RewardItem { Name = "Merchandise Tumbler Eksklusif WorkTracker", Description = "Tumbler stainless steel premium 500ml tahan panas & dingin", PointCost = 750, Stock = 15, Category = "Merchandise", Icon = "Package", Color = "#F59E0B", OrderIndex = 4 },
                new RewardItem { Name = "Kaos Eksklusif Developer Edition", Description = "T-shirt katun combed 30s premium dengan sablon eksklusif", PointCost = 1200, Stock = 10, Category = "Merchandise", Icon = "Shirt", Color = "#6366F1", OrderIndex = 5 },
                new RewardItem { Name = "Voucher Belanja Alfamart / Indomaret Rp 100.000", Description = "Voucher belanja digital untuk kebutuhan sehari-hari", PointCost = 1000, Stock = 25, Category = "Voucher", Icon = "ShoppingBag", Color = "#EF4444", OrderIndex = 6 },
                new RewardItem { Name = "Cuti Ekstra Setengah Hari", Description = "Hak cuti istimewa 0.5 hari kerja dengan persetujuan atasan", PointCost = 1500, Stock = 5, Category = "Cuti", Icon = "Calendar", Color = "#EC4899", OrderIndex = 7 },
                new RewardItem { Name = "Paket Traktir Makan Siang Tim Rp 200.000", Description = "Makan siang bersama tim yang dibiayai kantor untuk selebrasi milestone", PointCost = 2000, Stock = 5, Category = "Traktir", Icon = "Utensils", Color = "#F97316", IsMonthlyMilestoneReward = true, OrderIndex = 8 }
            );
            await context.SaveChangesAsync();
        }

        // 8b. Ensure National Holidays (Indonesia 2026)
        if (!await context.MasterHolidays.AnyAsync())
        {
            context.MasterHolidays.AddRange(
                new MasterHoliday { Name = "Tahun Baru 2026",           Date = new DateOnly(2026, 1,  1),  HolidayType = "National",  Color = "#EF4444", IsRecurringYearly = true,  Description = "Libur resmi Tahun Baru Masehi" },
                new MasterHoliday { Name = "Isra Mi'raj Nabi Muhammad", Date = new DateOnly(2026, 1,  27), HolidayType = "Religious", Color = "#8B5CF6", IsRecurringYearly = false, Description = "Peringatan Isra Mi'raj Nabi Muhammad SAW" },
                new MasterHoliday { Name = "Hari Raya Nyepi",           Date = new DateOnly(2026, 3,  19), HolidayType = "Religious", Color = "#F59E0B", IsRecurringYearly = false, Description = "Tahun Baru Saka (Nyepi)" },
                new MasterHoliday { Name = "Idul Fitri Hari 1",         Date = new DateOnly(2026, 3,  20), HolidayType = "Religious", Color = "#10B981", IsRecurringYearly = false, Description = "Lebaran — Hari Raya Idul Fitri 1447 H" },
                new MasterHoliday { Name = "Idul Fitri Hari 2",         Date = new DateOnly(2026, 3,  21), HolidayType = "Religious", Color = "#10B981", IsRecurringYearly = false, Description = "Lebaran — Hari Raya Idul Fitri 1447 H (hari 2)" },
                new MasterHoliday { Name = "Cuti Bersama Idul Fitri",   Date = new DateOnly(2026, 3,  18), HolidayType = "Company",   Color = "#3B82F6", IsRecurringYearly = false, Description = "Cuti bersama Lebaran" },
                new MasterHoliday { Name = "Cuti Bersama Idul Fitri",   Date = new DateOnly(2026, 3,  23), HolidayType = "Company",   Color = "#3B82F6", IsRecurringYearly = false, Description = "Cuti bersama Lebaran" },
                new MasterHoliday { Name = "Jumat Agung (Good Friday)", Date = new DateOnly(2026, 4,  3),  HolidayType = "Religious", Color = "#DC2626", IsRecurringYearly = false, Description = "Wafat Yesus Kristus" },
                new MasterHoliday { Name = "Hari Buruh Internasional",  Date = new DateOnly(2026, 5,  1),  HolidayType = "National",  Color = "#EF4444", IsRecurringYearly = true,  Description = "May Day — International Workers Day" },
                new MasterHoliday { Name = "Kenaikan Yesus Kristus",    Date = new DateOnly(2026, 5,  14), HolidayType = "Religious", Color = "#7C3AED", IsRecurringYearly = false, Description = "Kenaikan Isa Al-Masih" },
                new MasterHoliday { Name = "Hari Raya Waisak",          Date = new DateOnly(2026, 5,  31), HolidayType = "Religious", Color = "#F59E0B", IsRecurringYearly = false, Description = "Hari Raya Waisak 2570 BE" },
                new MasterHoliday { Name = "Hari Lahir Pancasila",      Date = new DateOnly(2026, 6,  1),  HolidayType = "National",  Color = "#EF4444", IsRecurringYearly = true,  Description = "Hari Lahir Pancasila" },
                new MasterHoliday { Name = "Idul Adha",                 Date = new DateOnly(2026, 5,  27), HolidayType = "Religious", Color = "#10B981", IsRecurringYearly = false, Description = "Hari Raya Idul Adha 1447 H" },
                new MasterHoliday { Name = "Tahun Baru Islam (1 Muharram)", Date = new DateOnly(2026, 6, 16), HolidayType = "Religious", Color = "#8B5CF6", IsRecurringYearly = false, Description = "Tahun Baru Hijriyah 1448 H" },
                new MasterHoliday { Name = "Hari Kemerdekaan Indonesia",  Date = new DateOnly(2026, 8,  17), HolidayType = "National",  Color = "#EF4444", IsRecurringYearly = true,  Description = "HUT Kemerdekaan Republik Indonesia ke-81" },
                new MasterHoliday { Name = "Maulid Nabi Muhammad SAW",   Date = new DateOnly(2026, 9,  4),  HolidayType = "Religious", Color = "#8B5CF6", IsRecurringYearly = false, Description = "Peringatan Kelahiran Nabi Muhammad SAW" },
                new MasterHoliday { Name = "Hari Natal",                 Date = new DateOnly(2026, 12, 25), HolidayType = "Religious", Color = "#EF4444", IsRecurringYearly = true,  Description = "Natal — Hari Raya Kristen" },
                new MasterHoliday { Name = "Cuti Bersama Natal",         Date = new DateOnly(2026, 12, 26), HolidayType = "Company",   Color = "#3B82F6", IsRecurringYearly = false, Description = "Cuti bersama Natal" }
            );
            await context.SaveChangesAsync();
        }

        // 9. Ensure 7 Email Templates
        if (!await context.EmailTemplates.AnyAsync())
        {
            context.EmailTemplates.AddRange(
                new EmailTemplate
                {
                    EventCode = "USER_REGISTERED",
                    EventName = "Konfirmasi Pendaftaran Akun",
                    Category = "Account",
                    Subject = "Pendaftaran Akun {AppName} Berhasil",
                    BodyHtml = "<p>Halo <b>{FullName}</b>,</p><p>Terima kasih telah mendaftar di <b>{AppName}</b>. Akun Anda sedang menunggu persetujuan (approval) dari Administrator.</p>",
                    AvailableVariables = "{FullName},{AppName},{AppUrl},{CurrentYear}"
                },
                new EmailTemplate
                {
                    EventCode = "ADMIN_NEW_USER_ALERT",
                    EventName = "Pemberitahuan Pendaftar Baru ke Admin",
                    Category = "Admin",
                    Subject = "Pendaftar Baru Membutuhkan Persetujuan: {FullName}",
                    BodyHtml = "<p>Halo Admin,</p><p>Pengguna baru <b>{FullName}</b> ({RecipientEmail}) telah mendaftar untuk perusahaan <b>{CompanyName}</b> dan membutuhkan persetujuan.</p>",
                    AvailableVariables = "{FullName},{RecipientEmail},{CompanyName},{ActionUrl},{AppName}"
                },
                new EmailTemplate
                {
                    EventCode = "USER_APPROVED",
                    EventName = "Akun Disetujui Administrator",
                    Category = "Account",
                    Subject = "Akun Anda di {AppName} Telah Disetujui!",
                    BodyHtml = "<p>Selamat <b>{FullName}</b>,</p><p>Akun Anda telah disetujui oleh Administrator dan kini Anda dapat masuk ke aplikasi.</p><p><a href=\"{ActionUrl}\">Masuk ke Aplikasi</a></p>",
                    AvailableVariables = "{FullName},{ActionUrl},{AppName},{CurrentYear}"
                },
                new EmailTemplate
                {
                    EventCode = "USER_REJECTED",
                    EventName = "Pendaftaran Ditolak Administrator",
                    Category = "Account",
                    Subject = "Status Pendaftaran Akun di {AppName}",
                    BodyHtml = "<p>Halo <b>{FullName}</b>,</p><p>Mohon maaf, permohonan pendaftaran akun Anda belum dapat disetujui dengan alasan: <i>{RejectionReason}</i></p>",
                    AvailableVariables = "{FullName},{RejectionReason},{AppName}"
                },
                new EmailTemplate
                {
                    EventCode = "PASSWORD_RESET_NOTIFICATION",
                    EventName = "Reset Kata Sandi oleh Administrator",
                    Category = "Security",
                    Subject = "Pemberitahuan Reset Kata Sandi {AppName}",
                    BodyHtml = "<p>Halo <b>{FullName}</b>,</p><p>Kata sandi akun Anda telah di-reset oleh Administrator. Kata sandi sementara Anda adalah: <code>{NewPassword}</code></p>",
                    AvailableVariables = "{FullName},{NewPassword},{ActionUrl},{AppName}"
                },
                new EmailTemplate
                {
                    EventCode = "TASK_ASSIGNED",
                    EventName = "Penugasan Tugas Baru",
                    Category = "Task",
                    Subject = "Tugas Baru Dialokasikan: {TaskTitle}",
                    BodyHtml = "<p>Halo <b>{FullName}</b>,</p><p>Anda telah ditugaskan untuk mengerjakan tugas baru: <b>{TaskTitle}</b> pada proyek <b>{ProjectName}</b>.</p><p>Tenggat Waktu: {DueDate}</p>",
                    AvailableVariables = "{FullName},{TaskTitle},{ProjectName},{Priority},{DueDate},{ActionUrl}"
                },
                new EmailTemplate
                {
                    EventCode = "TASK_STATUS_CHANGED",
                    EventName = "Perubahan Status Tugas",
                    Category = "Task",
                    Subject = "Status Tugas Berubah: {TaskTitle} [{Status}]",
                    BodyHtml = "<p>Halo <b>{FullName}</b>,</p><p>Status tugas <b>{TaskTitle}</b> telah diperbarui menjadi <b>{Status}</b>.</p>",
                    AvailableVariables = "{FullName},{TaskTitle},{Status},{ActionUrl}"
                }
            );
            await context.SaveChangesAsync();
        }

        // 10. Ensure System Settings
        if (!await context.SystemSettings.AnyAsync())
        {
            context.SystemSettings.AddRange(
                new SystemSetting { Key = "Email_SmtpHost", Value = "smtp.mailtrap.io", Description = "SMTP Server Host" },
                new SystemSetting { Key = "Email_SmtpPort", Value = "2525", Description = "SMTP Server Port" },
                new SystemSetting { Key = "Email_SenderEmail", Value = "noreply@trackerkerja.com", Description = "Default Sender Email" },
                new SystemSetting { Key = "Email_SenderName", Value = "TrackerKerja System", Description = "Default Sender Display Name" },
                new SystemSetting { Key = "Email_EnableSsl", Value = "true", Description = "Enable SSL/TLS encryption" },
                new SystemSetting { Key = "Email_IsEnabled", Value = "false", Description = "Master switch for SMTP emails" },
                new SystemSetting { Key = "Sync_ApiKey", Value = "TrackerKerja_Default_Sync_Secret_Key_2026!", Description = "Secret key for host sync" }
            );
            await context.SaveChangesAsync();
        }

        // 11. Ensure a Sample Project if none exist
        if (!await context.Projects.AnyAsync())
        {
            var project = new Project
            {
                Name = "Pengembangan Work Tracker Pro v3.6",
                Description = "Modernisasi platform manajemen tugas kerja bertenaga .NET 8 Web API dan React SPA",
                Color = "#3B82F6",
                Deadline = DateTime.UtcNow.AddMonths(2),
                Status = ProjectStatus.Active,
                CompanyId = company.Id,
                CreatedAt = DateTime.UtcNow
            };
            context.Projects.Add(project);
            await context.SaveChangesAsync();

            // Sample Tasks
            var catBackend = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Backend Development");
            var catFrontend = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Frontend Development");

            context.Tasks.AddRange(
                new WorkTask
                {
                    Title = "Perancangan Schema Database MySQL & EF Core Migration",
                    Description = "Penyusunan 21 tabel relasional dan relasi foreign key",
                    Status = WorkTaskStatus.Done,
                    Priority = TaskPriority.High,
                    Progress = 100,
                    ProjectId = project.Id,
                    CategoryId = catBackend?.Id,
                    CompanyId = company.Id,
                    AssignedToUserId = adminUser.Id,
                    Milestone = "System Design",
                    DueDate = DateTime.UtcNow.AddDays(3),
                    CreatedAt = DateTime.UtcNow
                },
                new WorkTask
                {
                    Title = "Pengembangan RESTful Web API & Pipeline Autentikasi JWT",
                    Description = "Implementasi Auth controller, Task controller, dan middleware",
                    Status = WorkTaskStatus.InProgress,
                    Priority = TaskPriority.Critical,
                    Progress = 60,
                    ProjectId = project.Id,
                    CategoryId = catBackend?.Id,
                    CompanyId = company.Id,
                    AssignedToUserId = adminUser.Id,
                    Milestone = "Implementation",
                    DueDate = DateTime.UtcNow.AddDays(7),
                    CreatedAt = DateTime.UtcNow
                },
                new WorkTask
                {
                    Title = "Pembangunan Frontend React SPA dengan 40 Tema & 5 Google Fonts",
                    Description = "Desain antarmuka Grid-first dengan toggle Kanban, responsif mobile drawer dan bottom bar",
                    Status = WorkTaskStatus.InProgress,
                    Priority = TaskPriority.High,
                    Progress = 40,
                    ProjectId = project.Id,
                    CategoryId = catFrontend?.Id,
                    CompanyId = company.Id,
                    AssignedToUserId = adminUser.Id,
                    Milestone = "Implementation",
                    DueDate = DateTime.UtcNow.AddDays(10),
                    CreatedAt = DateTime.UtcNow
                }
            );
            await context.SaveChangesAsync();
        }
    }
}
