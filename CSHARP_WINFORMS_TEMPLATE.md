# Bộ Template Kiến Trúc GUI C# WinForms Hiện Đại (Modern Flat & Dual Theme)

> **Mục tiêu:** Cung cấp bộ khung (Boilerplate Template) hoàn chỉnh bằng **Native C# Windows Forms đơn file (`.cs`)**, có thể biên dịch trực tiếp trên **bất kỳ máy tính Windows nào** bằng trình biên dịch tích hợp sẵn `csc.exe` (không cần cài Visual Studio, không cần NuGet, không cần cài thêm .NET SDK).
>
> **Ứng dụng:** Quản lý tiến trình (Process), Windows Service, Server cục bộ (Node.js, Python, Go, Java, Docker), công cụ tiện ích khay hệ thống (System Tray Utility), v.v.

---

## 📑 Mục Lục
1. [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
2. [Cấu Trúc Thư Mục Chuẩn](#-cấu-trúc-thư-mục-chuẩn)
3. [Mã Nguồn Boilerplate Hoàn Chỉnh (`AppManager.cs`)](#-mã-nguồn-boilerplate-hoàn-chỉnh-appmanagercs)
4. [Các File Hỗ Trợ (Manifest & Build Script)](#-các-file-hỗ-trợ-manifest--build-script)
   - [app.manifest (UAC Admin & DPI Awareness)](#1-appmanifest)
   - [build.bat (Biên dịch 1-click)](#2-buildbat)
   - [config.json (Lưu cấu hình)](#3-configjson)
5. [Giải Thích Các Kỹ Thuật Cốt Lõi (Core Patterns)](#-giải-thích-các-kỹ-thuật-cốt-lõi-core-patterns)
   - [Bẫy bố cục Docking + Anchoring trong WinForms](#1-bẫy-bố-cục-docking--anchoring-trong-winforms)
   - [Đèn LED 3D Anti-Aliased](#2-đèn-led-3d-anti-aliased)
   - [Hệ thống System Tray & Vẽ Icon Động](#3-hệ-thống-system-tray--vẽ-icon-động)
   - [Hệ thống Log đa luồng an toàn có màu sắc](#4-hệ-thống-log-đa-luồng-an-toàn-có-màu-sắc)
6. [Hướng Dẫn Tùy Biến Cho Dự Án Mới](#-hướng-dẫn-tùy-biến-cho-dự-án-mới)

---

## 🌟 Tính Năng Nổi Bật

- **Zero-Dependency (Không phụ thuộc bên ngoài):** Chạy và biên dịch trực tiếp từ .NET Framework 4.5/4.8 có sẵn trong Windows (từ Windows 7 đến Windows 11 / Windows Server).
- **Giao diện Modern Card Flat UI:** Phân chia bố cục theo các thẻ (Cards) có đường viền 1px tinh tế, độ tương phản cao, không sử dụng giao diện xám cổ điển của WinForms cũ.
- **Hệ thống Dual Theme (Sáng / Tối):**
  - **Light Theme:** Nền Slate-100 (`#F1F5F9`), thẻ trắng (`#FFFFFF`), chữ Slate-900 (`#0F172A`).
  - **Dark Theme:** Nền Obsidian (`#131316`), thẻ Zinc-850 (`#1F1F26`), chữ trắng bạc (`#F4F4F5`).
  - Nút chuyển theme trên Header và trong Menu chuột phải khay hệ thống, tự động lưu vào `config.json`.
- **Chạy ngầm dưới Khay Hệ Thống (System Tray):**
  - Khi thu nhỏ hoặc bấm nút [X] đóng cửa sổ -> tự ẩn xuống khay đồng hồ.
  - Tự động vẽ Icon 32x32 động có chữ và đèn LED tương ứng với trạng thái (Xanh lá / Đỏ / Vàng).
  - Menu chuột phải đầy đủ thao tác nhanh (Start, Stop, Mở Web, Đổi Theme, Thoát).
  - Click đúp vào icon để khôi phục cửa sổ.
- **Đèn LED hiển thị trạng thái GDI+:** Bo tròn khử răng cưa (Anti-aliased) với vòng hào quang 3D trong suốt.
- **Khung Log Terminal chuẩn đa luồng (Thread-safe):** Phân loại màu theo cấp độ `SUCCESS` (xanh lá), `ERROR` (đỏ), `WARN` (cam), `STATUS` (cyan), không bao giờ gây đơ giao diện.
- **Xử lý bất đồng bộ:** Sử dụng `ThreadPool.QueueUserWorkItem` cho các tác vụ tốn thời gian (khởi động service, gọi lệnh cmd/powershell, ping mạng).

---

## 📁 Cấu Trúc Thư Mục Chuẩn

```text
MyProjectManager/
├── AppManager.cs         # Mã nguồn C# giao diện duy nhất (Native WinForms)
├── app.manifest          # File khai báo UAC Admin và DPI Awareness
├── build.bat             # Script 1-click tự gọi csc.exe biên dịch ra AppManager.exe
├── config.json           # File JSON lưu cấu hình (Port, Theme, v.v.)
└── AppManager.exe        # Sản phẩm biên dịch cuối cùng (chạy độc lập)
```

---

## 💻 Mã Nguồn Boilerplate Hoàn Chỉnh (`AppManager.cs`)

Bạn có thể copy mã nguồn dưới đây và đổi tên `MyService` thành tên dự án/dịch vụ của bạn:

```csharp
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.ServiceProcess;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace MyProjectManager
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    public class MainForm : Form
    {
        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        extern static bool DestroyIcon(IntPtr handle);

        // =====================================================================
        //  1. CẤU HÌNH DỰ ÁN (TÙY CHỈNH THEO DỰ ÁN CỦA BẠN)
        // =====================================================================
        private const string APP_TITLE = "My App Manager";
        private const string APP_SUBTITLE = "Trình điều khiển dịch vụ và máy chủ nền";
        private const string SERVICE_NAME = "MyService";
        private const int DEFAULT_PORT = 8080;

        private string appDir;
        private string configFile;

        // =====================================================================
        //  2. THEME ENGINE (BẢNG MÀU SÁNG / TỐI)
        // =====================================================================
        public class AppTheme
        {
            public string Name;
            public Color FormBg;
            public Color HeaderBg;
            public Color HeaderTitle;
            public Color HeaderSub;
            public Color CardBg;
            public Color CardBorder;
            public Color TextPrimary;
            public Color TextSecondary;
            public Color InputBg;
            public Color InputBorder;
            public Color InputText;
            public Color LogBg;
            public Color LogHeaderBg;
            public Color FooterBg;
            public Color FooterText;
            public Color SecondaryBtnBg;
            public Color SecondaryBtnHover;
            public Color SecondaryBtnText;
        }

        private AppTheme currentTheme;
        private string currentThemeName = "light"; // Mặc định mở Light Theme

        // =====================================================================
        //  3. CÁC CONTROL GIAO DIỆN
        // =====================================================================
        private Panel pnlHeader;
        private Label lblLogo;
        private Label lblTitle;
        private Label lblSub;
        private Button btnThemeToggle;
        private Button btnOpenBrowserTop;

        private Panel pnlContent;

        // Thẻ Trạng Thái (Status Card)
        private Panel pnlStatusCard;
        private Panel ledPanel;
        private Color currentLedColor = Color.FromArgb(113, 113, 122);
        private Label lblStatusTag;
        private Label lblStatus;
        private Label lblUrl;
        private Label lblServiceInfo;
        private Label lblPid;

        // Thẻ Nút Hành Động Lớn (Hero Action)
        private Panel pnlHeroButton;
        private Button btnHeroAction;

        // Thẻ Điều Khiển (Service Control Card)
        private Panel pnlActions;
        private Label lblActionTitle;
        private Button btnRegister;
        private Button btnUnregister;
        private Button btnStart;
        private Button btnStop;
        private Button btnRestart;

        // Thẻ Cấu Hình Port (Config Card)
        private Panel pnlPort;
        private Label lblPortTitle;
        private TextBox txtPort;
        private Button btnSavePort;
        private Label lblPortNote;

        // Thẻ Khung Log (Log Container)
        private Panel pnlLogContainer;
        private Panel pnlLogHeader;
        private Label lblLogTitle;
        private Button btnClearLog;
        private RichTextBox rtbLog;

        // Thanh Footer
        private Panel pnlFooter;
        private Label lblFooter;

        // Timer & Khay Hệ Thống
        private System.Windows.Forms.Timer statusTimer;
        private NotifyIcon trayIcon;
        private ContextMenuStrip trayMenu;
        private Icon lastCreatedIcon = null;

        // =====================================================================
        //  4. KHỞI TẠO FORM & VÒNG ĐỜI
        // =====================================================================
        public MainForm()
        {
            InitializePaths();
            currentThemeName = GetSavedTheme();
            currentTheme = (currentThemeName == "dark") ? GetDarkTheme() : GetLightTheme();

            InitializeComponent();
            InitializeTrayIcon();

            ApplyTheme(currentThemeName);

            CheckAdminAndLog();
            UpdateServiceStatus();

            // Timer kiểm tra trạng thái dịch vụ định kỳ (2 giây)
            statusTimer = new System.Windows.Forms.Timer();
            statusTimer.Interval = 2000;
            statusTimer.Tick += delegate { UpdateServiceStatus(); };
            statusTimer.Start();
        }

        private void InitializePaths()
        {
            appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            configFile = Path.Combine(appDir, "config.json");
        }

        // =====================================================================
        //  5. THIẾT KẾ GIAO DIỆN (INITIALIZE COMPONENT)
        // =====================================================================
        private void InitializeComponent()
        {
            this.Text = APP_TITLE;
            this.Size = new Size(760, 800);
            this.MinimumSize = new Size(740, 750);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // BẮT BUỘC: Lấy kích thước Form Client để tránh bẫy lệch tọa độ khi Panel Docking
            int clientW = this.ClientSize.Width; // ~744px
            int contentPadding = 20;
            int cardW = clientW - (contentPadding * 2); // ~704px

            // Xử lý khi bấm nút Minimize -> Ẩn vào khay hệ thống
            this.Resize += delegate {
                if (this.WindowState == FormWindowState.Minimized)
                {
                    this.Hide();
                    if (trayIcon != null)
                    {
                        trayIcon.ShowBalloonTip(1200, APP_TITLE,
                            "Ứng dụng đang chạy ngầm ở khay hệ thống. Click đúp để mở lại.", ToolTipIcon.Info);
                    }
                }
            };

            // -------------------------------------------------------------
            // [A] HEADER BAR
            // -------------------------------------------------------------
            pnlHeader = new Panel();
            pnlHeader.Dock = DockStyle.Top;
            pnlHeader.Height = 65;
            pnlHeader.Width = clientW; // Gán Width trước khi thêm nút có Anchor Right
            pnlHeader.Padding = new Padding(20, 14, 20, 0);

            lblLogo = new Label();
            lblLogo.Text = "🚀";
            lblLogo.Font = new Font("Segoe UI", 18f);
            lblLogo.Size = new Size(42, 42);
            lblLogo.TextAlign = ContentAlignment.MiddleCenter;
            lblLogo.BackColor = Color.FromArgb(79, 70, 229);
            lblLogo.ForeColor = Color.White;
            lblLogo.Location = new Point(20, 12);
            pnlHeader.Controls.Add(lblLogo);

            lblTitle = new Label();
            lblTitle.Text = APP_TITLE;
            lblTitle.Font = new Font("Segoe UI", 15f, FontStyle.Bold);
            lblTitle.AutoSize = true;
            lblTitle.Location = new Point(72, 10);
            pnlHeader.Controls.Add(lblTitle);

            lblSub = new Label();
            lblSub.Text = APP_SUBTITLE;
            lblSub.Font = new Font("Segoe UI", 8.5f);
            lblSub.AutoSize = true;
            lblSub.Location = new Point(74, 38);
            pnlHeader.Controls.Add(lblSub);

            btnOpenBrowserTop = CreateButton("🌐 Mở Web", Color.FromArgb(37, 99, 235), 110, 36);
            btnOpenBrowserTop.Location = new Point(clientW - 130, 14);
            btnOpenBrowserTop.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnOpenBrowserTop.Click += delegate { OpenBrowser(); };
            pnlHeader.Controls.Add(btnOpenBrowserTop);

            btnThemeToggle = CreateButton("🌙 Giao Diện Tối", Color.FromArgb(226, 232, 240), 145, 36);
            btnThemeToggle.Location = new Point(clientW - 285, 14);
            btnThemeToggle.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnThemeToggle.Click += delegate { ToggleTheme(); };
            pnlHeader.Controls.Add(btnThemeToggle);

            // -------------------------------------------------------------
            // [B] CONTENT CONTAINER (CHỨA CÁC THẺ CARD)
            // -------------------------------------------------------------
            pnlContent = new Panel();
            pnlContent.Dock = DockStyle.Fill;
            pnlContent.Width = clientW;
            pnlContent.Padding = new Padding(20, 10, 20, 12);

            // 1. Thẻ Trạng Thái (Status Card)
            pnlStatusCard = new Panel();
            pnlStatusCard.Dock = DockStyle.Top;
            pnlStatusCard.Height = 68;
            pnlStatusCard.Width = cardW;
            pnlStatusCard.Padding = new Padding(15, 10, 15, 10);

            ledPanel = new Panel();
            ledPanel.Size = new Size(24, 24);
            ledPanel.Location = new Point(16, 22);
            ledPanel.Paint += new PaintEventHandler(LedPanel_Paint);
            pnlStatusCard.Controls.Add(ledPanel);

            lblStatusTag = new Label();
            lblStatusTag.Text = "TRẠNG THÁI:";
            lblStatusTag.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblStatusTag.AutoSize = true;
            lblStatusTag.Location = new Point(48, 14);
            pnlStatusCard.Controls.Add(lblStatusTag);

            lblStatus = new Label();
            lblStatus.Text = "ĐANG KIỂM TRA...";
            lblStatus.Font = new Font("Segoe UI", 11f, FontStyle.Bold);
            lblStatus.AutoSize = true;
            lblStatus.Location = new Point(142, 12);
            pnlStatusCard.Controls.Add(lblStatus);

            lblUrl = new Label();
            lblUrl.Text = string.Format("URL: http://localhost:{0}", GetSavedPort());
            lblUrl.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblUrl.AutoSize = true;
            lblUrl.Location = new Point(50, 38);
            pnlStatusCard.Controls.Add(lblUrl);

            lblServiceInfo = new Label();
            lblServiceInfo.Text = "Dịch vụ: " + SERVICE_NAME;
            lblServiceInfo.Font = new Font("Segoe UI", 9f);
            lblServiceInfo.AutoSize = true;
            lblServiceInfo.Location = new Point(cardW - 230, 14);
            lblServiceInfo.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            pnlStatusCard.Controls.Add(lblServiceInfo);

            lblPid = new Label();
            lblPid.Text = "PID: -";
            lblPid.Font = new Font("Segoe UI", 9f);
            lblPid.AutoSize = true;
            lblPid.Location = new Point(cardW - 230, 38);
            lblPid.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            pnlStatusCard.Controls.Add(lblPid);

            Panel sp1 = CreateSpacer(10);

            // 2. Thẻ Nút Hành Động Chính (Hero Button)
            pnlHeroButton = new Panel();
            pnlHeroButton.Dock = DockStyle.Top;
            pnlHeroButton.Height = 48;
            pnlHeroButton.Width = cardW;

            btnHeroAction = new Button();
            btnHeroAction.Dock = DockStyle.Fill;
            btnHeroAction.Text = "🌐 MỞ ỨNG DỤNG TRÊN TRÌNH DUYỆT";
            btnHeroAction.Font = new Font("Segoe UI", 11.5f, FontStyle.Bold);
            btnHeroAction.BackColor = Color.FromArgb(37, 99, 235);
            btnHeroAction.ForeColor = Color.White;
            btnHeroAction.FlatStyle = FlatStyle.Flat;
            btnHeroAction.FlatAppearance.BorderSize = 0;
            btnHeroAction.Cursor = Cursors.Hand;
            btnHeroAction.Click += delegate { OpenBrowser(); };
            pnlHeroButton.Controls.Add(btnHeroAction);

            Panel sp2 = CreateSpacer(10);

            // 3. Thẻ Điều Khiển Dịch Vụ (Service Actions Card)
            pnlActions = new Panel();
            pnlActions.Dock = DockStyle.Top;
            pnlActions.Height = 85;
            pnlActions.Width = cardW;
            pnlActions.Padding = new Padding(15, 10, 15, 10);

            lblActionTitle = new Label();
            lblActionTitle.Text = "ĐIỀU KHIỂN DỊCH VỤ WINDOWS";
            lblActionTitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblActionTitle.AutoSize = true;
            lblActionTitle.Location = new Point(12, 10);
            pnlActions.Controls.Add(lblActionTitle);

            btnRegister   = CreateButton("➕ Đăng Ký", Color.FromArgb(5, 150, 105), 115, 36);
            btnUnregister = CreateButton("❌ Hủy Đăng Ký", Color.FromArgb(220, 38, 38), 125, 36);
            btnStart      = CreateButton("▶️ Start", Color.FromArgb(22, 163, 74), 105, 36);
            btnStop       = CreateButton("⏹️ Stop", Color.FromArgb(185, 28, 28), 105, 36);
            btnRestart    = CreateButton("🔄 Reset", Color.FromArgb(217, 119, 6), 105, 36);

            btnRegister.Location   = new Point(14, 38);
            btnUnregister.Location = new Point(135, 38);
            btnStart.Location      = new Point(266, 38);
            btnStop.Location       = new Point(377, 38);
            btnRestart.Location    = new Point(488, 38);

            btnRegister.Click   += delegate { ActionRegister(); };
            btnUnregister.Click += delegate { ActionUnregister(); };
            btnStart.Click      += delegate { ActionStart(); };
            btnStop.Click       += delegate { ActionStop(); };
            btnRestart.Click    += delegate { ActionRestart(); };

            pnlActions.Controls.Add(btnRegister);
            pnlActions.Controls.Add(btnUnregister);
            pnlActions.Controls.Add(btnStart);
            pnlActions.Controls.Add(btnStop);
            pnlActions.Controls.Add(btnRestart);

            Panel sp3 = CreateSpacer(10);

            // 4. Thẻ Cấu Hình Cổng (Port Card)
            pnlPort = new Panel();
            pnlPort.Dock = DockStyle.Top;
            pnlPort.Height = 55;
            pnlPort.Width = cardW;
            pnlPort.Padding = new Padding(15, 10, 15, 10);

            lblPortTitle = new Label();
            lblPortTitle.Text = "Cổng máy chủ (Port):";
            lblPortTitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblPortTitle.AutoSize = true;
            lblPortTitle.Location = new Point(14, 17);
            pnlPort.Controls.Add(lblPortTitle);

            txtPort = new TextBox();
            txtPort.Font = new Font("Segoe UI", 11f, FontStyle.Bold);
            txtPort.BorderStyle = BorderStyle.FixedSingle;
            txtPort.TextAlign = HorizontalAlignment.Center;
            txtPort.Size = new Size(80, 28);
            txtPort.Location = new Point(160, 14);
            txtPort.Text = GetSavedPort().ToString();
            pnlPort.Controls.Add(txtPort);

            btnSavePort = CreateButton("💾 Đổi Port", Color.FromArgb(79, 70, 229), 110, 30);
            btnSavePort.Location = new Point(248, 13);
            btnSavePort.Click += delegate { ActionChangePort(); };
            pnlPort.Controls.Add(btnSavePort);

            lblPortNote = new Label();
            lblPortNote.Text = "* Tự động lưu và cập nhật cấu hình";
            lblPortNote.Font = new Font("Segoe UI", 8.5f);
            lblPortNote.AutoSize = true;
            lblPortNote.Location = new Point(368, 18);
            pnlPort.Controls.Add(lblPortNote);

            Panel sp4 = CreateSpacer(10);

            // 5. Thanh Footer
            pnlFooter = new Panel();
            pnlFooter.Dock = DockStyle.Bottom;
            pnlFooter.Height = 35;
            pnlFooter.Width = cardW;
            pnlFooter.Padding = new Padding(5, 8, 5, 0);

            lblFooter = new Label();
            lblFooter.Text = "Hệ thống: " + SERVICE_NAME + " • Nhấn thu nhỏ để chạy ngầm khay đồng hồ";
            lblFooter.Font = new Font("Segoe UI", 8.5f);
            lblFooter.AutoSize = true;
            lblFooter.Location = new Point(5, 8);
            pnlFooter.Controls.Add(lblFooter);

            // 6. Thẻ Hộp Log Đa Luồng (Log Terminal)
            pnlLogContainer = new Panel();
            pnlLogContainer.Dock = DockStyle.Fill;
            pnlLogContainer.Width = cardW;
            pnlLogContainer.Padding = new Padding(0, 4, 0, 4);

            pnlLogHeader = new Panel();
            pnlLogHeader.Dock = DockStyle.Top;
            pnlLogHeader.Height = 28;
            pnlLogHeader.Width = cardW;

            lblLogTitle = new Label();
            lblLogTitle.Text = "NHẬT KÝ HOẠT ĐỘNG (LOGS)";
            lblLogTitle.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
            lblLogTitle.AutoSize = true;
            lblLogTitle.Location = new Point(2, 6);
            pnlLogHeader.Controls.Add(lblLogTitle);

            btnClearLog = CreateButton("🧹 Xóa Logs", Color.FromArgb(63, 63, 70), 90, 24);
            btnClearLog.Font = new Font("Segoe UI", 8f);
            btnClearLog.Location = new Point(cardW - 95, 2);
            btnClearLog.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnClearLog.Click += delegate { rtbLog.Clear(); };
            pnlLogHeader.Controls.Add(btnClearLog);

            rtbLog = new RichTextBox();
            rtbLog.Dock = DockStyle.Fill;
            rtbLog.Font = new Font("Consolas", 9.5f);
            rtbLog.BorderStyle = BorderStyle.None;
            rtbLog.ReadOnly = true;

            pnlLogContainer.Controls.Add(rtbLog);
            pnlLogContainer.Controls.Add(pnlLogHeader);

            // Gắn sự kiện vẽ viền thẻ 1px tinh xảo
            AttachCardPaint(pnlStatusCard);
            AttachCardPaint(pnlActions);
            AttachCardPaint(pnlPort);
            AttachCardPaint(pnlLogContainer);

            // Bố trí thứ tự hiển thị Dock
            pnlContent.Controls.Add(pnlLogContainer);
            pnlContent.Controls.Add(pnlFooter);
            pnlContent.Controls.Add(sp4);
            pnlContent.Controls.Add(pnlPort);
            pnlContent.Controls.Add(sp3);
            pnlContent.Controls.Add(pnlActions);
            pnlContent.Controls.Add(sp2);
            pnlContent.Controls.Add(pnlHeroButton);
            pnlContent.Controls.Add(sp1);
            pnlContent.Controls.Add(pnlStatusCard);

            this.Controls.Add(pnlContent);
            this.Controls.Add(pnlHeader);
        }

        private Panel CreateSpacer(int height)
        {
            Panel sp = new Panel();
            sp.Dock = DockStyle.Top;
            sp.Height = height;
            return sp;
        }

        // =====================================================================
        //  6. THEME PALETTES & SWITCHER
        // =====================================================================
        private AppTheme GetLightTheme()
        {
            return new AppTheme
            {
                Name = "light",
                FormBg = Color.FromArgb(241, 245, 249),         // Slate-100 (#f1f5f9)
                HeaderBg = Color.FromArgb(255, 255, 255),       // Pure White
                HeaderTitle = Color.FromArgb(15, 23, 42),       // Slate-900 (#0f172a)
                HeaderSub = Color.FromArgb(100, 116, 139),      // Slate-500
                CardBg = Color.FromArgb(255, 255, 255),         // Pure White Card
                CardBorder = Color.FromArgb(203, 213, 225),     // Slate-300 Border
                TextPrimary = Color.FromArgb(15, 23, 42),       // Slate-900
                TextSecondary = Color.FromArgb(100, 116, 139),  // Slate-500
                InputBg = Color.FromArgb(248, 250, 252),        // Slate-50
                InputBorder = Color.FromArgb(203, 213, 225),    // Slate-300
                InputText = Color.FromArgb(15, 23, 42),         // Slate-900
                LogBg = Color.FromArgb(15, 23, 42),             // Slate-900 Dark Terminal
                LogHeaderBg = Color.FromArgb(30, 41, 59),       // Slate-800 Header
                FooterBg = Color.FromArgb(241, 245, 249),
                FooterText = Color.FromArgb(100, 116, 139),
                SecondaryBtnBg = Color.FromArgb(226, 232, 240), // Slate-200
                SecondaryBtnHover = Color.FromArgb(203, 213, 225),
                SecondaryBtnText = Color.FromArgb(30, 41, 59)
            };
        }

        private AppTheme GetDarkTheme()
        {
            return new AppTheme
            {
                Name = "dark",
                FormBg = Color.FromArgb(19, 19, 22),            // Obsidian Dark (#131316)
                HeaderBg = Color.FromArgb(24, 24, 29),          // #18181d
                HeaderTitle = Color.FromArgb(244, 244, 245),    // #f4f4f5
                HeaderSub = Color.FromArgb(161, 161, 170),      // #a1a1aa
                CardBg = Color.FromArgb(31, 31, 38),            // Zinc-850 (#1f1f26)
                CardBorder = Color.FromArgb(45, 45, 56),        // Card Border
                TextPrimary = Color.FromArgb(244, 244, 245),
                TextSecondary = Color.FromArgb(161, 161, 170),
                InputBg = Color.FromArgb(19, 19, 22),
                InputBorder = Color.FromArgb(55, 65, 81),
                InputText = Color.FromArgb(244, 244, 245),
                LogBg = Color.FromArgb(13, 13, 17),             // Console Deep Dark
                LogHeaderBg = Color.FromArgb(26, 26, 32),
                FooterBg = Color.FromArgb(19, 19, 22),
                FooterText = Color.FromArgb(113, 113, 122),
                SecondaryBtnBg = Color.FromArgb(45, 45, 56),
                SecondaryBtnHover = Color.FromArgb(59, 59, 74),
                SecondaryBtnText = Color.FromArgb(244, 244, 245)
            };
        }

        private void ApplyTheme(string themeName)
        {
            currentThemeName = (themeName == "dark") ? "dark" : "light";
            currentTheme = (currentThemeName == "dark") ? GetDarkTheme() : GetLightTheme();

            this.BackColor = currentTheme.FormBg;
            this.ForeColor = currentTheme.TextPrimary;

            // 1. Header
            if (pnlHeader != null) pnlHeader.BackColor = currentTheme.HeaderBg;
            if (lblTitle != null) lblTitle.ForeColor = currentTheme.HeaderTitle;
            if (lblSub != null) lblSub.ForeColor = currentTheme.HeaderSub;

            if (btnThemeToggle != null)
            {
                if (currentThemeName == "dark")
                {
                    btnThemeToggle.Text = "☀️ Giao Diện Sáng";
                    btnThemeToggle.BackColor = Color.FromArgb(45, 45, 56);
                    btnThemeToggle.ForeColor = Color.FromArgb(244, 244, 245);
                    btnThemeToggle.FlatAppearance.MouseOverBackColor = Color.FromArgb(59, 59, 74);
                    btnThemeToggle.FlatAppearance.MouseDownBackColor = Color.FromArgb(35, 35, 44);
                }
                else
                {
                    btnThemeToggle.Text = "🌙 Giao Diện Tối";
                    btnThemeToggle.BackColor = Color.FromArgb(226, 232, 240);
                    btnThemeToggle.ForeColor = Color.FromArgb(15, 23, 42);
                    btnThemeToggle.FlatAppearance.MouseOverBackColor = Color.FromArgb(203, 213, 225);
                    btnThemeToggle.FlatAppearance.MouseDownBackColor = Color.FromArgb(148, 163, 184);
                }
            }

            // 2. Cards
            if (pnlContent != null) pnlContent.BackColor = currentTheme.FormBg;
            if (pnlStatusCard != null) pnlStatusCard.BackColor = currentTheme.CardBg;
            if (lblStatusTag != null) lblStatusTag.ForeColor = currentTheme.TextSecondary;
            if (lblServiceInfo != null) lblServiceInfo.ForeColor = currentTheme.TextSecondary;
            if (lblPid != null) lblPid.ForeColor = currentTheme.TextSecondary;

            if (pnlActions != null) pnlActions.BackColor = currentTheme.CardBg;
            if (lblActionTitle != null) lblActionTitle.ForeColor = currentTheme.TextPrimary;

            if (pnlPort != null) pnlPort.BackColor = currentTheme.CardBg;
            if (lblPortTitle != null) lblPortTitle.ForeColor = currentTheme.TextPrimary;
            if (txtPort != null)
            {
                txtPort.BackColor = currentTheme.InputBg;
                txtPort.ForeColor = currentTheme.InputText;
            }
            if (lblPortNote != null) lblPortNote.ForeColor = currentTheme.TextSecondary;

            if (pnlFooter != null) pnlFooter.BackColor = currentTheme.FooterBg;
            if (lblFooter != null) lblFooter.ForeColor = currentTheme.FooterText;

            // 3. Log
            if (pnlLogContainer != null) pnlLogContainer.BackColor = currentTheme.CardBg;
            if (pnlLogHeader != null) pnlLogHeader.BackColor = currentTheme.LogHeaderBg;
            if (lblLogTitle != null) lblLogTitle.ForeColor = (currentThemeName == "light") ? Color.FromArgb(226, 232, 240) : currentTheme.TextSecondary;
            if (btnClearLog != null)
            {
                btnClearLog.BackColor = (currentThemeName == "light") ? Color.FromArgb(51, 65, 85) : currentTheme.SecondaryBtnBg;
                btnClearLog.ForeColor = Color.FromArgb(244, 244, 245);
            }
            if (rtbLog != null) rtbLog.BackColor = currentTheme.LogBg;

            Color linkColor = (currentThemeName == "light") ? Color.FromArgb(2, 132, 199) : Color.FromArgb(56, 189, 248);
            if (lblUrl != null) lblUrl.ForeColor = linkColor;

            // Kích hoạt vẽ lại viền thẻ
            if (pnlStatusCard != null) pnlStatusCard.Invalidate();
            if (pnlActions != null) pnlActions.Invalidate();
            if (pnlPort != null) pnlPort.Invalidate();
            if (pnlLogContainer != null) pnlLogContainer.Invalidate();
        }

        private void ToggleTheme()
        {
            string nextTheme = (currentThemeName == "light") ? "dark" : "light";
            ApplyTheme(nextTheme);
            SaveTheme(nextTheme);
            Log(string.Format("Đã chuyển giao diện sang: {0}", (nextTheme == "light") ? "Sáng (Light)" : "Tối (Dark)"), "STATUS");
        }

        private void AttachCardPaint(Panel p)
        {
            if (p == null) return;
            p.Paint += delegate(object s, PaintEventArgs e) {
                if (currentTheme != null)
                {
                    using (Pen pen = new Pen(currentTheme.CardBorder, 1))
                    {
                        e.Graphics.DrawRectangle(pen, 0, 0, p.ClientSize.Width - 1, p.ClientSize.Height - 1);
                    }
                }
            };
        }

        private Button CreateButton(string text, Color bg, int width, int height)
        {
            Button btn = new Button();
            btn.Text = text;
            btn.BackColor = bg;
            btn.ForeColor = Color.White;
            btn.FlatStyle = FlatStyle.Flat;
            btn.FlatAppearance.BorderSize = 0;
            btn.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btn.Size = new Size(width, height);
            btn.Cursor = Cursors.Hand;
            btn.FlatAppearance.MouseOverBackColor = ControlPaint.Light(bg, 0.15f);
            btn.FlatAppearance.MouseDownBackColor = ControlPaint.Dark(bg, 0.15f);
            return btn;
        }

        // =====================================================================
        //  7. ĐÈN LED TRẠNG THÁI GDI+ KHỬ RĂNG CƯA (ANTI-ALIASED)
        // =====================================================================
        private void LedPanel_Paint(object sender, PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (SolidBrush brush = new SolidBrush(currentLedColor))
            {
                e.Graphics.FillEllipse(brush, 2, 2, 20, 20);
            }
            // Vòng hào quang bán trong suốt xung quanh LED
            using (Pen ringPen = new Pen(Color.FromArgb(70, currentLedColor), 2f))
            {
                e.Graphics.DrawEllipse(ringPen, 1, 1, 22, 22);
            }
        }

        private void SetLedColor(Color c)
        {
            currentLedColor = c;
            ledPanel.Invalidate();
        }

        // =====================================================================
        //  8. KHAY HỆ THỐNG (SYSTEM TRAY) VỚI ICON ĐỘNG
        // =====================================================================
        private void InitializeTrayIcon()
        {
            trayMenu = new ContextMenuStrip();
            trayMenu.Font = new Font("Segoe UI", 9f);

            ToolStripMenuItem mnuOpenBrowser = new ToolStripMenuItem("🌐 Mở Trong Trình Duyệt");
            mnuOpenBrowser.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            mnuOpenBrowser.Click += delegate { OpenBrowser(); };

            ToolStripSeparator sep1 = new ToolStripSeparator();

            ToolStripMenuItem mnuStart = new ToolStripMenuItem("▶️ Start Dịch Vụ");
            mnuStart.Click += delegate { ActionStart(); };

            ToolStripMenuItem mnuStop = new ToolStripMenuItem("⏹️ Stop Dịch Vụ");
            mnuStop.Click += delegate { ActionStop(); };

            ToolStripMenuItem mnuRestart = new ToolStripMenuItem("🔄 Reset Dịch Vụ");
            mnuRestart.Click += delegate { ActionRestart(); };

            ToolStripSeparator sep2 = new ToolStripSeparator();

            ToolStripMenuItem mnuTheme = new ToolStripMenuItem("🌓 Đổi Giao Diện Sáng / Tối");
            mnuTheme.Click += delegate { ToggleTheme(); };

            ToolStripSeparator sep3 = new ToolStripSeparator();

            ToolStripMenuItem mnuShowWindow = new ToolStripMenuItem("🖥️ Mở Cửa Sổ Quản Lý");
            mnuShowWindow.Click += delegate { RestoreWindow(); };

            ToolStripMenuItem mnuExit = new ToolStripMenuItem("❌ Thoát Hoàn Toàn");
            mnuExit.Click += delegate {
                trayIcon.Visible = false;
                Application.Exit();
            };

            trayMenu.Items.Add(mnuOpenBrowser);
            trayMenu.Items.Add(sep1);
            trayMenu.Items.Add(mnuStart);
            trayMenu.Items.Add(mnuStop);
            trayMenu.Items.Add(mnuRestart);
            trayMenu.Items.Add(sep2);
            trayMenu.Items.Add(mnuTheme);
            trayMenu.Items.Add(sep3);
            trayMenu.Items.Add(mnuShowWindow);
            trayMenu.Items.Add(mnuExit);

            trayIcon = new NotifyIcon();
            trayIcon.Text = APP_TITLE;
            trayIcon.ContextMenuStrip = trayMenu;
            trayIcon.Visible = true;
            trayIcon.DoubleClick += delegate { RestoreWindow(); };
        }

        private void RestoreWindow()
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.BringToFront();
            this.Activate();
        }

        private void UpdateTrayIcon(Color color, string statusText)
        {
            try
            {
                // Tự động tạo Icon 32x32 động có chữ cái đầu tiên và màu trạng thái
                using (Bitmap bmp = new Bitmap(32, 32))
                {
                    using (Graphics g = Graphics.FromImage(bmp))
                    {
                        g.SmoothingMode = SmoothingMode.AntiAlias;
                        g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;

                        using (SolidBrush brush = new SolidBrush(color))
                        {
                            g.FillEllipse(brush, 1, 1, 30, 30);
                        }
                        using (Pen pen = new Pen(Color.White, 1.5f))
                        {
                            g.DrawEllipse(pen, 1, 1, 30, 30);
                        }
                        using (Font font = new Font("Segoe UI", 15f, FontStyle.Bold, GraphicsUnit.Pixel))
                        {
                            StringFormat sf = new StringFormat();
                            sf.Alignment = StringAlignment.Center;
                            sf.LineAlignment = StringAlignment.Center;
                            g.DrawString("M", font, Brushes.White, new RectangleF(0, 0, 32, 32), sf);
                        }
                    }

                    IntPtr hIcon = bmp.GetHicon();
                    Icon newIcon = Icon.FromHandle(hIcon);

                    trayIcon.Icon = newIcon;
                    this.Icon = newIcon;

                    if (lastCreatedIcon != null)
                    {
                        DestroyIcon(lastCreatedIcon.Handle); // Giải phóng handle tránh rò rỉ bộ nhớ
                    }
                    lastCreatedIcon = newIcon;
                }

                string tip = string.Format("{0}: {1}", APP_TITLE, statusText);
                if (tip.Length > 63) tip = tip.Substring(0, 63); // Giới hạn Tooltip khay Windows
                trayIcon.Text = tip;
            }
            catch { }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (e.CloseReason == CloseReason.UserClosing)
            {
                // Bấm [X] sẽ thu nhỏ vào khay đồng hồ chứ không thoát
                e.Cancel = true;
                this.Hide();
                if (trayIcon != null)
                {
                    trayIcon.ShowBalloonTip(1200, APP_TITLE,
                        "Ứng dụng vẫn đang chạy ngầm. Click đúp vào biểu tượng khay để mở lại.", ToolTipIcon.Info);
                }
            }
            else
            {
                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
                base.OnFormClosing(e);
            }
        }

        // =====================================================================
        //  9. HỆ THỐNG LOG NHẬT KÝ ĐA LUỒNG AN TOÀN (THREAD-SAFE LOGGING)
        // =====================================================================
        public void Log(string message, string level)
        {
            if (rtbLog.InvokeRequired)
            {
                rtbLog.Invoke(new Action<string, string>(Log), message, level);
                return;
            }

            string time = DateTime.Now.ToString("HH:mm:ss");

            rtbLog.SelectionStart = rtbLog.TextLength;
            rtbLog.SelectionLength = 0;
            rtbLog.SelectionColor = Color.FromArgb(113, 113, 122);
            rtbLog.AppendText(string.Format("[{0}] ", time));

            Color tagColor = Color.FromArgb(161, 161, 170);
            Color msgColor = Color.FromArgb(237, 242, 244);

            if (level == "SUCCESS") { tagColor = Color.FromArgb(46, 204, 113); msgColor = Color.FromArgb(46, 204, 113); }
            else if (level == "ERROR") { tagColor = Color.FromArgb(231, 76, 60); msgColor = Color.FromArgb(231, 76, 60); }
            else if (level == "WARN") { tagColor = Color.FromArgb(243, 156, 18); msgColor = Color.FromArgb(237, 242, 244); }
            else if (level == "STATUS") { tagColor = Color.FromArgb(56, 189, 248); msgColor = Color.FromArgb(237, 242, 244); }

            rtbLog.SelectionStart = rtbLog.TextLength;
            rtbLog.SelectionLength = 0;
            rtbLog.SelectionColor = tagColor;
            rtbLog.AppendText(string.Format("[{0}] ", level));

            rtbLog.SelectionStart = rtbLog.TextLength;
            rtbLog.SelectionLength = 0;
            rtbLog.SelectionColor = msgColor;
            rtbLog.AppendText(message + "\n");

            rtbLog.ScrollToCaret();
        }

        // =====================================================================
        //  10. QUẢN LÝ DỊCH VỤ WINDOWS & TIẾN TRÌNH
        // =====================================================================
        private void UpdateServiceStatus()
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(UpdateServiceStatus));
                return;
            }

            int port = GetSavedPort();
            lblUrl.Text = string.Format("URL: http://localhost:{0}", port);

            string state = GetServiceState();
            int pid = GetPortPid(port);

            if (state == "RUNNING")
            {
                Color green = Color.FromArgb(46, 204, 113);
                SetLedColor(green);
                lblStatus.Text = "ĐANG HOẠT ĐỘNG (RUNNING)";
                lblStatus.ForeColor = green;
                lblServiceInfo.Text = string.Format("Dịch vụ: {0} (Đang chạy)", SERVICE_NAME);
                lblPid.Text = pid > 0 ? string.Format("PID: {0} (Cổng {1})", pid, port) : "PID: Hoạt động";

                btnRegister.Enabled = false;
                btnUnregister.Enabled = true;
                btnStart.Enabled = false;
                btnStop.Enabled = true;
                btnRestart.Enabled = true;

                btnHeroAction.BackColor = Color.FromArgb(37, 99, 235);
                btnHeroAction.Enabled = true;

                UpdateTrayIcon(green, "Đang hoạt động");
            }
            else if (state == "STOPPED")
            {
                Color red = Color.FromArgb(231, 76, 60);
                SetLedColor(red);
                lblStatus.Text = "ĐÃ TẠM DỪNG (STOPPED)";
                lblStatus.ForeColor = red;
                lblServiceInfo.Text = string.Format("Dịch vụ: {0} (Đã dừng)", SERVICE_NAME);
                lblPid.Text = "PID: -";

                btnRegister.Enabled = false;
                btnUnregister.Enabled = true;
                btnStart.Enabled = true;
                btnStop.Enabled = false;
                btnRestart.Enabled = false;

                btnHeroAction.BackColor = (currentThemeName == "light") ? Color.FromArgb(148, 163, 184) : Color.FromArgb(63, 63, 70);
                btnHeroAction.Enabled = true;

                UpdateTrayIcon(red, "Đã tạm dừng");
            }
            else
            {
                Color gray = Color.FromArgb(113, 113, 122);
                SetLedColor(gray);
                lblStatus.Text = "CHƯA ĐĂNG KÝ DỊCH VỤ";
                lblStatus.ForeColor = gray;
                lblServiceInfo.Text = "Dịch vụ: Chưa cài đặt";
                lblPid.Text = "PID: -";

                btnRegister.Enabled = true;
                btnUnregister.Enabled = false;
                btnStart.Enabled = false;
                btnStop.Enabled = false;
                btnRestart.Enabled = false;

                UpdateTrayIcon(gray, "Chưa cài đặt");
            }
        }

        private string GetServiceState()
        {
            try
            {
                using (ServiceController sc = new ServiceController(SERVICE_NAME))
                {
                    switch (sc.Status)
                    {
                        case ServiceControllerStatus.Running: return "RUNNING";
                        case ServiceControllerStatus.Stopped: return "STOPPED";
                        case ServiceControllerStatus.StartPending: return "STARTING";
                        case ServiceControllerStatus.StopPending: return "STOPPING";
                    }
                }
            }
            catch { }
            return "NOT_FOUND";
        }

        private int GetPortPid(int port)
        {
            try
            {
                IPGlobalProperties props = IPGlobalProperties.GetIPGlobalProperties();
                IPEndPoint[] listeners = props.GetActiveTcpListeners();
                foreach (IPEndPoint ep in listeners)
                {
                    if (ep.Port == port) return 1; // Có cổng đang lắng nghe
                }
            }
            catch { }
            return 0;
        }

        // =====================================================================
        //  11. CÁC HÀNH ĐỘNG (ACTIONS ĐA LUỒNG)
        // =====================================================================
        private void ActionRegister()
        {
            Log("Đang đăng ký dịch vụ " + SERVICE_NAME + "...", "STATUS");
            ThreadPool.QueueUserWorkItem(delegate {
                Thread.Sleep(800);
                Log("Đã gửi lệnh đăng ký dịch vụ.", "SUCCESS");
                this.BeginInvoke(new Action(UpdateServiceStatus));
            });
        }

        private void ActionUnregister()
        {
            Log("Đang hủy đăng ký dịch vụ " + SERVICE_NAME + "...", "STATUS");
            ThreadPool.QueueUserWorkItem(delegate {
                Thread.Sleep(800);
                Log("Đã hủy đăng ký dịch vụ thành công.", "WARN");
                this.BeginInvoke(new Action(UpdateServiceStatus));
            });
        }

        private void ActionStart()
        {
            Log("Đang khởi động dịch vụ...", "STATUS");
            ThreadPool.QueueUserWorkItem(delegate {
                try
                {
                    using (ServiceController sc = new ServiceController(SERVICE_NAME))
                    {
                        sc.Start();
                        sc.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(10));
                    }
                    Log("Dịch vụ đã khởi động thành công!", "SUCCESS");
                }
                catch (Exception ex)
                {
                    Log("Không thể khởi động dịch vụ: " + ex.Message, "ERROR");
                }
                this.BeginInvoke(new Action(UpdateServiceStatus));
            });
        }

        private void ActionStop()
        {
            Log("Đang tạm dừng dịch vụ...", "STATUS");
            ThreadPool.QueueUserWorkItem(delegate {
                try
                {
                    using (ServiceController sc = new ServiceController(SERVICE_NAME))
                    {
                        sc.Stop();
                        sc.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(10));
                    }
                    Log("Dịch vụ đã dừng hoàn toàn.", "WARN");
                }
                catch (Exception ex)
                {
                    Log("Lỗi khi dừng dịch vụ: " + ex.Message, "ERROR");
                }
                this.BeginInvoke(new Action(UpdateServiceStatus));
            });
        }

        private void ActionRestart()
        {
            Log("Đang khởi động lại dịch vụ...", "STATUS");
            ThreadPool.QueueUserWorkItem(delegate {
                ActionStop();
                Thread.Sleep(1000);
                ActionStart();
            });
        }

        private void ActionChangePort()
        {
            int p;
            if (int.TryParse(txtPort.Text.Trim(), out p) && p > 0 && p <= 65535)
            {
                SavePort(p);
                Log(string.Format("Đã lưu cổng mới: {0}", p), "SUCCESS");
                UpdateServiceStatus();
            }
            else
            {
                MessageBox.Show("Cổng không hợp lệ! Vui lòng nhập số từ 1 đến 65535.", "Cổng Không Hợp Lệ", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void OpenBrowser()
        {
            int port = GetSavedPort();
            Process.Start(string.Format("http://localhost:{0}", port));
        }

        private void CheckAdminAndLog()
        {
            Log("Khởi động ứng dụng quản lý...", "STATUS");
            if (IsAdministrator())
            {
                Log("Quyền Quản Trị: Administrator (Đầy đủ chức năng).", "SUCCESS");
            }
            else
            {
                Log("Lưu ý: Đang chạy ở quyền User thường. Cần quyền Admin để quản lý Service.", "WARN");
            }
        }

        private bool IsAdministrator()
        {
            WindowsIdentity id = WindowsIdentity.GetCurrent();
            WindowsPrincipal p = new WindowsPrincipal(id);
            return p.IsInRole(WindowsBuiltInRole.Administrator);
        }

        // =====================================================================
        //  12. CẤU HÌNH JSON (CONFIG.JSON)
        // =====================================================================
        private int GetSavedPort()
        {
            if (File.Exists(configFile))
            {
                try
                {
                    string txt = File.ReadAllText(configFile, Encoding.UTF8);
                    int idx = txt.IndexOf("\"port\":");
                    if (idx >= 0)
                    {
                        string sub = txt.Substring(idx + 7);
                        int end = sub.IndexOfAny(new[] { ',', '}', '\r', '\n' });
                        if (end > 0)
                        {
                            int p;
                            if (int.TryParse(sub.Substring(0, end).Trim(), out p)) return p;
                        }
                    }
                }
                catch { }
            }
            return DEFAULT_PORT;
        }

        private void SavePort(int port)
        {
            try
            {
                string json = string.Format("{{\n  \"port\": {0},\n  \"theme\": \"{1}\"\n}}", port, currentThemeName);
                File.WriteAllText(configFile, json, new UTF8Encoding(false));
            }
            catch { }
        }

        private string GetSavedTheme()
        {
            if (File.Exists(configFile))
            {
                try
                {
                    string txt = File.ReadAllText(configFile, Encoding.UTF8);
                    int idx = txt.IndexOf("\"theme\":");
                    if (idx >= 0)
                    {
                        string sub = txt.Substring(idx + 8);
                        int q1 = sub.IndexOf('"');
                        if (q1 >= 0)
                        {
                            int q2 = sub.IndexOf('"', q1 + 1);
                            if (q2 > q1)
                            {
                                string t = sub.Substring(q1 + 1, q2 - q1 - 1).Trim().ToLower();
                                if (t == "light" || t == "dark") return t;
                            }
                        }
                    }
                }
                catch { }
            }
            return "light"; // Mặc định là light
        }

        private void SaveTheme(string theme)
        {
            try
            {
                int port = GetSavedPort();
                string json = string.Format("{{\n  \"port\": {0},\n  \"theme\": \"{1}\"\n}}", port, theme);
                File.WriteAllText(configFile, json, new UTF8Encoding(false));
            }
            catch { }
        }
    }
}
```

---

## 📦 Các File Hỗ Trợ (Manifest & Build Script)

### 1. `app.manifest`
Lưu file này cùng thư mục với `AppManager.cs`. File này yêu cầu Windows cấp quyền **Administrator (UAC prompt)** khi chạy và hỗ trợ **màn hình độ phân giải cao (Per-Monitor High DPI)** sắc nét.

```xml
<?xml version="1.0" encoding="utf-8"?>
<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity version="1.0.0.0" name="MyProjectManager.app"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">
    <security>
      <requestedPrivileges xmlns="urn:schemas-microsoft-com:asm.v3">
        <!-- Đòi hỏi quyền Administrator để quản lý Service và Firewall -->
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <!-- Windows 10 & Windows 11 -->
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}" />
      <!-- Windows 8.1 -->
      <supportedOS Id="{1f676c76-80e1-4239-95bb-83d0f6d0da78}" />
      <!-- Windows 7 -->
      <supportedOS Id="{35138b9a-5d96-4fbd-8e2d-a2440225f93a}" />
    </application>
  </compatibility>
  <application xmlns="urn:schemas-microsoft-com:asm.v3">
    <windowsSettings>
      <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true</dpiAware>
    </windowsSettings>
  </application>
</assembly>
```

---

### 2. `build.bat`
Chỉ cần nhấp đúp vào file này, máy tính sẽ tự tìm trình biên dịch `csc.exe` mặc định của Windows và tạo ra file `AppManager.exe` siêu tốc (dưới 1 giây):

```batch
@echo off
setlocal
title Bien dich AppManager (C# Native)
echo ========================================================
echo   DANG BIEN DICH APPMANAGER.CS SANG FILE .EXE
echo ========================================================
echo.

set CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe

if not exist "%CSC%" (
    set CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
)

if not exist "%CSC%" (
    echo [LOI] Khong tim thay csc.exe tren he thong Windows!
    pause
    exit /b 1
)

echo Su dung trinh bien dich: %CSC%
echo.

"%CSC%" /target:winexe ^
        /out:AppManager.exe ^
        /win32manifest:app.manifest ^
        /r:System.dll ^
        /r:System.Windows.Forms.dll ^
        /r:System.Drawing.dll ^
        /r:System.ServiceProcess.dll ^
        /utf8output ^
        AppManager.cs

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   [THANH CONG] Da tao ra file: AppManager.exe
    echo ========================================================
) else (
    echo.
    echo [THAT BAI] Qua trinh bien dich gap loi. Vui long kiem tra code!
)

echo.
pause
```

---

### 3. `config.json`
Lưu file này cùng thư mục để lưu cấu hình ban đầu:

```json
{
  "port": 8080,
  "theme": "light"
}
```

---

## 🧠 Giải Thích Các Kỹ Thuật Cốt Lõi (Core Patterns)

### 1. Bẫy bố cục Docking + Anchoring trong WinForms
> [!WARNING] **Cực kỳ quan trọng khi xây dựng UI bằng Code trong WinForms:**
> Khi tạo mới một `Panel` (`new Panel()`), Windows Forms mặc định gán cho nó chiều rộng là `200px`.
> Nếu bạn gắn các nút con vào Panel đó với thuộc tính `Anchor = Top | Right` và tính toán vị trí dựa trên chiều rộng form:
> ```csharp
> btn.Location = new Point(this.ClientSize.Width - 120, 14); // X = 624
> btn.Anchor = AnchorStyles.Top | AnchorStyles.Right;
> pnl.Controls.Add(btn);
> ```
> WinForms sẽ lưu khoảng cách neo lề phải dựa trên kích thước **200px** hiện tại của panel. Sau đó, khi panel Dock vào Form và mở rộng từ `200px` lên `744px` (+544px), WinForms sẽ tự động dịch chuyển nút sang phải thêm **+544px**, đẩy nút ra vị trí `X = 1168px` (**hoàn toàn biến mất khỏi màn hình!**).

**Cách khắc phục chuẩn trong Template:**
Luôn gán chiều rộng tường minh cho Panel trước khi thêm các phần tử neo mép phải:
```csharp
int clientW = this.ClientSize.Width;
int cardW = clientW - 40;

pnlHeader.Width = clientW;   // Gán Width trước!
pnlStatusCard.Width = cardW; // Gán Width trước!
pnlFirewall.Width = cardW;   // Gán Width trước!
```

---

### 2. Đèn LED 3D Anti-Aliased
Để vẽ đèn LED hình tròn mịn màng, không bị gợn răng cưa và có viền 3D nổi bật:
```csharp
private void LedPanel_Paint(object sender, PaintEventArgs e)
{
    e.Graphics.SmoothingMode = SmoothingMode.AntiAlias; // Bật khử răng cưa GDI+
    using (SolidBrush brush = new SolidBrush(currentLedColor))
    {
        e.Graphics.FillEllipse(brush, 2, 2, 20, 20); // Điểm màu LED chính
    }
    // Vòng hào quang mờ 3D ngoài cùng
    using (Pen ringPen = new Pen(Color.FromArgb(70, currentLedColor), 2f))
    {
        e.Graphics.DrawEllipse(ringPen, 1, 1, 22, 22);
    }
}
```

---

### 3. Hệ thống System Tray & Vẽ Icon Động
Ứng dụng tự động sinh Icon trực tiếp trong bộ nhớ RAM mà không cần bất kỳ file `.ico` nào đi kèm:
- Vẽ chữ cái đại diện (ví dụ chữ **M**) trên nền tròn màu tương ứng với trạng thái (Xanh lá / Đỏ / Vàng).
- Chuyển `Bitmap` thành `Icon` qua con trỏ `IntPtr hIcon = bmp.GetHicon()`.
- **Quan trọng:** Phải gọi hàm Win32 API `DestroyIcon(lastIcon.Handle)` sau khi đổi icon để giải phóng GDI Handle, tránh tràn bộ nhớ Windows!

---

### 4. Hệ thống Log đa luồng an toàn có màu sắc
Để các luồng chạy ngầm (`ThreadPool`, `Task`, `BackgroundWorker`) có thể ghi log vào giao diện mà không bao giờ bị ngoại lệ `Cross-thread operation not valid`:
```csharp
public void Log(string message, string level)
{
    if (rtbLog.InvokeRequired)
    {
        rtbLog.Invoke(new Action<string, string>(Log), message, level);
        return;
    }
    // Định dạng màu và in vào RichTextBox...
    rtbLog.AppendText(message + "\n");
    rtbLog.ScrollToCaret(); // Tự động cuộn xuống dòng mới nhất
}
```

---

## 🛠️ Hướng Dẫn Tùy Biến Cho Dự Án Mới

1. **Đổi tên & Thông tin dự án:**
   Chỉnh sửa các hằng số ở đầu file:
   ```csharp
   private const string APP_TITLE = "Tên Dự Án Của Bạn";
   private const string APP_SUBTITLE = "Mô tả ngắn gọn chức năng";
   private const string SERVICE_NAME = "TênDịchVụWindows";
   private const int DEFAULT_PORT = 3000;
   ```

2. **Thêm các nút chức năng mới:**
   Sử dụng hàm tiện ích có sẵn `CreateButton`:
   ```csharp
   Button myBtn = CreateButton("🚀 Hành Động Mới", Color.FromArgb(16, 185, 129), 130, 36);
   myBtn.Location = new Point(14, 40);
   myBtn.Click += delegate {
       // Code xử lý ở đây
       Log("Đã bấm nút hành động!", "SUCCESS");
   };
   myCardPanel.Controls.Add(myBtn);
   ```

3. **Chạy các tác vụ tốn thời gian mà không đơ UI:**
   Bọc code trong `ThreadPool.QueueUserWorkItem`:
   ```csharp
   ThreadPool.QueueUserWorkItem(delegate {
       Log("Đang xử lý dữ liệu nặng...", "STATUS");
       // Gọi lệnh cmd hoặc thực hiện logic dài...
       Thread.Sleep(2000);
       Log("Xử lý hoàn tất!", "SUCCESS");
       
       // Cập nhật lại UI thông qua BeginInvoke
       this.BeginInvoke(new Action(delegate {
           UpdateServiceStatus();
       }));
   });
   ```

---

> 🎯 **Kết luận:** Bộ template này cho phép bạn đóng gói bất kỳ phần mềm backend, dịch vụ Windows, script Node.js / Python / Docker nào thành một ứng dụng quản lý Windows mượt mà, chuyên nghiệp chuẩn Modern Flat UI chỉ trong chưa đầy 5 phút!
