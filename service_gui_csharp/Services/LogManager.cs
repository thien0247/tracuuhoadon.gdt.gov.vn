// @id 01M4V0HMQPHB38ARVEXSTMPDD9
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace GDTTaxCrawlerManager.Services;

public class LogEventArgs : EventArgs
{
    public DateTime Timestamp { get; } = DateTime.Now;
    public string Tag { get; }
    public string Message { get; }
    public bool IsError { get; }

    public LogEventArgs(string tag, string message, bool isError)
    {
        Tag = tag;
        Message = message;
        IsError = isError;
    }
}

public class LogManager
{
    private static readonly Lazy<LogManager> _instance = new(() => new LogManager());
    public static LogManager Instance => _instance.Value;

    public event EventHandler<LogEventArgs>? LogReceived;
    private readonly StringBuilder _history = new();
    private readonly List<LogEventArgs> _recentEvents = [];
    private readonly object _lock = new();

    private LogManager() { }

    public void Log(string tag, string message, bool isError = false)
    {
        var args = new LogEventArgs(tag, message, isError);
        lock (_lock)
        {
            _history.AppendLine($"[{args.Timestamp:HH:mm:ss}] [{tag}] {message}");
            _recentEvents.Add(args);
            if (_recentEvents.Count > 500) _recentEvents.RemoveAt(0);
        }
        LogReceived?.Invoke(this, args);
    }

    public List<LogEventArgs> GetRecentEvents(int max = 150)
    {
        lock (_lock)
        {
            return _recentEvents.TakeLast(max).ToList();
        }
    }

    public void Clear()
    {
        lock (_lock)
        {
            _history.Clear();
            _recentEvents.Clear();
        }
    }
}
