namespace WorkTracker.Core.Enums;

public enum BadgeRarity
{
    Common = 1,
    Rare = 2,
    Epic = 3,
    Legendary = 4
}

public enum BadgeTriggerType
{
    Manual = 0,
    Auto_DoneTasks = 1,          // Total tasks completed >= threshold
    Auto_WorkHours = 2,          // Total timesheet hours >= threshold
    Auto_AttendanceStreak = 3,   // Consecutive attendance days >= threshold
    Auto_MonthlyTopTasks = 4,    // Monthly top task doer (leaderboard)
    Auto_TasksAbove100 = 5,      // Completed tasks >= 100 total
    Auto_OvertimeHours = 6,      // Timesheet hours > 8h/day instances >= threshold
    Auto_NotesCreated = 7,       // Total notes/documents >= threshold
    Auto_ProjectsManaged = 8,    // Projects contributed >= threshold
    Auto_EarlyBird = 9,          // Check-in before 07:30 streak
    Auto_NightOwl = 10,          // Check-out after 20:00 instances >= threshold
    Auto_TicketsResolved = 11,   // Tiket issue/bug terselesaikan >= threshold
    Auto_TicketsReported = 12,   // Issue berkualitas dilaporkan >= threshold
    Auto_WeekendWarrior = 13,    // Jam kerja/task di akhir pekan (Sabtu/Minggu)
    Auto_SpeedDemon = 14,        // Task selesai cepat (< 2 jam)
    Auto_ZeroDefect = 15         // Critical/High tasks selesai tanpa kendala
}

public enum RewardType
{
    CashTransfer = 1,     // Transfer Bank (BCA, Mandiri, BRI, BNI)
    EWallet = 2,          // GoPay, OVO, Dana, ShopeePay
    TreatMeal = 3,        // Traktir Makan Siang / Malam Bersama
    TreatCoffee = 4,      // Traktir Kopi / Minuman Favorit
    Voucher = 5,          // Voucher Belanja / Gift Card
    Other = 6             // Hadiah Lainnya
}

public enum ClaimStatus
{
    Pending = 1,          // Menunggu Verifikasi Admin
    Approved = 2,         // Disetujui Admin, Menunggu Pembayaran / Traktiran
    PaidOrTreated = 3,    // Sudah Ditransfer Uang / Selesai Ditraktir
    Rejected = 4          // Ditolak
}
