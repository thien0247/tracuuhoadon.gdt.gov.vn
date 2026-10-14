// @id 01M4V0HMQF6K64FPQE93ATGC0A
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
namespace GDTTaxCrawlerManager
{
    public partial class MainForm
    {
        private static readonly HttpClient httpClient = new(new SocketsHttpHandler { UseProxy = false, PooledConnectionLifetime = TimeSpan.FromMinutes(10), ConnectTimeout = TimeSpan.FromSeconds(5) }) { Timeout = TimeSpan.FromSeconds(30) };
        private static readonly HttpClient streamHttpClient = new(new SocketsHttpHandler { UseProxy = false, PooledConnectionLifetime = TimeSpan.FromHours(1) }) { Timeout = System.Threading.Timeout.InfiniteTimeSpan };
        private WebView2 webView = null!;
        private Services.WebViewBridge? webViewBridge;
        private bool isWebViewReady = false;
        public bool IsLocalMode { get; private set; } = false;
        private readonly TaskCompletionSource<bool> initTcs = new();
        public Task<bool> WaitForInitializationAsync() => initTcs.Task;
        private void SetupWebViewControl() { webView = new WebView2 { Dock = DockStyle.Fill, BackColor = ThemeManager.Current.FormBg }; pnlMainContainer.Controls.Add(webView); }
        private async Task InitializeWebViewAsync()
        {
            for (int r = 0; r < 3; r++)
            {
                try
                {
                    if (!this.IsHandleCreated) this.CreateControl();
                    if (!webView.IsHandleCreated) webView.CreateControl();

                    var cacheDir = Path.Combine(projectRootDir, "service_gui_csharp", "webview_cache");
                    Directory.CreateDirectory(cacheDir);

                    var options = new CoreWebView2EnvironmentOptions("--no-sandbox --disable-gpu --proxy-bypass-list=127.0.0.1,localhost,app.local");
                    var env = await CoreWebView2Environment.CreateAsync(null, cacheDir, options);
                    await webView.EnsureCoreWebView2Async(env);

                    isWebViewReady = true;
                    webViewBridge = new Services.WebViewBridge(projectRootDir);
                    webViewBridge.Attach(webView.CoreWebView2);
                    AppLogger.Info("WebView", "Đã gắn kết WebViewBridge 2 chiều (Native IPC).");

                    webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
                    webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                    webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;

                    var distPath = Path.GetFullPath(Path.Combine(projectRootDir, "frontend", "dist"));
                    if (Directory.Exists(distPath))
                        webView.CoreWebView2.SetVirtualHostNameToFolderMapping("app.local", distPath, CoreWebView2HostResourceAccessKind.Allow);

                    webView.CoreWebView2.AddWebResourceRequestedFilter("https://app.local/api/*", CoreWebView2WebResourceContext.All);
                    webView.CoreWebView2.AddWebResourceRequestedFilter("https://app.local/graphify-out/*", CoreWebView2WebResourceContext.All);
                    webView.CoreWebView2.WebResourceRequested += OnWebResourceRequested;
                    webView.CoreWebView2.ProcessFailed += OnWebViewProcessFailed;

                    webView.NavigationCompleted += (s, e) =>
                    {
                        string modeStr = IsLocalMode ? "Local Vue 3 (app.local)" : "Server (127.0.0.1:8123)";
                        lblStatusStrip.Text = e.IsSuccess ? $"Đã nạp {modeStr} ({DateTime.Now:HH:mm:ss})" : $"Lỗi nạp {modeStr}";
                        if (e.IsSuccess) AppLogger.Info("WebView", $"Nạp {modeStr} thành công.");
                        else AppLogger.Warn("WebView", $"Lỗi nạp {modeStr}: {e.WebErrorStatus}");
                        initTcs.TrySetResult(e.IsSuccess);
                    };
                    NavigateToDashboard();
                    return;
                }
                catch (Exception ex) when (r < 2)
                {
                    AppLogger.Warn("WebView", $"Khởi tạo WebView2 lần {r + 1} gặp lỗi ({ex.Message}), thử lại sau 600ms...");
                    await Task.Delay(600);
                }
                catch (Exception ex)
                {
                    lblStatusStrip.Text = $"Lỗi khởi tạo WebView2: {ex.Message}";
                    AppLogger.Error("WebView", "Khởi tạo WebView2 thất bại", ex);
                    initTcs.TrySetException(ex);
                }
            }
        }
        public void NavigateToDashboard()
        {
            if (!isWebViewReady || webView.CoreWebView2 == null) return;
            bool serverOnline = ServiceHelper.IsPortOpen(ServiceHelper.WEB_PORT, 250);
            if (!IsLocalMode)
            {
                if (serverOnline) webView.CoreWebView2.Navigate("http://127.0.0.1:8123/");
                else ShowOfflinePlaceholder();
            }
            else
            {
                var distIndex = Path.Combine(projectRootDir, "frontend", "dist", "index.html");
                webView.CoreWebView2.Navigate(File.Exists(distIndex) ? "https://app.local/index.html" : "http://127.0.0.1:8123/");
            }
        }
        public void ToggleViewMode()
        {
            IsLocalMode = !IsLocalMode;
            UpdateModeButtonText();
            AppLogger.Info("WebView", $"Đổi chế độ xem: {(IsLocalMode ? "Local Vue 3" : "Server 8123")}");
            NavigateToDashboard();
        }
        public void ShowOfflinePlaceholder()
        {
            if (!isWebViewReady || webView.CoreWebView2 == null) return;
            webView.CoreWebView2.NavigateToString("<html><body style=\"font-family:Segoe UI,sans-serif;background:#0f172a;color:#94a3b8;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;\"><h2 style=\"color:#f87171;\">⚠️ Máy Chủ Fastify (Port 8123) Chưa Khởi Động</h2><p>Dịch vụ nền GDTTaxCrawler đang tạm dừng. Vui lòng bấm '▶ Bật' trên thanh công cụ.</p></body></html>");
        }
        private async void OnWebResourceRequested(object? sender, CoreWebView2WebResourceRequestedEventArgs args)
        {
            var deferral = args.GetDeferral();
            try
            {
                if (args.Request.Method.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
                {
                    args.Response = webView.CoreWebView2.Environment.CreateWebResourceResponse(new MemoryStream(), 204, "No Content", "Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\nAccess-Control-Allow-Headers: *\r\n");
                    return;
                }

                var targetUri = args.Request.Uri.Replace("https://app.local/", "http://127.0.0.1:8123/").Replace("http://app.local/", "http://127.0.0.1:8123/");
                using var msg = new HttpRequestMessage(new HttpMethod(args.Request.Method), targetUri);
                if (args.Request.Content != null && (args.Request.Method == "POST" || args.Request.Method == "PUT"))
                {
                    msg.Content = new StreamContent(args.Request.Content);
                    if (args.Request.Headers.Contains("Content-Type"))
                        msg.Content.Headers.ContentType = System.Net.Http.Headers.MediaTypeHeaderValue.Parse(args.Request.Headers.GetHeader("Content-Type"));
                }

                bool isStream = targetUri.Contains("/api/stream");
                var client = isStream ? streamHttpClient : httpClient;
                var response = await client.SendAsync(msg, isStream ? HttpCompletionOption.ResponseHeadersRead : HttpCompletionOption.ResponseContentRead);

                Stream respStream;
                int contentLength = 0;
                if (!isStream)
                {
                    var bytes = await response.Content.ReadAsByteArrayAsync();
                    respStream = new MemoryStream(bytes);
                    contentLength = bytes.Length;
                }
                else respStream = await response.Content.ReadAsStreamAsync();

                var headerString = new StringBuilder();
                void AppendH(System.Collections.Generic.IEnumerable<System.Collections.Generic.KeyValuePair<string, System.Collections.Generic.IEnumerable<string>>> hdrs) {
                    foreach (var h in hdrs) {
                        if (h.Key.StartsWith("Access-Control-", StringComparison.OrdinalIgnoreCase) || h.Key.Equals("Connection", StringComparison.OrdinalIgnoreCase) || h.Key.Equals("Keep-Alive", StringComparison.OrdinalIgnoreCase) || h.Key.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase) || h.Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase)) continue;
                        headerString.Append($"{h.Key}: {string.Join(", ", h.Value)}\r\n");
                    }
                }
                AppendH(response.Headers); AppendH(response.Content.Headers);
                if (!isStream) headerString.Append($"Content-Length: {contentLength}\r\n");
                headerString.Append("Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\nAccess-Control-Allow-Headers: *\r\n");
                args.Response = webView.CoreWebView2.Environment.CreateWebResourceResponse(respStream, (int)response.StatusCode, response.ReasonPhrase ?? "OK", headerString.ToString());
            }
            catch (Exception ex)
            {
                AppLogger.Warn("Proxy", $"Lỗi chuyển tiếp API {args.Request.Uri}: {ex.Message}");
                var errBytes = Encoding.UTF8.GetBytes($"{{\"error\":\"{ex.Message}\",\"offline\":true}}");
                args.Response = webView.CoreWebView2.Environment.CreateWebResourceResponse(new MemoryStream(errBytes), 503, "Service Unavailable", "Content-Type: application/json; charset=utf-8\r\nAccess-Control-Allow-Origin: *\r\n");
            }
            finally { deferral.Complete(); }
        }
        private void OnWebViewProcessFailed(object? sender, CoreWebView2ProcessFailedEventArgs e)
        {
            AppLogger.Warn("WebView", $"Tiến trình WebView2 lỗi ({e.ProcessFailedKind}). Đang tự phục hồi...");
            BeginInvoke(new Action(() => { try { webView.Reload(); } catch { } }));
        }
        private void ReloadWebView() { AppLogger.Info("WebView", "Người dùng bấm Nạp Lại."); if (isWebViewReady && webView.CoreWebView2 != null) webView.Reload(); }
        private void OpenDevTools() { AppLogger.Info("WebView", "Người dùng mở DevTools."); if (isWebViewReady && webView.CoreWebView2 != null) webView.CoreWebView2.OpenDevToolsWindow(); }
        public void OpenServicesTab()
        {
            if (!isWebViewReady || webView.CoreWebView2 == null) return;
            webView.CoreWebView2.PostWebMessageAsString("switch-tab:services");
            webView.ExecuteScriptAsync("window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'services' }))");
        }
    }
}
