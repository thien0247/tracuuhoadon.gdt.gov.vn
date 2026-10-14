// @id 01M4V0HMQCV19SGACM596DQMTQ
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace GDTTaxCrawlerManager
{
    public partial class MainForm
    {
        private void StartPollingTimer()
        {
            pollTimer = new System.Windows.Forms.Timer { Interval = 2500 };
            pollTimer.Tick += async (s, e) => await CheckSystemStatusAsync();
            pollTimer.Start();
        }

        private ServiceState? lastKnownStatus = null;
        private bool wasWebOpen = false;

        private async Task CheckSystemStatusAsync()
        {
            var status = await Task.Run(() => ServiceHelper.GetStatus());
            bool webOpen = await Task.Run(() => ServiceHelper.IsPortOpen(ServiceHelper.WEB_PORT));
            bool workerOpen = await Task.Run(() => ServiceHelper.IsPortOpen(ServiceHelper.WORKER_PORT));
            int? pid = await Task.Run(() => ServiceHelper.GetServicePid());
            bool dbOpen = await Task.Run(() => ServiceHelper.IsPortOpen(5433, 250) || ServiceHelper.IsPortOpen(5432, 250));

            if (status != lastKnownStatus)
            {
                AppLogger.Info("Service", $"Trạng thái: {status} {(pid.HasValue ? $"(PID {pid})" : "")} | Web8123={webOpen} | Worker8124={workerOpen} | DB5433={dbOpen}");
                lastKnownStatus = status;
            }

            if (webOpen && !wasWebOpen)
            {
                wasWebOpen = true;
                if (!IsLocalMode) NavigateToDashboard();
            }
            else if (!webOpen && wasWebOpen)
            {
                wasWebOpen = false;
                if (!IsLocalMode) ShowOfflinePlaceholder();
            }

            Color ledColor = (status == ServiceState.Running && webOpen) ? Color.FromArgb(16, 185, 129) :
                             (status == ServiceState.Running) ? Color.FromArgb(245, 158, 11) : Color.FromArgb(239, 68, 68);

            ledIndicator.BackColor = ledColor;
            UpdateTrayIcon(ledColor);

            lblServiceStatus.Text = status switch
            {
                ServiceState.Running => $"Hoạt động {(pid.HasValue ? $"(PID {pid})" : "")}",
                ServiceState.Stopped => "Đã Dừng",
                ServiceState.StartPending => "Đang Khởi Động...",
                _ => "Chưa Cài Đặt"
            };

            lblPortInfo.Text = $"Web: {(webOpen ? "8123 ✅" : "8123 ⚠️")} | Worker: {(workerOpen ? "8124 ✅" : "8124 ⚠️")} | DB: {(dbOpen ? "5433 ✅" : "5433 ⚠️")} ({DateTime.Now:HH:mm:ss})";
            UpdateServiceButtonsState(status);
            if (webViewBridge != null) _ = webViewBridge.BroadcastStatusAsync();
        }

        protected override void OnResize(EventArgs e)
        {
            base.OnResize(e);
            if (pollTimer == null) return;
            pollTimer.Interval = (WindowState == FormWindowState.Minimized) ? 12000 : 2500;
            if (WindowState != FormWindowState.Minimized) _ = CheckSystemStatusAsync();
        }

        private void SetServiceButtonsEnabled(bool enabled)
        {
            btnStart.Enabled = enabled;
            btnStop.Enabled = enabled;
            btnRestart.Enabled = enabled;
        }

        private void UpdateServiceButtonsState(ServiceState status)
        {
            bool isRunning = status == ServiceState.Running;
            bool isStopped = status == ServiceState.Stopped;
            bool isTransition = status == ServiceState.StartPending || status == ServiceState.StopPending;

            btnStart.Enabled = isStopped && !isTransition;
            btnStop.Enabled = isRunning && !isTransition;
            btnRestart.Enabled = isRunning && !isTransition;
            UpdateTrayServiceMenuItems(status);
        }

        private async Task OnStartServiceClicked()
        {
            SetServiceButtonsEnabled(false);
            AppLogger.Info("Service", "Lệnh người dùng: Bật Windows Service.");
            lblStatusStrip.Text = "Đang khởi động dịch vụ Windows Service...";
            await ServiceHelper.RunServiceBatAsync("start", projectRootDir);
            await Task.Delay(2000);
            NavigateToDashboard();
            await CheckSystemStatusAsync();
        }

        private async Task OnStopServiceClicked()
        {
            SetServiceButtonsEnabled(false);
            AppLogger.Info("Service", "Lệnh người dùng: Tắt Windows Service.");
            lblStatusStrip.Text = "Đang dừng dịch vụ...";
            await ServiceHelper.RunServiceBatAsync("stop", projectRootDir);
            await Task.Delay(1000);
            ShowOfflinePlaceholder();
            await CheckSystemStatusAsync();
        }

        private async Task OnRestartServiceClicked()
        {
            SetServiceButtonsEnabled(false);
            AppLogger.Info("Service", "Lệnh người dùng: Khởi động lại Windows Service.");
            lblStatusStrip.Text = "Đang khởi động lại dịch vụ...";
            await ServiceHelper.RunServiceBatAsync("restart", projectRootDir);
            await Task.Delay(3000);
            NavigateToDashboard();
            await CheckSystemStatusAsync();
        }
    }
}
