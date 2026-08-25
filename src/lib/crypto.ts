import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

/**
 * 放在 globalThis 上而不是模块变量：Next 可能把 instrumentation 和 route handler
 * 打进不同的 chunk，那样模块级变量就不是同一份了。globalThis 一定跨 chunk 共享。
 */
const HOLDER = "__mxds_credential_key__";

type KeyHolder = { [HOLDER]?: Buffer };

let cachedKey: Buffer | null = null;

export function parseKey(raw: string): Buffer {
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(`凭据加密密钥必须是 32 字节的 base64，当前解出 ${buf.length} 字节。`);
  }
  return buf;
}

/** 由 bootstrap 调用：把（env 里读到的或库里取出的）密钥交给本模块。 */
export function setEncryptionKey(buf: Buffer): void {
  (globalThis as KeyHolder)[HOLDER] = buf;
  cachedKey = buf;
}

function key(): Buffer {
  if (cachedKey) return cachedKey;

  // 显式配置优先
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (raw) {
    cachedKey = parseKey(raw);
    return cachedKey;
  }

  // 否则用 bootstrap 供给的那把（首次启动时自动生成并存进 app_config）
  const supplied = (globalThis as KeyHolder)[HOLDER];
  if (supplied) {
    cachedKey = supplied;
    return supplied;
  }

  throw new Error(
    "凭据加密密钥未就绪：既没有设置 CREDENTIAL_ENCRYPTION_KEY，启动引导也没跑成功。" +
      "请检查 DATABASE_URL 是否可连接。",
  );
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
