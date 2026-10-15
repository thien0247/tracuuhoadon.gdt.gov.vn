// @id 01M4V0HMQB3VNDDV8M4FBM1N7F
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace GDTTaxCrawlerManager
{
    public partial class MainForm : Form
    {
        private readonly string projectRootDir;
        private readonly bool startInTrayMode;
        private bool webViewInitialized = false;
        private Panel pnlHeader = null!;
        private Panel pnlMainContainer = null!;
        private StatusStrip statusStrip = null!;
        private ToolStripStatusLabel lblStatusStrip = null!;
        private ToolStripStatusLabel lblPortInfo = null!;
        private System.Windows.Forms.Timer pollTimer = null!;

        // Header controls
        private Label lblTitle = null!;
        private Label lblSub = null!;
        private Panel ledIndicator = null!;
        private Label lblServiceStatus = null!;
        private Button btnServices = null!;
        private Button btnStart = null!;
        private Button btnStop = null!;
        private Button btnRestart = null!;
        private Button btnMode = null!;
        private Button btnReloadWeb = null!;
        private Button btnDevTools = null!;
        private Button btnBrowser = null!;
        private Button btnTheme = null!;

        public MainForm(bool startInTray = false)
        {
            startInTrayMode = startInTray;
            var dir = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory);
            while (dir != null && !File.Exists(Path.Combine(dir.FullName, "service.bat")))
                dir = dir.Parent;
            projectRootDir = dir?.FullName ?? AppDomain.CurrentDomain.BaseDirectory;

            InitializeLayout();
            SetupWebViewControl();
            SetupTrayIntegration();

            if (startInTrayMode)
            {
                WindowState = FormWindowState.Minimized;
                ShowInTaskbar = false;
                Opacity = 0;
            }
        }

        protected override async void OnShown(EventArgs e)
        {
            base.OnShown(e);
            ApplyCurrentTheme();
            StartPollingTimer();

            if (startInTrayMode)
            {
                Hide();
                Opacity = 1;
                AppLogger.Info("Tray", "Khởi động ẩn trong System Tray (--tray).");
                return;
            }

            await EnsureWebViewReadyAsync();
        }

        private async Task EnsureWebViewReadyAsync()
        {
            if (webViewInitialized) return;
            webViewInitialized = true;
            await InitializeWebViewAsync();
        }

        private void InitializeLayout()
        {
            Text = "GDT Tax Crawler Control - Ant Design Dashboard (.NET 10)";
            Size = new Size(1280, 840);
            MinimumSize = new Size(960, 600);
            StartPosition = FormStartPosition.CenterScreen;

            pnlHeader = new Panel { Dock = DockStyle.Top, Height = 56, Padding = new Padding(12, 8, 12, 8) };
            lblTitle = new Label { Text = "GDT TAX CRAWLER", Font = new Font("Segoe UI", 11f, FontStyle.Bold), AutoSize = true, Location = new Point(12, 10) };
            lblSub = new Label { Text = "Next.js 14 • .NET 10 WebView2", Font = new Font("Segoe UI", 8.5f), AutoSize = true, Location = new Point(13, 31) };

            ledIndicator = new Panel { Size = new Size(10, 10), Location = new Point(220, 23), BackColor = Color.Gray };
            lblServiceStatus = new Label { Text = "Đang kiểm tra...", Font = new Font("Segoe UI", 9f, FontStyle.Bold), AutoSize = true, Location = new Point(236, 19) };

            btnServices = CreateToolbarButton("🛠️ Dịch Vụ", 825, 110, Color.FromArgb(14, 165, 233), OpenServicesTab);
            btnStart = CreateToolbarButton("▶ Bật", 705, 63, Color.FromArgb(16, 185, 129), async () => await OnStartServiceClicked());
            btnStop = CreateToolbarButton("⏹ Tắt", 635, 63, Color.FromArgb(239, 68, 68), async () => await OnStopServiceClicked());
            btnRestart = CreateToolbarButton("🔄 Restart", 565, 83, Color.FromArgb(99, 102, 241), async () => await OnRestartServiceClicked());
            btnMode = CreateToolbarButton("🌐 Trực Tiếp", 475, 115, Color.FromArgb(16, 185, 129), ToggleViewMode);
            btnReloadWeb = CreateToolbarButton("↻ Nạp Lại", 352, 83, Color.FromArgb(59, 130, 246), ReloadWebView);
            btnDevTools = CreateToolbarButton("🛠️ DevTools", 262, 90, Color.FromArgb(139, 92, 246), OpenDevTools);
            btnBrowser = CreateToolbarButton("🌐 Browser", 165, 88, Color.FromArgb(14, 165, 233), OpenExternalBrowser);
            btnTheme = CreateToolbarButton("☀️/🌙", 70, 60, Color.FromArgb(100, 116, 139), ToggleAppTheme);

            UpdateModeButtonText();

            pnlHeader.Controls.AddRange(new Control[] {
                lblTitle, lblSub, ledIndicator, lblServiceStatus,
                btnServices, btnStart, btnStop, btnRestart, btnMode, btnReloadWeb, btnDevTools, btnBrowser, btnTheme
            });

            pnlMainContainer = new Panel { Dock = DockStyle.Fill };

            statusStrip = new StatusStrip();
            lblStatusStrip = new ToolStripStatusLabel { Text = "Sẵn sàng", Spring = true, TextAlign = ContentAlignment.MiddleLeft };
            lblPortInfo = new ToolStripStatusLabel { Text = "Web: 8123 | Worker: 8124", Alignment = ToolStripItemAlignment.Right };
            statusStrip.Items.AddRange(new ToolStripItem[] { lblStatusStrip, lblPortInfo });

            Controls.Add(pnlMainContainer);
            Controls.Add(pnlHeader);
            Controls.Add(statusStrip);
        }

        private Button CreateToolbarButton(string text, int rightOffset, int width, Color color, Action onClick)
        {
            var btn = new Button
            {
                Text = text,
                Anchor = AnchorStyles.Top | AnchorStyles.Right,
                Size = new Size(width, 34),
                Location = new Point(ClientSize.Width - rightOffset, 11),
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                BackColor = color,
                ForeColor = Color.White,
                Cursor = Cursors.Hand
            };
            btn.FlatAppearance.BorderSize = 0;
            btn.Click += (s, e) => onClick();
            return btn;
        }

        public void UpdateModeButtonText()
        {
            if (btnMode == null) return;
            btnMode.Text = IsLocalMode ? "📁 Local (app.local)" : "🌐 Trực Tiếp (8123)";
            btnMode.BackColor = IsLocalMode ? Color.FromArgb(100, 116, 139) : Color.FromArgb(14, 165, 233);
        }

        private void OpenExternalBrowser()
        {
            try
            {
                AppLogger.Info("Browser", "Mở trình duyệt ngoài tới: http://127.0.0.1:8123/");
                Process.Start(new ProcessStartInfo("http://127.0.0.1:8123/") { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                AppLogger.Error("Browser", "Lỗi mở trình duyệt ngoài", ex);
                MessageBox.Show("Lỗi mở trình duyệt: " + ex.Message);
            }
        }

        private void ToggleAppTheme()
        {
            ThemeManager.ToggleTheme();
            ApplyCurrentTheme();
            AppLogger.Info("Theme", $"Đã chuyển giao diện sang: {ThemeManager.ModeName}");
        }

        private void ApplyCurrentTheme()
        {
            var t = ThemeManager.Current;
            BackColor = t.FormBg;
            pnlHeader.BackColor = t.HeaderBg;
            lblTitle.ForeColor = t.HeaderTitle;
            lblSub.ForeColor = t.HeaderSub;
            lblServiceStatus.ForeColor = t.HeaderTitle;
            statusStrip.BackColor = t.StatusStripBg;
            lblStatusStrip.ForeColor = t.TextPrimary;
            lblPortInfo.ForeColor = t.TextSecondary;
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == SingleInstanceHelper.WM_SHOWME)
            {
                AppLogger.Info("IPC", "Nhận tín hiệu WM_SHOWME từ instance khác. Khôi phục giao diện.");
                ShowAndRestore();
            }
            base.WndProc(ref m);
        }
    }
}
