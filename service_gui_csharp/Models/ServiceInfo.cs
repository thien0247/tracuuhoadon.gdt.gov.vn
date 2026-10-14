// @id 01M4V0HMQMVTWS9TDDF30AH9FQ
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
namespace GDTTaxCrawlerManager.Models;

public enum ServiceStatus
{
    Stopped,
    Starting,
    Running,
    Error
}

public class ServiceInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Port { get; set; }
    public string? CheckUrl { get; set; }
    public bool IsOptional { get; set; }

    public ServiceStatus Status { get; set; } = ServiceStatus.Stopped;
    public int? ProcessId { get; set; }
    public string? StatusMessage { get; set; }
}
