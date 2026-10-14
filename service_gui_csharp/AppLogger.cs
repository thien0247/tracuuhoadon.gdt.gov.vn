// @id 01M4V0HMQAJ9H85W8KCM8Q4RFP
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;

namespace GDTTaxCrawlerManager
{
    public enum LogLevel { DEBUG, INFO, WARN, ERROR, FATAL }

    public static class AppLogger
    {
        private static readonly object syncLock = new object();
        private static string? logDir;
        public static event Action<string, LogLevel>? OnLogEmitted;

        public static void Initialize(string projectRootDir)
        {
            try
            {
                logDir = Path.Combine(projectRootDir, "logs");
                if (!Directory.Exists(logDir))
                    Directory.CreateDirectory(logDir);
            }
            catch { }
        }

        public static void Debug(string source, string message) => Log(LogLevel.DEBUG, source, message);
        public static void Info(string source, string message) => Log(LogLevel.INFO, source, message);
        public static void Warn(string source, string message) => Log(LogLevel.WARN, source, message);
        public static void Error(string source, string message, Exception? ex = null) => Log(LogLevel.ERROR, source, message, ex);
        public static void Fatal(string source, string message, Exception? ex = null) => Log(LogLevel.FATAL, source, message, ex);

        public static void Log(LogLevel level, string source, string message, Exception? ex = null)
        {
            try
            {
                var sb = new StringBuilder();
                sb.Append($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ");
                sb.Append($"[{level,-5}] ");
                sb.Append($"[T{Thread.CurrentThread.ManagedThreadId:D2}] ");
                sb.Append($"[{source}] ");
                sb.Append(message);

                if (ex != null)
                {
                    sb.AppendLine();
                    sb.Append($"  [Exception: {ex.GetType().Name}] {ex.Message}");
                    if (!string.IsNullOrEmpty(ex.StackTrace))
                        sb.Append($"\n  {ex.StackTrace.Trim()}");
                }

                string formattedLine = sb.ToString();

                lock (syncLock)
                {
                    if (string.IsNullOrEmpty(logDir))
                        logDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "logs");

                    if (!Directory.Exists(logDir))
                        Directory.CreateDirectory(logDir);

                    string filePath = Path.Combine(logDir, $"gui_{DateTime.Now:yyyyMMdd}.log");
                    
                    // Kiểm tra dung lượng > 10MB thì xoay vòng
                    if (File.Exists(filePath) && new FileInfo(filePath).Length > 10 * 1024 * 1024)
                    {
                        string backupPath = Path.Combine(logDir, $"gui_{DateTime.Now:yyyyMMdd}_{DateTime.Now:HHmmss}.log");
                        File.Move(filePath, backupPath);
                    }

                    File.AppendAllText(filePath, formattedLine + Environment.NewLine, Encoding.UTF8);
                }

                OnLogEmitted?.Invoke(formattedLine, level);
                Services.LogManager.Instance.Log(source, message, isError: level >= LogLevel.WARN);
            }
            catch { }
        }

        public static void OpenLogFolder()
        {
            try
            {
                if (!string.IsNullOrEmpty(logDir) && Directory.Exists(logDir))
                    Process.Start(new ProcessStartInfo("explorer.exe", logDir) { UseShellExecute = true });
            }
            catch { }
        }

        public static void OpenCurrentLogFile()
        {
            try
            {
                if (string.IsNullOrEmpty(logDir)) return;
                string filePath = Path.Combine(logDir, $"gui_{DateTime.Now:yyyyMMdd}.log");
                if (File.Exists(filePath))
                    Process.Start(new ProcessStartInfo(filePath) { UseShellExecute = true });
            }
            catch { }
        }
    }
}
