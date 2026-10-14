// @id 01M4TZTRA1H79B5QWVJ4KZNV9G
// @related 01M4V0FH0V3ZG4NN14DWF01R81, 01M4V0FH0GKXYPS38JG5J0A4FF
using System;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace GDTTaxCrawlerManager.Utils
{
    /// <summary>
    /// Bộ sinh và xác thực ULID (Universally Unique Lexicographically Sortable Identifier)
    /// Chuẩn Crockford Base32, độ dài 26 ký tự (10 ký tự timestamp ms + 16 ký tự random).
    /// </summary>
    public static class UlidGenerator
    {
        private const string CROCKFORD_32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
        private static readonly Regex UlidRegex = new Regex("^[0-9A-HJKMNP-TV-Z]{26}$", RegexOptions.Compiled);

        public static string NewUlid()
        {
            long ms = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            char[] chars = new char[26];

            for (int i = 9; i >= 0; i--)
            {
                chars[i] = CROCKFORD_32[(int)(ms & 31)];
                ms >>= 5;
            }

            byte[] rand = RandomNumberGenerator.GetBytes(10);
            for (int i = 0; i < 16; i++)
            {
                int byteIdx = (i * 5) / 8;
                int bitOffset = (i * 5) % 8;
                int val = rand[byteIdx] >> bitOffset;
                if (bitOffset > 3 && byteIdx + 1 < rand.Length)
                {
                    val |= rand[byteIdx + 1] << (8 - bitOffset);
                }
                chars[10 + i] = CROCKFORD_32[val & 31];
            }

            return new string(chars);
        }

        public static bool IsValid(string? ulid)
        {
            if (string.IsNullOrWhiteSpace(ulid) || ulid.Length != 26) return false;
            return UlidRegex.IsMatch(ulid);
        }
    }
}
