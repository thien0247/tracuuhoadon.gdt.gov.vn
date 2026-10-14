// @id 01M4V1TS000000000000000001
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * @file src/utils/ulid.ts
 * @description Bộ tiện ích sinh mã định danh bất biến ULID Crockford Base32 26 ký tự viết hoa (Isomorphic Server & Client).
 */

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/**
 * Sinh mã ULID 26 ký tự viết hoa kháng trùng lặp, sắp xếp theo thời gian mili-giây.
 */
export function generateUlid(seedTime: number = Date.now()): string {
  let timeStr = '';
  let time = Math.floor(seedTime);

  for (let i = 9; i >= 0; i--) {
    const mod = time % 32;
    timeStr = CROCKFORD_BASE32[mod] + timeStr;
    time = Math.floor(time / 32);
  }

  const randBytes = new Uint8Array(10);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(randBytes);
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

/**
 * Kiểm tra tính hợp lệ của chuỗi mã ULID (26 ký tự, Crockford Base32).
 */
export function isValidUlid(id: unknown): boolean {
  if (typeof id !== 'string' || id.length !== 26) return false;
  return ULID_REGEX.test(id);
}
