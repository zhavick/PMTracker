using System.ComponentModel.DataAnnotations;

namespace WorkTracker.Core.DTOs;

public class SqlFormatRequestDto
{
    [Required]
    public string Sql { get; set; } = string.Empty;
    public string Dialect { get; set; } = "mysql"; // standard, mysql, postgres, tsql, oracle, sqlite, etc.
    public bool UppercaseKeywords { get; set; } = true;
    public int IndentSpaces { get; set; } = 4;
}

public class SqlFormatResultDto
{
    public string FormattedSql { get; set; } = string.Empty;
    public string Dialect { get; set; } = "mysql";
    public int LineCount { get; set; }
    public long OriginalLength { get; set; }
    public long FormattedLength { get; set; }
}

public class SqlMinifyRequestDto
{
    [Required]
    public string Sql { get; set; } = string.Empty;
}

public class SqlValidateRequestDto
{
    [Required]
    public string Sql { get; set; } = string.Empty;
    public string Dialect { get; set; } = "mysql";
}

public class SqlValidationResultDto
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = "Sintaks SQL valid.";
    public List<string> Errors { get; set; } = new List<string>();
    public List<string> Warnings { get; set; } = new List<string>();
}
