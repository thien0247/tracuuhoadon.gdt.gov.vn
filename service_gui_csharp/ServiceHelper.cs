// @id 01M4V0HMQHZDQ6GK30H9JBAF90
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.ServiceProcess;
using System.Threading.Tasks;

namespace GDTTaxCrawlerManager
{
    public enum ServiceState
    {
        Running,
        Stopped,
        StartPending,
        StopPending,
        NotFound,
        Unknown
    }

    public static class ServiceHelper
    {
        public const string SERVICE_NAME = "GDTTaxCrawler";
        public const int WEB_PORT = 8123;
        public const int WORKER_PORT = 8124;

        public static ServiceState GetStatus()
        {
            try
            {
                using var sc = new ServiceController(SERVICE_NAME);
                return sc.Status switch
                {
                    ServiceControllerStatus.Running => ServiceState.Running,
                    ServiceControllerStatus.Stopped => ServiceState.Stopped,
                    ServiceControllerStatus.StartPending => ServiceState.StartPending,
                    ServiceControllerStatus.StopPending => ServiceState.StopPending,
                    _ => ServiceState.Unknown
                };
            }
            catch
            {
                return ServiceState.NotFound;
            }
        }

        public static bool IsPortOpen(int port, int timeoutMs = 350)
        {
            try
            {
                using var client = new TcpClient();
                var result = client.BeginConnect("127.0.0.1", port, null, null);
                var success = result.AsyncWaitHandle.WaitOne(timeoutMs);
                if (!success) return false;
                client.EndConnect(result);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public static async Task<string> RunServiceBatAsync(string command, string projectRoot)
        {
            return await Task.Run(() =>
            {
                try
                {
                    var batPath = Path.Combine(projectRoot, "service.bat");
                    if (!File.Exists(batPath)) return "Không tìm thấy service.bat!";

                    var psi = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = $"/c \"{batPath}\" {command}",
                        WorkingDirectory = projectRoot,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    };

                    using var proc = Process.Start(psi);
                    if (proc == null) return "Lỗi khởi chạy tiến trình cmd!";
                    var output = proc.StandardOutput.ReadToEnd();
                    proc.WaitForExit(10000);
                    return output;
                }
                catch (Exception ex)
                {
                    return $"Lỗi: {ex.Message}";
                }
            });
        }

        public static int? GetServicePid()
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = $"queryex {SERVICE_NAME}",
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true
                };
                using var proc = Process.Start(psi);
                if (proc == null) return null;
                var outText = proc.StandardOutput.ReadToEnd();
                proc.WaitForExit(3000);

                foreach (var line in outText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    if (line.Trim().StartsWith("PID", StringComparison.OrdinalIgnoreCase))
                    {
                        var parts = line.Split(':');
                        if (parts.Length > 1 && int.TryParse(parts[1].Trim(), out var pid) && pid > 0)
                            return pid;
                    }
                }
            }
            catch { }
            return null;
        }
    }
}
