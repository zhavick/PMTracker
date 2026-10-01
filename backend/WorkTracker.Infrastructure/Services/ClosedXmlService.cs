using ClosedXML.Excel;
using WorkTracker.Core.DTOs;

namespace WorkTracker.Infrastructure.Services;

public class ClosedXmlService
{
    public byte[] GeneratePersonalTimesheetExcel(
        string userName,
        string userEmail,
        string companyName,
        DateTime startDate,
        DateTime endDate,
        List<WorkSessionDto> sessions)
    {
        using var workbook = new XLWorkbook();

        // ----------------------------------------------------
        // SHEET 1: Timesheet Personal
        // ----------------------------------------------------
        var ws1 = workbook.Worksheets.Add("Timesheet Personal");
        ws1.ShowGridLines = true;

        // Title and Metadata
        ws1.Cell("B2").Value = "LAPORAN TIMESHEET KERJA PERSONAL";
        ws1.Cell("B2").Style.Font.Bold = true;
        ws1.Cell("B2").Style.Font.FontSize = 16;
        ws1.Cell("B2").Style.Font.FontColor = XLColor.FromArgb(99, 102, 241); // Indigo

        ws1.Cell("B4").Value = "Nama Karyawan:";
        ws1.Cell("C4").Value = userName;
        ws1.Cell("C4").Style.Font.Bold = true;

        ws1.Cell("B5").Value = "Email:";
        ws1.Cell("C5").Value = userEmail;

        ws1.Cell("B6").Value = "Organisasi / PT:";
        ws1.Cell("C6").Value = companyName;

        ws1.Cell("E4").Value = "Periode:";
        ws1.Cell("F4").Value = $"{startDate:dd/MM/yyyy} s.d. {endDate:dd/MM/yyyy}";
        ws1.Cell("F4").Style.Font.Bold = true;

        ws1.Cell("E5").Value = "Tanggal Cetak:";
        ws1.Cell("F5").Value = DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm:ss") + " UTC";

        ws1.Cell("E6").Value = "Total Sesi Tercatat:";
        ws1.Cell("F6").Value = sessions.Count;

        // Table Headers (Row 8)
        int headerRow = 8;
        string[] headers = new[]
        {
            "No", "Tanggal", "Mulai (WIB)", "Selesai (WIB)", "Durasi (Jam)", "Nama Proyek", "Judul Tugas", "Catatan Aktivitas"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws1.Cell(headerRow, i + 2);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromArgb(238, 242, 255); // Indigo 50
            cell.Style.Font.FontColor = XLColor.FromArgb(49, 46, 129); // Indigo 900
            cell.Style.Alignment.Horizontal = i == 0 || i == 4 ? XLAlignmentHorizontalValues.Center : XLAlignmentHorizontalValues.Left;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromArgb(199, 210, 254);
        }

        // Data Rows
        int currentRow = headerRow + 1;
        int no = 1;
        foreach (var s in sessions.OrderBy(x => x.StartTime))
        {
            double durationHours = Math.Round((double)s.Duration / 3600.0, 2);

            ws1.Cell(currentRow, 2).Value = no++;
            ws1.Cell(currentRow, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws1.Cell(currentRow, 3).Value = s.StartTime.ToString("dd/MM/yyyy");
            ws1.Cell(currentRow, 4).Value = s.StartTime.ToString("HH:mm");
            ws1.Cell(currentRow, 5).Value = s.EndTime.HasValue ? s.EndTime.Value.ToString("HH:mm") : "Aktif";

            var durCell = ws1.Cell(currentRow, 6);
            durCell.Value = durationHours;
            durCell.Style.NumberFormat.Format = "0.00";
            durCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            ws1.Cell(currentRow, 7).Value = s.ProjectName ?? "Umum / Non-Proyek";
            ws1.Cell(currentRow, 8).Value = s.TaskTitle;
            ws1.Cell(currentRow, 9).Value = s.Notes ?? "-";

            for (int col = 2; col <= 9; col++)
            {
                ws1.Cell(currentRow, col).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                ws1.Cell(currentRow, col).Style.Border.OutsideBorderColor = XLColor.FromArgb(226, 232, 240);
            }

            currentRow++;
        }

        // Summary Row with Excel Formula =SUM(F9:F...)
        if (sessions.Count > 0)
        {
            ws1.Cell(currentRow, 2).Value = "TOTAL JAM KERJA";
            ws1.Range(currentRow, 2, currentRow, 5).Merge();
            ws1.Range(currentRow, 2, currentRow, 5).Style.Font.Bold = true;
            ws1.Range(currentRow, 2, currentRow, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws1.Range(currentRow, 2, currentRow, 5).Style.Fill.BackgroundColor = XLColor.FromArgb(241, 245, 249);

            var totalCell = ws1.Cell(currentRow, 6);
            totalCell.FormulaA1 = $"=SUM(F{headerRow + 1}:F{currentRow - 1})";
            totalCell.Style.Font.Bold = true;
            totalCell.Style.NumberFormat.Format = "0.00";
            totalCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            totalCell.Style.Fill.BackgroundColor = XLColor.FromArgb(254, 243, 199); // Amber 100

            ws1.Range(currentRow, 7, currentRow, 9).Merge();
            ws1.Range(currentRow, 7, currentRow, 9).Style.Fill.BackgroundColor = XLColor.FromArgb(241, 245, 249);

            for (int col = 2; col <= 9; col++)
            {
                ws1.Cell(currentRow, col).Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
                ws1.Cell(currentRow, col).Style.Border.OutsideBorderColor = XLColor.FromArgb(148, 163, 184);
            }
        }

        ws1.Columns().AdjustToContents();

        // ----------------------------------------------------
        // SHEET 2: Rekap per Proyek
        // ----------------------------------------------------
        var ws2 = workbook.Worksheets.Add("Rekap per Proyek");
        ws2.ShowGridLines = true;

        ws2.Cell("B2").Value = "RINGKASAN ALOKASI WAKTU PER PROYEK";
        ws2.Cell("B2").Style.Font.Bold = true;
        ws2.Cell("B2").Style.Font.FontSize = 14;
        ws2.Cell("B2").Style.Font.FontColor = XLColor.FromArgb(99, 102, 241);

        ws2.Cell("B4").Value = "No";
        ws2.Cell("C4").Value = "Nama Proyek";
        ws2.Cell("D4").Value = "Jumlah Sesi";
        ws2.Cell("E4").Value = "Total Jam Kerja";
        ws2.Cell("F4").Value = "Kontribusi (%)";

        for (int col = 2; col <= 6; col++)
        {
            var c = ws2.Cell(4, col);
            c.Style.Font.Bold = true;
            c.Style.Fill.BackgroundColor = XLColor.FromArgb(238, 242, 255);
            c.Style.Font.FontColor = XLColor.FromArgb(49, 46, 129);
            c.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            c.Style.Border.OutsideBorderColor = XLColor.FromArgb(199, 210, 254);
        }

        var projectGroups = sessions
            .GroupBy(s => s.ProjectName ?? "Umum / Non-Proyek")
            .Select(g => new
            {
                ProjectName = g.Key,
                SessionCount = g.Count(),
                TotalHours = Math.Round(g.Sum(x => x.Duration) / 3600.0, 2)
            })
            .OrderByDescending(x => x.TotalHours)
            .ToList();

        double grandTotalHours = projectGroups.Sum(x => x.TotalHours);

        int row2 = 5;
        int no2 = 1;
        foreach (var pg in projectGroups)
        {
            double pct = grandTotalHours > 0 ? Math.Round((pg.TotalHours / grandTotalHours) * 100.0, 1) : 0;

            ws2.Cell(row2, 2).Value = no2++;
            ws2.Cell(row2, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws2.Cell(row2, 3).Value = pg.ProjectName;
            ws2.Cell(row2, 4).Value = pg.SessionCount;
            ws2.Cell(row2, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws2.Cell(row2, 5).Value = pg.TotalHours;
            ws2.Cell(row2, 5).Style.NumberFormat.Format = "0.00";
            ws2.Cell(row2, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            ws2.Cell(row2, 6).Value = $"{pct}%";
            ws2.Cell(row2, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            for (int col = 2; col <= 6; col++)
            {
                ws2.Cell(row2, col).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                ws2.Cell(row2, col).Style.Border.OutsideBorderColor = XLColor.FromArgb(226, 232, 240);
            }
            row2++;
        }

        if (projectGroups.Count > 0)
        {
            ws2.Cell(row2, 2).Value = "TOTAL KESELURUHAN";
            ws2.Range(row2, 2, row2, 3).Merge();
            ws2.Range(row2, 2, row2, 3).Style.Font.Bold = true;
            ws2.Range(row2, 2, row2, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            ws2.Cell(row2, 4).FormulaA1 = $"=SUM(D5:D{row2 - 1})";
            ws2.Cell(row2, 4).Style.Font.Bold = true;
            ws2.Cell(row2, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws2.Cell(row2, 5).FormulaA1 = $"=SUM(E5:E{row2 - 1})";
            ws2.Cell(row2, 5).Style.Font.Bold = true;
            ws2.Cell(row2, 5).Style.NumberFormat.Format = "0.00";
            ws2.Cell(row2, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            ws2.Cell(row2, 6).Value = "100%";
            ws2.Cell(row2, 6).Style.Font.Bold = true;
            ws2.Cell(row2, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            for (int col = 2; col <= 6; col++)
            {
                ws2.Cell(row2, col).Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
                ws2.Cell(row2, col).Style.Border.OutsideBorderColor = XLColor.FromArgb(148, 163, 184);
                ws2.Cell(row2, col).Style.Fill.BackgroundColor = XLColor.FromArgb(241, 245, 249);
            }
        }

        ws2.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public byte[] GenerateTaskListExcel(string reportTitle, List<WorkTaskDto> tasks)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Daftar Tugas");
        ws.ShowGridLines = true;

        // Title
        ws.Cell("B2").Value = reportTitle.ToUpperInvariant();
        ws.Cell("B2").Style.Font.Bold = true;
        ws.Cell("B2").Style.Font.FontSize = 16;
        ws.Cell("B2").Style.Font.FontColor = XLColor.FromArgb(59, 130, 246); // Blue

        ws.Cell("B4").Value = "Tanggal Ekspor:";
        ws.Cell("C4").Value = DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm:ss") + " UTC";
        ws.Cell("B5").Value = "Total Tugas:";
        ws.Cell("C5").Value = tasks.Count;
        ws.Cell("C5").Style.Font.Bold = true;

        // Headers
        int headerRow = 7;
        string[] headers = new[]
        {
            "No", "Proyek", "Judul Tugas", "PIC / Assignee", "Status", "Prioritas", "Progres (%)", "Milestone", "Tanggal Mulai", "Tenggat Waktu", "Deskripsi & Modul"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(headerRow, i + 2);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromArgb(239, 246, 255); // Blue 50
            cell.Style.Font.FontColor = XLColor.FromArgb(30, 58, 138); // Blue 900
            cell.Style.Alignment.Horizontal = (i == 0 || i == 6) ? XLAlignmentHorizontalValues.Center : XLAlignmentHorizontalValues.Left;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromArgb(191, 219, 254);
        }

        int currRow = headerRow + 1;
        int no = 1;
        foreach (var t in tasks)
        {
            ws.Cell(currRow, 2).Value = no++;
            ws.Cell(currRow, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws.Cell(currRow, 3).Value = t.ProjectName ?? "Tanpa Proyek";
            ws.Cell(currRow, 4).Value = t.Title;
            ws.Cell(currRow, 5).Value = t.AssignedToName ?? "Belum Ditugaskan";
            ws.Cell(currRow, 6).Value = t.Status.ToString();
            ws.Cell(currRow, 7).Value = t.Priority.ToString();

            var progCell = ws.Cell(currRow, 8);
            progCell.Value = t.Progress;
            progCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws.Cell(currRow, 9).Value = t.Milestone ?? "Implementation";
            ws.Cell(currRow, 10).Value = t.StartDate.HasValue ? t.StartDate.Value.ToString("dd/MM/yyyy") : "-";
            ws.Cell(currRow, 11).Value = t.DueDate.HasValue ? t.DueDate.Value.ToString("dd/MM/yyyy") : "-";
            ws.Cell(currRow, 12).Value = t.Description ?? "-";

            for (int c = 2; c <= 12; c++)
            {
                ws.Cell(currRow, c).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                ws.Cell(currRow, c).Style.Border.OutsideBorderColor = XLColor.FromArgb(226, 232, 240);
            }
            currRow++;
        }

        ws.Columns().AdjustToContents(1, 100);

        // ----------------------------------------------------
        // SHEET 2: Rekap per Proyek & PIC
        // ----------------------------------------------------
        var ws2 = workbook.Worksheets.Add("Rekapitulasi");
        ws2.ShowGridLines = true;
        ws2.Cell("B2").Value = "REKAPITULASI TUGAS PER PIC & PROYEK";
        ws2.Cell("B2").Style.Font.Bold = true;
        ws2.Cell("B2").Style.Font.FontSize = 14;

        ws2.Cell("B4").Value = "No";
        ws2.Cell("C4").Value = "Nama Anggota / PIC";
        ws2.Cell("D4").Value = "Total Tugas";
        ws2.Cell("E4").Value = "Selesai (Done)";
        ws2.Cell("F4").Value = "Sedang Dikerjakan";
        ws2.Cell("G4").Value = "Rata-rata Progres";

        for (int c = 2; c <= 7; c++)
        {
            var cell = ws2.Cell(4, c);
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromArgb(243, 244, 246);
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        }

        var picGroups = tasks
            .GroupBy(t => t.AssignedToName ?? "Belum Ditugaskan")
            .Select(g => new
            {
                Pic = g.Key,
                Total = g.Count(),
                Done = g.Count(x => x.Status == WorkTracker.Core.Enums.WorkTaskStatus.Done || x.Status == WorkTracker.Core.Enums.WorkTaskStatus.Completed),
                InProgress = g.Count(x => x.Status == WorkTracker.Core.Enums.WorkTaskStatus.InProgress),
                AvgProgress = g.Average(x => (double)x.Progress)
            })
            .OrderByDescending(x => x.Total)
            .ToList();

        int r2 = 5;
        int noPic = 1;
        foreach (var p in picGroups)
        {
            ws2.Cell(r2, 2).Value = noPic++;
            ws2.Cell(r2, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws2.Cell(r2, 3).Value = p.Pic;
            ws2.Cell(r2, 4).Value = p.Total;
            ws2.Cell(r2, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws2.Cell(r2, 5).Value = p.Done;
            ws2.Cell(r2, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws2.Cell(r2, 6).Value = p.InProgress;
            ws2.Cell(r2, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws2.Cell(r2, 7).Value = $"{Math.Round(p.AvgProgress, 1)}%";
            ws2.Cell(r2, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            for (int c = 2; c <= 7; c++)
            {
                ws2.Cell(r2, c).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                ws2.Cell(r2, c).Style.Border.OutsideBorderColor = XLColor.FromArgb(226, 232, 240);
            }
            r2++;
        }

        ws2.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public byte[] GenerateElistecTimesheetExcel(
        string memberName,
        string memberFullName,
        string clientName,
        string sowNo,
        int durationDays,
        List<ElistecTimesheetRowDto> rows,
        string? supervisorSigner = "xxxx")
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Sheet1");
        ws.ShowGridLines = true;

        // Row 2: Title
        var titleCell = ws.Cell("E2");
        titleCell.Value = "ELISTEC - Timesheet";
        titleCell.Style.Font.Bold = true;
        titleCell.Style.Font.FontSize = 14;
        titleCell.Style.Font.FontName = "Calibri";
        titleCell.Style.Font.FontColor = XLColor.FromArgb(31, 78, 120);

        // Row 4: Duration & Client Name
        ws.Cell("A4").Value = "Duration:";
        ws.Cell("A4").Style.Font.Bold = true;
        ws.Cell("A4").Style.Font.FontName = "Calibri";

        ws.Cell("B4").Value = $"{durationDays} DAYS";
        ws.Cell("B4").Style.Font.Bold = true;
        ws.Cell("B4").Style.Font.FontName = "Calibri";

        ws.Cell("F4").Value = "Client Name:";
        ws.Cell("F4").Style.Font.Bold = true;
        ws.Cell("F4").Style.Font.FontName = "Calibri";

        ws.Cell("G4").Value = clientName;
        ws.Cell("G4").Style.Font.Bold = true;
        ws.Cell("G4").Style.Font.FontName = "Calibri";

        ws.Cell("K4").Value = "Client Name:";
        ws.Cell("K4").Style.Font.FontName = "Calibri";

        // Row 5: Name & SOW No
        ws.Cell("A5").Value = "Name:";
        ws.Cell("A5").Style.Font.Bold = true;
        ws.Cell("A5").Style.Font.FontName = "Calibri";

        ws.Cell("B5").Value = memberFullName;
        ws.Cell("B5").Style.Font.Bold = true;
        ws.Cell("B5").Style.Font.FontName = "Calibri";

        ws.Cell("K5").Value = "SOW No.:";
        ws.Cell("K5").Style.Font.Bold = true;
        ws.Cell("K5").Style.Font.FontName = "Calibri";

        ws.Cell("L5").Value = string.IsNullOrWhiteSpace(sowNo) ? "-" : sowNo;
        ws.Cell("L5").Style.Font.FontName = "Calibri";

        // Row 7: Table Headers
        int headerRow = 7;
        string[] headers = new[]
        {
            "Issue Key", "Issue Summary", "Hours", "MD", "Work Date", "Clock In", "Clock Out", 
            "Username", "Full Name", "Period", "Project Name", "Activity Type", "Working Place"
        };

        var headerBg = XLColor.FromArgb(31, 78, 120); // Dark Navy Blue #1F4E78
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(headerRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 11;
            cell.Style.Font.FontName = "Calibri";
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = headerBg;
            cell.Style.Alignment.Horizontal = (i == 0 || i == 2 || i == 3 || i == 4 || i == 5 || i == 6 || i == 9 || i == 12)
                ? XLAlignmentHorizontalValues.Center
                : XLAlignmentHorizontalValues.Left;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromArgb(200, 200, 200);
        }

        // Data Rows (Row 8 onwards)
        int currentRow = headerRow + 1;
        foreach (var r in rows)
        {
            // Col A: Issue Key
            ws.Cell(currentRow, 1).Value = r.IssueKey;
            ws.Cell(currentRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Col B: Issue Summary
            ws.Cell(currentRow, 2).Value = r.IssueSummary;
            ws.Cell(currentRow, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

            // Col C: Hours
            ws.Cell(currentRow, 3).Value = r.Hours;
            ws.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws.Cell(currentRow, 3).Style.NumberFormat.Format = "0.##";

            // Col D: MD Formula =IF(C{row}="","",C{row}/8)
            ws.Cell(currentRow, 4).FormulaA1 = $"=IF(C{currentRow}=\"\",\"\",C{currentRow}/8)";
            ws.Cell(currentRow, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws.Cell(currentRow, 4).Style.NumberFormat.Format = "0.###";

            // Col E: Work Date
            ws.Cell(currentRow, 5).Value = r.WorkDate.ToString("dd/MM/yyyy");
            ws.Cell(currentRow, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Col F: Clock In
            ws.Cell(currentRow, 6).Value = r.ClockIn;
            ws.Cell(currentRow, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Col G: Clock Out
            ws.Cell(currentRow, 7).Value = r.ClockOut;
            ws.Cell(currentRow, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Col H: Username
            ws.Cell(currentRow, 8).Value = r.Username;

            // Col I: Full Name
            ws.Cell(currentRow, 9).Value = r.FullName;

            // Col J: Period
            ws.Cell(currentRow, 10).Value = r.Period;
            ws.Cell(currentRow, 10).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Col K: Project Name
            ws.Cell(currentRow, 11).Value = r.ProjectName;

            // Col L: Activity Type
            ws.Cell(currentRow, 12).Value = r.ActivityType;

            // Col M: Working Place
            ws.Cell(currentRow, 13).Value = r.WorkingPlace;
            ws.Cell(currentRow, 13).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Row styling
            for (int c = 1; c <= 13; c++)
            {
                var cell = ws.Cell(currentRow, c);
                cell.Style.Font.FontName = "Calibri";
                cell.Style.Font.FontSize = 10;
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.OutsideBorderColor = XLColor.FromArgb(220, 224, 230);
                if (r.IsWeekendOrHoliday)
                {
                    cell.Style.Fill.BackgroundColor = XLColor.FromArgb(248, 249, 250);
                    cell.Style.Font.FontColor = XLColor.FromArgb(100, 116, 139);
                }
            }

            currentRow++;
        }

        // Summary Row
        int lastDataRow = currentRow - 1;
        if (rows.Count > 0)
        {
            ws.Cell(currentRow, 2).Value = "Total ";
            ws.Cell(currentRow, 2).Style.Font.Bold = true;
            ws.Cell(currentRow, 2).Style.Font.FontName = "Calibri";
            ws.Cell(currentRow, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            ws.Cell(currentRow, 3).FormulaA1 = $"=SUM(C{headerRow + 1}:C{lastDataRow})";
            ws.Cell(currentRow, 3).Style.Font.Bold = true;
            ws.Cell(currentRow, 3).Style.Font.FontName = "Calibri";
            ws.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws.Cell(currentRow, 3).Style.NumberFormat.Format = "0.##";

            ws.Cell(currentRow, 4).FormulaA1 = $"=SUM(D{headerRow + 1}:D{lastDataRow})";
            ws.Cell(currentRow, 4).Style.Font.Bold = true;
            ws.Cell(currentRow, 4).Style.Font.FontName = "Calibri";
            ws.Cell(currentRow, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws.Cell(currentRow, 4).Style.NumberFormat.Format = "0.###";

            for (int c = 1; c <= 13; c++)
            {
                var cell = ws.Cell(currentRow, c);
                cell.Style.Border.TopBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.BottomBorder = XLBorderStyleValues.Double;
                cell.Style.Fill.BackgroundColor = XLColor.FromArgb(243, 244, 246);
            }
        }

        // Signatures Block
        int sigRow = currentRow + 3;
        ws.Cell(sigRow, 2).Value = "Resource,";
        ws.Cell(sigRow, 2).Style.Font.Bold = true;
        ws.Cell(sigRow, 2).Style.Font.FontName = "Calibri";

        ws.Cell(sigRow, 7).Value = "Mengetahui,";
        ws.Cell(sigRow, 7).Style.Font.Bold = true;
        ws.Cell(sigRow, 7).Style.Font.FontName = "Calibri";

        int sigNameRow = sigRow + 8;
        ws.Cell(sigNameRow, 7).Value = string.IsNullOrWhiteSpace(supervisorSigner) ? "xxxx" : supervisorSigner;
        ws.Cell(sigNameRow, 7).Style.Font.FontName = "Calibri";

        ws.Cell(sigNameRow + 2, 2).Value = memberFullName;
        ws.Cell(sigNameRow + 2, 2).Style.Font.Bold = true;
        ws.Cell(sigNameRow + 2, 2).Style.Font.FontName = "Calibri";

        // Column Widths
        ws.Column(1).Width = 12;   // Issue Key
        ws.Column(2).Width = 75;   // Issue Summary
        ws.Column(3).Width = 10;   // Hours
        ws.Column(4).Width = 10;   // MD
        ws.Column(5).Width = 16;   // Work Date
        ws.Column(6).Width = 14;   // Clock In
        ws.Column(7).Width = 14;   // Clock Out
        ws.Column(8).Width = 18;   // Username
        ws.Column(9).Width = 24;   // Full Name
        ws.Column(10).Width = 12;  // Period
        ws.Column(11).Width = 26;  // Project Name
        ws.Column(12).Width = 32;  // Activity Type
        ws.Column(13).Width = 14;  // Working Place

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}

