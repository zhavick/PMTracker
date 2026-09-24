namespace WorkTracker.Core.DTOs;

public class ApiResponse<T>
{
    public bool IsSuccess { get; set; } = true;
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> Success(T data, string message = "Operasi berhasil dieksekusi.")
    {
        return new ApiResponse<T>
        {
            IsSuccess = true,
            Message = message,
            Data = data,
            Timestamp = DateTime.UtcNow
        };
    }

    public static ApiResponse<T> Fail(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            IsSuccess = false,
            Message = message,
            Errors = errors,
            Timestamp = DateTime.UtcNow
        };
    }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new List<T>();
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int TotalItems { get; set; } = 0;
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}
