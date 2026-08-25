import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appConfig } from "@/db/schema";
import { parseKey, setEncryptionKey } from "./crypto";

const ROW = "credential_encryption_key";

export type KeySource = "env" | "database" | "generated";

let ready: Promise<KeySource> | null = null;
let source: KeySource | null = null;

async function load(): Promise<KeySource> {
  const fromEnv = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (fromEnv) {
    setEncryptionKey(parseKey(fromEnv));
    return "env";
  }

  const read = async (): Promise<string | null> => {
    const [row] = await db
      .select({ value: appConfig.value })
      .from(appConfig)
      .where(eq(appConfig.key, ROW))
      .limit(1);
    return (row?.value as { v?: string } | undefined)?.v ?? null;
  };

  const stored = await read();
  if (stored) {
    setEncryptionKey(parseKey(stored));
    return "database";
  }

  // 抢占式插入 + 回读：两个并发冷启动各生成一把时，最终只有先到的那把生效
  const generated = randomBytes(32).toString("base64");
  await db
    .insert(appConfig)
    .values({ key: ROW, value: { v: generated } as never })
    .onConflictDoNothing();

  const settled = await read();
  setEncryptionKey(parseKey(settled ?? generated));
  return settled === generated ? "generated" : "database";
}

/**
 * 保证凭据加密密钥就绪。任何要 encryptSecret / decryptSecret 的地方先 await 这个。
 *
 * 缓存的是 promise，所以并发调用只会真正加载一次；失败则清掉缓存，让下次能重试
 * （否则一次数据库抖动会把整个进程的加解密永久卡死）。
 */
export function ensureEncryptionKey(): Promise<KeySource> {
  ready ??= load()
    .then((s) => {
      source = s;
      return s;
    })
    .catch((err) => {
      ready = null;
      throw err;
    });
  return ready;
}

/** 给 /api/health 用：密钥是从哪来的。null = 还没加载过。 */
export function encryptionKeySource(): KeySource | null {
  return source;
}
