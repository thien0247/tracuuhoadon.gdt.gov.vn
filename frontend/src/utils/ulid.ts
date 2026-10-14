// @id 01M4V0HMN7FE4FE1E8F43DFEAA
// @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * frontend/src/utils/ulid.ts
 * Bộ sinh và kiểm tra ULID (Universally Unique Lexicographically Sortable Identifier)
 * Chuẩn Crockford Base32 26 ký tự viết hoa cho Frontend Vue 3.
 */

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function generateUlid(seedTime: number = Date.now()): string {
  let timeStr = '';
  let time = Math.floor(seedTime);

  for (let i = 9; i >= 0; i--) {
    const mod = time % 32;
    timeStr = CROCKFORD_BASE32[mod] + timeStr;
    time = Math.floor(time / 32);
  }

  const randBytes = new Uint8Array(10);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randBytes);
  } else {
    for (let i = 0; i < 10; i++) randBytes[i] = Math.floor(Math.random() * 256);
  }

  let randStr = '';
  let bitBuffer = 0n;
  for (let i = 0; i < 10; i++) {
    bitBuffer = (bitBuffer << 8n) | BigInt(randBytes[i]);
  }
  for (let i = 0; i < 16; i++) {
    const shift = BigInt((15 - i) * 5);
    const index = Number((bitBuffer >> shift) & 0x1fn);
    randStr += CROCKFORD_BASE32[index];
  }

  return timeStr + randStr;
}

export function isValidUlid(val: unknown): boolean {
  if (typeof val !== 'string' || val.length !== 26) return false;
  return ULID_REGEX.test(val);
}
