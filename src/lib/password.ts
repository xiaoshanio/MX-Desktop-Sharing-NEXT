import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

const N = 16384; // CPU/内存成本，Vercel serverless 上约 50-100ms
const KEY_LEN = 64;

// promisify 会挑到 3 参数那个重载，拿不到 options，所以手动包一层
function scrypt(password: string, salt: Buffer, keylen: number, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, { N: cost }, (err, derived) =>
      err ? reject(err) : resolve(derived),
    );
  });
}

/** 格式：scrypt$N$saltB64$hashB64 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEY_LEN, N);
  return `scrypt$${N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const cost = Number(parts[1]);
  if (!Number.isInteger(cost) || cost < 1024) return false;

  const salt = Buffer.from(parts[2], "base64");
  const expected = Buffer.from(parts[3], "base64");
  const actual = await scrypt(password.normalize("NFKC"), salt, expected.length, cost);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
