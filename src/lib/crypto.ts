import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY 未设置。运行 `npm run keygen` 生成一把。");
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(`CREDENTIAL_ENCRYPTION_KEY 必须是 32 字节的 base64，当前解出 ${buf.length} 字节。`);
  }
  cachedKey = buf;
  return buf;
}

/** 加密后的格式：base64( iv | ciphertext | authTag ) */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, enc, cipher.getAuthTag()]).toString("base64");
}

export function decryptSecret(packed: string): string {
  const buf = Buffer.from(packed, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("密文格式损坏");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const enc = buf.subarray(IV_LEN, buf.length - TAG_LEN);
  const decipher = createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** 回显给前端用：sk_live_abcd… → sk_l********cd */
export function maskSecret(plain: string): string {
  if (plain.length <= 8) return "*".repeat(plain.length);
  return `${plain.slice(0, 4)}${"*".repeat(8)}${plain.slice(-2)}`;
}
