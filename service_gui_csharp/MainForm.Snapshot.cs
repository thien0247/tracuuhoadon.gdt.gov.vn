// @id 01M4V0HMQDMVPRXWNXZTR2Y3QS
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;

namespace GDTTaxCrawlerManager
{
    public partial class MainForm
    {
        public async Task CaptureWindowSnapshotAsync(string outputPath)
        {
            try
            {
                int w = ClientSize.Width > 0 ? ClientSize.Width : 1280;
                int h = ClientSize.Height > 0 ? ClientSize.Height : 840;
                int headerH = pnlHeader.Height > 0 ? pnlHeader.Height : 56;
                int statusH = statusStrip.Height > 0 ? statusStrip.Height : 24;
                int webH = Math.Max(100, h - headerH - statusH);

                using var combined = new Bitmap(w, h);
                using var g = Graphics.FromImage(combined);
                g.Clear(ThemeManager.Current.FormBg);

                // 1. Draw Header Toolbar
                using var headerBmp = new Bitmap(w, headerH);
                pnlHeader.DrawToBitmap(headerBmp, new Rectangle(0, 0, w, headerH));
                g.DrawImage(headerBmp, 0, 0);

                // 2. Draw WebView2 rendered Vue 3 dashboard
                if (isWebViewReady && webView.CoreWebView2 != null && webH > 0)
                {
                    using var ms = new MemoryStream();
                    await webView.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, ms);
                    ms.Position = 0;
                    using var webBmp = new Bitmap(ms);
                    g.DrawImage(webBmp, new Rectangle(0, headerH, w, webH));
                }

                // 3. Draw StatusStrip
                using var statusBmp = new Bitmap(w, statusH);
                statusStrip.DrawToBitmap(statusBmp, new Rectangle(0, 0, w, statusH));
                g.DrawImage(statusBmp, 0, h - statusH);

                var dir = Path.GetDirectoryName(outputPath);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                combined.Save(outputPath, System.Drawing.Imaging.ImageFormat.Png);
                AppLogger.Info("Snapshot", $"Đã lưu ảnh chụp giao diện: {outputPath} ({w}x{h})");
            }
            catch (Exception ex)
            {
                AppLogger.Error("Snapshot", "Lỗi chụp ảnh giao diện", ex);
            }
        }
    }
}
