namespace WorkTracker.Core.Enums;

public enum AttendanceType
{
    Present = 1,
    Leave = 2,
    Sick = 3,
    Permission = 4,
    BusinessTrip = 5,
    Holiday = 6
}

public enum WorkLocation
{
    WFO = 1,
    WFH = 2,
    Dinas = 3,
    Remote = 4
}

public enum AttendanceStatus
{
    Approved = 1,
    Pending = 2,
    Rejected = 3
}
