// @id 01M4V0HMQJ895M409P5XRR77B1
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Runtime.InteropServices;

namespace GDTTaxCrawlerManager
{
    public static class SingleInstanceHelper
    {
        public const int HWND_BROADCAST = 0xffff;
        public static readonly int WM_SHOWME = RegisterWindowMessage("WM_SHOW_GDT_TAX_CRAWLER_MANAGER");

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int RegisterWindowMessage(string lpString);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool PostMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);

        public static void BroadcastShowExistingInstance()
        {
            try
            {
                PostMessage((IntPtr)HWND_BROADCAST, WM_SHOWME, IntPtr.Zero, IntPtr.Zero);
            }
            catch { }
        }
    }
}
