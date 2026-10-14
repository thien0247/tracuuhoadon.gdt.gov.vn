// @id 01M4V0HMQQ83ZT1TE4WM0ZT476
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Web.WebView2.Core;
using GDTTaxCrawlerManager.Models;

namespace GDTTaxCrawlerManager.Services;

public class WebViewBridge
{
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromMilliseconds(950) };
    private readonly string _projectRoot;
    private readonly List<ServiceInfo> _services;
    private CoreWebView2? _webView;

    public WebViewBridge(string projectRoot)
    {
        _projectRoot = projectRoot;
        _services =
        [
            new ServiceInfo { Id = "gdt_windows_service", Name = "Windows Service GDTTaxCrawler", Description = "Dịch vụ nền Windows Service (NSSM Host)" },
            new ServiceInfo { Id = "fastify_web", Name = "Fastify Web API Gateway", Description = "Máy chủ Web Dashboard & REST API TypeScript Fastify (Port 8123)", Port = 8123, CheckUrl = "http://127.0.0.1:8123/api/system/health" },
            new ServiceInfo { Id = "python_worker", Name = "Python AI Worker & CAPTCHA", Description = "Tiến trình giải AI CAPTCHA & Scraper curl_cffi (Port 8124)", Port = 8124, CheckUrl = "http://127.0.0.1:8124/health" },
            new ServiceInfo { Id = "postgresql_db", Name = "Cơ Sở Dữ Liệu PostgreSQL", Description = "PostgreSQL 16 lưu trữ 1.1M+ bản ghi NNT (Port 5433)", Port = 5433, IsOptional = true },
            new ServiceInfo { Id = "crawler_scheduler", Name = "Lập Lịch Quét Tự Động (Scheduler)", Description = "Tự động Quét Đỉnh (mỗi 6h) & Fill Lỗ Hổng 500 (mỗi 12h)", IsOptional = true }
        ];
        LogManager.Instance.LogReceived += (_, e) => BroadcastLog(e.Tag, e.Message, e.IsError);
    }

    public void Attach(CoreWebView2 webView)
    {
        _webView = webView;
        _webView.WebMessageReceived += OnWebMessageReceived;
    }

    private async void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            string raw = e.TryGetWebMessageAsString();
            if (string.IsNullOrWhiteSpace(raw)) raw = e.WebMessageAsJson;
            if (string.IsNullOrWhiteSpace(raw)) return;

            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;
            string act = root.TryGetProperty("action", out var a) ? a.GetString() ?? "" : "";
            string sId = root.TryGetProperty("serviceId", out var s) ? s.GetString() ?? "" : "";
            string url = root.TryGetProperty("url", out var u) ? u.GetString() ?? "" : "";

            switch (act.ToUpperInvariant())
            {
                case "INIT":
                case "GET_LOGS":
                    BroadcastHistoryLogs();
                    await BroadcastStatusAsync();
                    break;
                case "GET_STATUS":
                    await BroadcastStatusAsync();
                    break;
                case "START_SERVICE":
                case "START_ALL":
                    LogManager.Instance.Log("SYSTEM", $"Yêu cầu khởi chạy service ({sId})...");
                    await ServiceHelper.RunServiceBatAsync("start", _projectRoot);
                    await Task.Delay(1500);
                    await BroadcastStatusAsync();
                    break;
                case "STOP_SERVICE":
                case "STOP_ALL":
                    LogManager.Instance.Log("SYSTEM", $"Yêu cầu dừng service ({sId})...");
                    await ServiceHelper.RunServiceBatAsync("stop", _projectRoot);
                    await Task.Delay(1000);
                    await BroadcastStatusAsync();
                    break;
                case "RESTART_SERVICE":
                    LogManager.Instance.Log("SYSTEM", $"Khởi động lại service ({sId})...");
                    await ServiceHelper.RunServiceBatAsync("restart", _projectRoot);
                    await Task.Delay(2500);
                    await BroadcastStatusAsync();
                    NotifyServiceReloaded(sId);
                    break;
                case "CLEAR_LOGS":
                    LogManager.Instance.Clear();
                    break;
                case "RELOAD_PAGE":
                    _webView?.Reload();
                    break;
                case "OPEN_URL":
                    if (!string.IsNullOrEmpty(url)) Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
                    break;
            }
        }
        catch (Exception ex)
        {
            LogManager.Instance.Log("BRIDGE", $"Lỗi xử lý WebMessage: {ex.Message}", isError: true);
        }
    }

    public async Task BroadcastStatusAsync()
    {
        if (_webView == null) return;
        var winState = ServiceHelper.GetStatus();
        int? winPid = ServiceHelper.GetServicePid();

        if (await HealthChecker.IsPortListeningAsync("127.0.0.1", 8123, 300))
        {
            try
            {
                var rawJson = await _httpClient.GetStringAsync("http://127.0.0.1:8123/api/services/status");
                using var doc = JsonDocument.Parse(rawJson);
                if (doc.RootElement.TryGetProperty("services", out var sArr) && sArr.ValueKind == JsonValueKind.Array)
                {
                    var list = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(sArr.GetRawText());
                    var win = list?.FirstOrDefault(x => x.TryGetValue("id", out var id) && id?.ToString() == "gdt_windows_service");
                    if (win != null)
                    {
                        win["status"] = winState == ServiceState.Running ? "running" : "stopped";
                        win["statusText"] = winState == ServiceState.Running ? $"Đang chạy (PID {winPid ?? 0})" : "Đã dừng";
                        win["pid"] = winPid ?? 0;
                    }
                    _webView.PostWebMessageAsJson(JsonSerializer.Serialize(new { type = "STATUS_UPDATE", services = list }));
                    return;
                }
            }
            catch { }
        }

        var items = new List<object>();
        foreach (var svc in _services)
        {
            if (svc.Id == "gdt_windows_service")
            {
                svc.Status = winState == ServiceState.Running ? ServiceStatus.Running : ServiceStatus.Stopped;
                svc.ProcessId = winPid;
                svc.StatusMessage = winState.ToString();
            }
            else
            {
                var (st, msg) = await HealthChecker.CheckServiceAsync(svc);
                svc.Status = st;
                svc.StatusMessage = msg;
            }

            string statusStr = svc.Status switch { ServiceStatus.Running => "running", ServiceStatus.Starting => "starting", _ => "stopped" };
            items.Add(new { id = svc.Id, name = svc.Name, description = svc.Description, port = svc.Port, status = statusStr, pid = svc.ProcessId, url = svc.CheckUrl, isOptional = svc.IsOptional });
        }
        try { _webView.PostWebMessageAsJson(JsonSerializer.Serialize(new { type = "STATUS_UPDATE", services = items })); } catch { }
    }

    public void BroadcastHistoryLogs()
    {
        if (_webView == null) return;
        var logs = LogManager.Instance.GetRecentEvents(120).Select(e => new
        {
            id = Guid.NewGuid().ToString("N")[..8],
            timestamp = e.Timestamp.ToString("HH:mm:ss"),
            service = e.Tag,
            message = e.Message,
            level = e.IsError ? "error" : "info"
        }).ToList();

        string json = JsonSerializer.Serialize(new { type = "LOG_HISTORY", logs });
        try { _webView.PostWebMessageAsJson(json); } catch { }
    }

    public void BroadcastLog(string service, string message, bool isError)
    {
        if (_webView == null) return;
        var payload = new
        {
            type = "LOG",
            log = new { id = Guid.NewGuid().ToString("N")[..8], timestamp = DateTime.Now.ToString("HH:mm:ss"), service, message, level = isError ? "error" : "info" }
        };
        try { _webView.PostWebMessageAsJson(JsonSerializer.Serialize(payload)); } catch { }
    }

    public void NotifyServiceReloaded(string serviceId)
    {
        if (_webView == null) return;
        try
        {
            string json = JsonSerializer.Serialize(new { type = "SERVICE_RELOADED", serviceId });
            _webView.PostWebMessageAsJson(json);
            _webView.ExecuteScriptAsync($"window.dispatchEvent(new CustomEvent('service-reloaded', {{ detail: {{ serviceId: '{serviceId}' }} }}));");
        }
        catch { }
    }
}
