// @id 01M4V0HMQGDB16NT9P2FKVF63X
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace GDTTaxCrawlerManager
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            Environment.SetEnvironmentVariable("NO_PROXY", "127.0.0.1,localhost,app.local");
            Environment.SetEnvironmentVariable("no_proxy", "127.0.0.1,localhost,app.local");

            var baseDir = AppDomain.CurrentDomain.BaseDirectory;
            var dir = new DirectoryInfo(baseDir);
            while (dir != null && !File.Exists(Path.Combine(dir.FullName, "service.bat")))
                dir = dir.Parent;
            string rootDir = dir?.FullName ?? baseDir;

            AppLogger.Initialize(rootDir);
            AppLogger.Info("Bootstrap", $"Khởi động GDTTaxCrawlerManager .NET 10 (PID: {Environment.ProcessId})");

            AppDomain.CurrentDomain.UnhandledException += (s, e) =>
            {
                if (e.ExceptionObject is Exception ex)
                    AppLogger.Fatal("AppDomain", "Unhandled domain exception", ex);
                else
                    AppLogger.Fatal("AppDomain", $"Unhandled domain object: {e.ExceptionObject}");
            };

            Application.ThreadException += (s, e) =>
            {
                AppLogger.Error("WinFormsThread", "Unhandled thread exception", e.Exception);
            };

            string? snapshotPath = null;
            bool startInTray = args != null && args.Any(a =>
                a.Equals("--tray", StringComparison.OrdinalIgnoreCase) ||
                a.Equals("--minimized", StringComparison.OrdinalIgnoreCase) ||
                a.Equals("-minimized", StringComparison.OrdinalIgnoreCase));

            if (args != null)
            {
                for (int i = 0; i < args.Length; i++)
                {
                    if (args[i] == "--snapshot" && i + 1 < args.Length)
                        snapshotPath = args[i + 1];
                }
            }

            // Single-Instance Check
            const string mutexName = @"Local\GDTTaxCrawlerManager_SingleInstance_Mutex";
            using var mutex = new System.Threading.Mutex(true, mutexName, out bool isOnlyInstance);
            if (!isOnlyInstance && string.IsNullOrEmpty(snapshotPath))
            {
                AppLogger.Warn("Bootstrap", $"Phát hiện một instance khác đang chạy. Kích hoạt cửa sổ và thoát PID {Environment.ProcessId}.");
                if (!startInTray)
                    SingleInstanceHelper.BroadcastShowExistingInstance();
                return;
            }

            // Đảm bảo tự động đăng ký chạy cùng Windows ở System Tray nếu chưa đăng ký
            if (!ServiceHelper.IsStartupRegistered())
                ServiceHelper.SetStartupRegistration(true);

            ApplicationConfiguration.Initialize();
            var form = new MainForm(startInTray);

            if (!string.IsNullOrEmpty(snapshotPath))
            {
                AppLogger.Info("CLI", $"Yêu cầu chụp snapshot tới: {snapshotPath}");
                form.Shown += async (s, e) =>
                {
                    try
                    {
                        await form.WaitForInitializationAsync();
                        await Task.Delay(2500);
                        await form.CaptureWindowSnapshotAsync(snapshotPath);
                    }
                    catch (Exception ex)
                    {
                        AppLogger.Error("Snapshot", "Lỗi thực thi chụp ảnh", ex);
                    }
                    finally
                    {
                        Application.Exit();
                    }
                };
            }

            try
            {
                Application.Run(form);
            }
            finally
            {
                AppLogger.Info("Bootstrap", "Đã đóng ứng dụng.");
            }
        }
    }
}
