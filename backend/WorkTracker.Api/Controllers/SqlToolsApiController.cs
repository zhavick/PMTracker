using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkTracker.Core.DTOs;

namespace WorkTracker.Api.Controllers;

[ApiController]
[Route("api/sqltools")]
[Authorize]
public class SqlToolsApiController : ControllerBase
{
    private static readonly string[] MajorClauses = new[]
    {
        "SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY",
        "LIMIT", "OFFSET", "UNION ALL", "UNION", "INSERT INTO", "VALUES",
        "UPDATE", "SET", "DELETE FROM", "JOIN", "INNER JOIN", "LEFT JOIN",
        "RIGHT JOIN", "FULL OUTER JOIN", "CROSS JOIN", "ON", "CREATE TABLE", "ALTER TABLE"
    };

    private static readonly string[] KeywordsToUppercase = new[]
    {
        "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "BETWEEN",
        "JOIN", "INNER", "LEFT", "RIGHT", "OUTER", "CROSS", "ON", "AS", "GROUP", "BY",
        "ORDER", "ASC", "DESC", "HAVING", "LIMIT", "OFFSET", "INSERT", "INTO", "VALUES",
        "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "DROP", "ALTER", "ADD", "CONSTRAINT",
        "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "INDEX", "UNIQUE", "CASE", "WHEN", "THEN",
        "ELSE", "END", "COALESCE", "COUNT", "SUM", "AVG", "MIN", "MAX", "DISTINCT", "EXISTS"
    };

    [HttpPost("format")]
    public IActionResult FormatSql([FromBody] SqlFormatRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Sql))
            return BadRequest(ApiResponse<object>.Fail("Teks kueri SQL tidak boleh kosong."));

        var rawSql = dto.Sql.Trim();
        var indent = new string(' ', Math.Clamp(dto.IndentSpaces, 2, 8));

        // Format SQL lines
        var formatted = FormatSqlText(rawSql, dto.UppercaseKeywords, indent, dto.Dialect);
        var lines = formatted.Split('\n').Length;

        var result = new SqlFormatResultDto
        {
            FormattedSql = formatted,
            Dialect = dto.Dialect,
            LineCount = lines,
            OriginalLength = rawSql.Length,
            FormattedLength = formatted.Length
        };

        return Ok(ApiResponse<SqlFormatResultDto>.Success(result));
    }

    [HttpPost("minify")]
    public IActionResult MinifySql([FromBody] SqlMinifyRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Sql))
            return BadRequest(ApiResponse<object>.Fail("Teks kueri SQL tidak boleh kosong."));

        // Remove comments (-- and /* */)
        var noComments = Regex.Replace(dto.Sql, @"--.*?(\r?\n|$)", " ");
        noComments = Regex.Replace(noComments, @"/\*.*?\*/", " ", RegexOptions.Singleline);

        // Collapse whitespace
        var minified = Regex.Replace(noComments, @"\s+", " ").Trim();

        return Ok(ApiResponse<object>.Success(new { minifiedSql = minified }, "Kueri SQL berhasil diminifikasi."));
    }

    [HttpPost("validate")]
    public IActionResult ValidateSql([FromBody] SqlValidateRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Sql))
            return BadRequest(ApiResponse<object>.Fail("Teks kueri SQL tidak boleh kosong."));

        var sql = dto.Sql.Trim();
        var errors = new List<string>();
        var warnings = new List<string>();

        // 1. Check balanced parentheses
        int parenBalance = 0;
        bool inSingleQuote = false;
        bool inDoubleQuote = false;

        for (int i = 0; i < sql.Length; i++)
        {
            char c = sql[i];
            if (c == '\'' && (i == 0 || sql[i - 1] != '\\'))
                inSingleQuote = !inSingleQuote;
            else if (c == '"' && (i == 0 || sql[i - 1] != '\\'))
                inDoubleQuote = !inDoubleQuote;
            else if (!inSingleQuote && !inDoubleQuote)
            {
                if (c == '(') parenBalance++;
                else if (c == ')')
                {
                    parenBalance--;
                    if (parenBalance < 0)
                    {
                        errors.Add($"Tanda kurung tutup ')' berlebih pada karakter posisi {i}.");
                        break;
                    }
                }
            }
        }

        if (parenBalance > 0)
            errors.Add($"Terdapat {parenBalance} tanda kurung buka '(' yang belum ditutup.");
        if (inSingleQuote)
            errors.Add("Tanda kutip tunggal (') tidak tertutup secara sempurna.");
        if (inDoubleQuote)
            errors.Add("Tanda kutip ganda (\") tidak tertutup secara sempurna.");

        // 2. Check basic query syntax
        var upper = sql.ToUpperInvariant();
        if (upper.Contains("SELECT") && !upper.Contains("FROM") && !upper.Contains("SELECT 1") && !upper.Contains("VERSION()"))
        {
            warnings.Add("Klausa SELECT terdeteksi tanpa klausa FROM. Pastikan ini adalah ekspresi fungsi scalar atau kueri dummy.");
        }

        if (upper.Contains("DELETE") && !upper.Contains("WHERE"))
        {
            warnings.Add("Peringatan Keamanan: Kueri DELETE tanpa klausa WHERE akan menghapus seluruh data tabel.");
        }

        if (upper.Contains("UPDATE") && !upper.Contains("WHERE"))
        {
            warnings.Add("Peringatan Keamanan: Kueri UPDATE tanpa klausa WHERE akan memutasi seluruh baris tabel.");
        }

        var isValid = errors.Count == 0;
        var result = new SqlValidationResultDto
        {
            IsValid = isValid,
            Message = isValid ? "Sintaks SQL valid dan berimbang." : "Ditemukan kesalahan struktur sintaks SQL.",
            Errors = errors,
            Warnings = warnings
        };

        return Ok(ApiResponse<SqlValidationResultDto>.Success(result));
    }

    private static string FormatSqlText(string input, bool uppercaseKeywords, string indent, string dialect)
    {
        var text = input;

        // Uppercase keywords
        if (uppercaseKeywords)
        {
            foreach (var kw in KeywordsToUppercase)
            {
                text = Regex.Replace(text, $@"\b{kw}\b", kw, RegexOptions.IgnoreCase);
            }
        }

        // Add linebreaks before major clauses
        foreach (var clause in MajorClauses)
        {
            text = Regex.Replace(text, $@"\b{clause}\b", $"\n{clause}", RegexOptions.IgnoreCase);
        }

        // Clean redundant line breaks and indent
        var lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        var sb = new StringBuilder();

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (string.IsNullOrEmpty(line)) continue;

            bool isMajor = MajorClauses.Any(c => line.StartsWith(c, StringComparison.OrdinalIgnoreCase));
            if (isMajor)
            {
                sb.AppendLine(line);
            }
            else
            {
                sb.AppendLine($"{indent}{line}");
            }
        }

        return sb.ToString().TrimEnd();
    }
}
