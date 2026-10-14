// @id 01M4V0HMQKJ4A3VP1ZH65XQA77
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System.Drawing;

namespace GDTTaxCrawlerManager
{
    public class ThemeColors
    {
        public Color FormBg { get; set; }
        public Color HeaderBg { get; set; }
        public Color HeaderTitle { get; set; }
        public Color HeaderSub { get; set; }
        public Color TextPrimary { get; set; }
        public Color TextSecondary { get; set; }
        public Color CardBg { get; set; }
        public Color CardBorder { get; set; }
        public Color StatusStripBg { get; set; }
        public Color ButtonSecondaryBg { get; set; }
        public Color ButtonSecondaryText { get; set; }
    }

    public static class ThemeManager
    {
        public static bool IsDarkMode { get; private set; }

        public static ThemeColors Light { get; } = new ThemeColors
        {
            FormBg = Color.FromArgb(248, 250, 252),
            HeaderBg = Color.FromArgb(0, 91, 170), // VNPT Blue
            HeaderTitle = Color.White,
            HeaderSub = Color.FromArgb(224, 242, 254),
            TextPrimary = Color.FromArgb(15, 23, 42),
            TextSecondary = Color.FromArgb(100, 116, 139),
            CardBg = Color.White,
            CardBorder = Color.FromArgb(226, 232, 240),
            StatusStripBg = Color.FromArgb(241, 245, 249),
            ButtonSecondaryBg = Color.FromArgb(241, 245, 249),
            ButtonSecondaryText = Color.FromArgb(51, 65, 85)
        };

        public static ThemeColors Dark { get; } = new ThemeColors
        {
            FormBg = Color.FromArgb(15, 23, 42),
            HeaderBg = Color.FromArgb(30, 41, 59),
            HeaderTitle = Color.FromArgb(248, 250, 252),
            HeaderSub = Color.FromArgb(148, 163, 184),
            TextPrimary = Color.FromArgb(241, 245, 249),
            TextSecondary = Color.FromArgb(148, 163, 184),
            CardBg = Color.FromArgb(30, 41, 59),
            CardBorder = Color.FromArgb(51, 65, 85),
            StatusStripBg = Color.FromArgb(15, 23, 42),
            ButtonSecondaryBg = Color.FromArgb(51, 65, 85),
            ButtonSecondaryText = Color.FromArgb(241, 245, 249)
        };

        public static ThemeColors Current => IsDarkMode ? Dark : Light;
        public static string ModeName => IsDarkMode ? "Dark" : "Light";

        public static void SetDarkMode(bool dark)
        {
            IsDarkMode = dark;
        }

        public static void ToggleTheme()
        {
            IsDarkMode = !IsDarkMode;
        }
    }
}
