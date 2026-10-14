// @id 01M4V0HMQEN69ZHMDM5T6XNFXF
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace GDTTaxCrawlerManager
{
    public partial class MainForm
    {
        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        private static extern bool DestroyIcon(IntPtr handle);

        private NotifyIcon notifyIcon = null!;
        private ContextMenuStrip trayMenu = null!;
        private bool isExplicitExit = false;

        private void SetupTrayIntegration()
        {
            trayMenu = new ContextMenuStrip();
            trayMenu.Items.Add("🖥️ Mở Giao Diện Quản Trị", null, (s, e) => ShowAndRestore());
            trayMenu.Items.Add("🛠️ Điều Khiển Dịch Vụ", null, (s, e) => { ShowAndRestore(); OpenServicesTab(); });
            trayMenu.Items.Add("-");
            trayMenu.Items.Add("▶ Khởi Động Dịch Vụ", null, async (s, e) => await OnStartServiceClicked());
            trayMenu.Items.Add("⏹ Dừng Dịch Vụ", null, async (s, e) => await OnStopServiceClicked());
            trayMenu.Items.Add("🔄 Khởi Động Lại Dịch Vụ", null, async (s, e) => await OnRestartServiceClicked());
            trayMenu.Items.Add("-");
            trayMenu.Items.Add("📁 Mở Thư Mục Logs", null, (s, e) => AppLogger.OpenLogFolder());
            trayMenu.Items.Add("📝 Xem File Log Hôm Nay", null, (s, e) => AppLogger.OpenCurrentLogFile());
            trayMenu.Items.Add("-");
            trayMenu.Items.Add("🌐 Mở Trình Duyệt Ngoài", null, (s, e) => OpenExternalBrowser());
            trayMenu.Items.Add("❌ Thoát Hoàn Toàn", null, (s, e) => { isExplicitExit = true; Close(); });

            notifyIcon = new NotifyIcon
            {
                Text = "GDT Tax Crawler Manager (Vue 3 + .NET 10)",
                Visible = true,
                ContextMenuStrip = trayMenu
            };

            notifyIcon.DoubleClick += (s, e) => ShowAndRestore();
            Application.ApplicationExit += (s, e) =>
            {
                try { notifyIcon.Visible = false; notifyIcon.Dispose(); } catch { }
            };
            UpdateTrayIcon(Color.FromArgb(113, 113, 122));
        }

        public void UpdateTrayServiceMenuItems(ServiceState status)
        {
            if (trayMenu == null || trayMenu.Items.Count < 6) return;
            bool isRunning = status == ServiceState.Running;
            bool isStopped = status == ServiceState.Stopped;
            trayMenu.Items[3].Enabled = isStopped;
            trayMenu.Items[4].Enabled = isRunning;
            trayMenu.Items[5].Enabled = isRunning;
        }

        private IntPtr currentHIcon = IntPtr.Zero;
        private Color lastTrayColor = Color.Empty;

        private void UpdateTrayIcon(Color ledColor)
        {
            if (ledColor == lastTrayColor && notifyIcon.Icon != null)
                return;
            lastTrayColor = ledColor;

            try
            {
                using var bmp = new Bitmap(16, 16);
                using (var g = Graphics.FromImage(bmp))
                {
                    g.SmoothingMode = SmoothingMode.AntiAlias;
                    g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;
                    using var brush = new SolidBrush(ledColor);
                    g.FillEllipse(brush, 1, 1, 14, 14);

                    using var font = new Font("Segoe UI", 9f, FontStyle.Bold, GraphicsUnit.Pixel);
                    using var textBrush = new SolidBrush(Color.White);
                    var sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    g.DrawString("G", font, textBrush, new RectangleF(0, 0, 16, 16), sf);
                }

                IntPtr newHIcon = bmp.GetHicon();
                IntPtr oldHIcon = currentHIcon;
                currentHIcon = newHIcon;
                notifyIcon.Icon = Icon.FromHandle(newHIcon);

                if (oldHIcon != IntPtr.Zero)
                    DestroyIcon(oldHIcon);
            }
            catch { }
        }

        public void ShowAndRestore()
        {
            AppLogger.Info("Tray", "Khôi phục cửa sổ quản trị từ khay hệ thống.");
            Show();
            if (WindowState == FormWindowState.Minimized)
                WindowState = FormWindowState.Normal;
            BringToFront();
            Activate();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (!isExplicitExit && e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                Hide();
                AppLogger.Info("Tray", "Thu nhỏ cửa sổ xuống khay hệ thống.");
                notifyIcon.ShowBalloonTip(2000, "GDT Tax Crawler", "Ứng dụng đang chạy ngầm trong khay hệ thống.", ToolTipIcon.Info);
                return;
            }

            AppLogger.Info("Tray", "Đóng hoàn toàn ứng dụng.");
            notifyIcon.Visible = false;
            notifyIcon.Dispose();
            if (currentHIcon != IntPtr.Zero)
            {
                DestroyIcon(currentHIcon);
                currentHIcon = IntPtr.Zero;
            }
            base.OnFormClosing(e);
        }
    }
}
