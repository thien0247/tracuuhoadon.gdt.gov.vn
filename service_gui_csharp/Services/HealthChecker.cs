// @id 01M4V0HMQNHW18B9RC8VXA2ZRR
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Net.Http;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using GDTTaxCrawlerManager.Models;

namespace GDTTaxCrawlerManager.Services;

public static class HealthChecker
{
    private static readonly HttpClient _httpClient = new(new SocketsHttpHandler
    {
        UseProxy = false, // Tránh proxy cục bộ xung đột localhost
        PooledConnectionLifetime = TimeSpan.FromMinutes(10),
        ConnectTimeout = TimeSpan.FromMilliseconds(1500)
    })
    {
        Timeout = TimeSpan.FromMilliseconds(2000)
    };

    public static async Task<bool> IsPortListeningAsync(string host, int port, int timeoutMs = 800)
    {
        try
        {
            using var tcpClient = new TcpClient();
            using var cts = new CancellationTokenSource(timeoutMs);
            await tcpClient.ConnectAsync(host, port, cts.Token);
            return tcpClient.Connected;
        }
        catch
        {
            return false;
        }
    }

    public static async Task<bool> IsHttpHealthyAsync(string url)
    {
        try
        {
            using var response = await _httpClient.GetAsync(url);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public static async Task<(ServiceStatus Status, string Message)> CheckServiceAsync(ServiceInfo service)
    {
        if (service.Id == "postgresql_db")
        {
            if (await IsPortListeningAsync("127.0.0.1", 5433))
            {
                service.Port = 5433;
                return (ServiceStatus.Running, "Cổng 5433 (PostgreSQL 16) đang hoạt động");
            }
            if (await IsPortListeningAsync("127.0.0.1", 5432))
            {
                service.Port = 5432;
                return (ServiceStatus.Running, "Cổng 5432 (PostgreSQL) đang hoạt động");
            }
            return (ServiceStatus.Stopped, "Cổng CSDL PostgreSQL (5433/5432) không phản hồi");
        }

        if (service.Id == "crawler_scheduler")
        {
            bool workerUp = await IsPortListeningAsync("127.0.0.1", 8124, 400);
            return workerUp
                ? (ServiceStatus.Running, "Lập lịch tự động (Tích hợp trong Python Worker)")
                : (ServiceStatus.Stopped, "Tiến trình chưa được kích hoạt");
        }

        if (service.Port > 0)
        {
            bool isPortOpen = await IsPortListeningAsync("127.0.0.1", service.Port);
            if (!isPortOpen)
            {
                return (ServiceStatus.Stopped, $"Cổng {service.Port} không phản hồi");
            }

            if (!string.IsNullOrEmpty(service.CheckUrl))
            {
                bool isHttpOk = await IsHttpHealthyAsync(service.CheckUrl);
                if (isHttpOk)
                {
                    return (ServiceStatus.Running, $"Cổng {service.Port} & HTTP 200 OK");
                }
                return (ServiceStatus.Starting, $"Cổng {service.Port} mở (đang khởi tạo HTTP)");
            }

            return (ServiceStatus.Running, $"Cổng {service.Port} đang hoạt động");
        }

        return (ServiceStatus.Stopped, "Chưa xác định");
    }
}
