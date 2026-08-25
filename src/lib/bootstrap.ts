import { createHash, randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { appConfig, users } from "@/db/schema";
import { parseKey, setEncryptionKey } from "./crypto";
import { hashPassword } from "./password";

const KEY_ROW = "credential_encryption_key";
const ADMIN_FINGERPRINT_ROW = "admin_credential_fingerprint";

export const DEFAULT_ADMIN_EMAIL = "admin@localhost";

/** 热调用直接跳过——引导只需要在每个进程冷启动时做一次。 */
const DONE = "__mxds_bootstrapped__";
type DoneHolder = { [DONE]?: boolean };

export type BootstrapResult = {
  ok: boolean;
  adminConfigured: boolean;
  adminEmail: string;
  keySource: "env" | "database" | "generated" | "unavailable";
  error?: string;
};

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

async function readConfig(key: string): Promise<string | null> {
  const [row] = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, key))
    .limit(1);
  const value = row?.value as { v?: string } | undefined;
  return value?.v ?? null;
}

async function writeConfig(key: string, v: string): Promise<void> {
  await db
    .insert(appConfig)
    .values({ key, value: { v } as never })
    .onConflictDoUpdate({ target: appConfig.key, set: { value: { v } as never, updatedAt: new Date() } });
}

/**
 * 供给凭据加密密钥。
 *
 * 优先用 CREDENTIAL_ENCRYPTION_KEY；没设就在库里存一把自动生成的。
 *
 * 关于自动生成的安全性：密钥和密文落在同一个库里，能挡住日志泄露、单表导出、
 * 截图这类局部泄露，但挡不住整库被拖。要更强的隔离就显式设 CREDENTIAL_ENCRYPTION_KEY，
 * 让密钥待在数据库之外。这是「零配置开箱」和「密钥隔离」之间的取舍，默认选了前者。
 */
async function ensureEncryptionKey(): Promise<BootstrapResult["keySource"]> {
  const fromEnv = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (fromEnv) {
    setEncryptionKey(parseKey(fromEnv));
    return "env";
  }

  const stored = await readConfig(KEY_ROW);
  if (stored) {
    setEncryptionKey(parseKey(stored));
    return "database";
  }

  const generated = randomBytes(32).toString("base64");
  // onConflictDoUpdate 会覆盖，所以这里先抢占式插入再回读，避免两个冷启动同时生成
  await db
    .insert(appConfig)
    .values({ key: KEY_ROW, value: { v: generated } as never })
    .onConflictDoNothing();

  const settled = await readConfig(KEY_ROW);
  setEncryptionKey(parseKey(settled ?? generated));
  return settled === generated ? "generated" : "database";
}

/**
 * 保证管理员账户存在，并让 env 成为其密码的唯一事实来源。
 *
 * 只在「env 里的邮箱+密码组合」发生变化时才重新哈希写库——否则每次冷启动都跑一遍
 * scrypt 太浪费。用指纹比对来判断，指纹本身是不可逆的。
 */
async function ensureAdmin(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  const email = adminEmail();

  if (!password) {
    console.error(
      "[bootstrap] ADMIN_PASSWORD 未设置，管理员账户没有创建。" +
        "设置它之后重启即可自动建号（邮箱默认 " +
        DEFAULT_ADMIN_EMAIL +
        "，可用 ADMIN_EMAIL 覆盖）。",
    );
    return false;
  }

  const fingerprint = createHash("sha256").update(`${email}:${password}`).digest("hex");
  const [existing] = await db
    .select({ id: users.id, role: users.role, isDisabled: users.isDisabled })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (existing) {
    const knownFingerprint = await readConfig(ADMIN_FINGERPRINT_ROW);
    const needsPasswordSync = knownFingerprint !== fingerprint;

    // 确保它始终是启用状态的管理员，别被误操作锁在门外
    if (needsPasswordSync || existing.role !== "admin" || existing.isDisabled) {
      await db
        .update(users)
        .set({
          role: "admin",
          isDisabled: false,
          ...(needsPasswordSync ? { passwordHash: await hashPassword(password) } : {}),
        })
        .where(eq(users.id, existing.id));
      if (needsPasswordSync) {
        await writeConfig(ADMIN_FINGERPRINT_ROW, fingerprint);
        console.log("[bootstrap] 管理员密码已按 ADMIN_PASSWORD 同步。");
      }
    }
    return true;
  }

  await db
    .insert(users)
    .values({
      email,
      displayName: "管理员",
      passwordHash: await hashPassword(password),
      role: "admin",
    })
    .onConflictDoNothing();
  await writeConfig(ADMIN_FINGERPRINT_ROW, fingerprint);
  console.log(`[bootstrap] 已创建管理员账户 ${email}`);
  return true;
}

/**
 * 启动引导。幂等，每个进程冷启动跑一次。
 * 失败不抛出——让站点还能起来并给出可读的错误，而不是白屏。
 */
export async function bootstrap(): Promise<BootstrapResult> {
  const email = adminEmail();

  try {
    const keySource = await ensureEncryptionKey();
    const adminConfigured = await ensureAdmin();
    (globalThis as DoneHolder)[DONE] = true;
    return { ok: true, adminConfigured, adminEmail: email, keySource };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[bootstrap] 初始化失败：", message);
    return {
      ok: false,
      adminConfigured: false,
      adminEmail: email,
      keySource: "unavailable",
      error: message,
    };
  }
}

/** 兜底：万一 instrumentation 没跑（某些运行环境），第一个请求时补上。 */
export async function ensureBootstrapped(): Promise<void> {
  if ((globalThis as DoneHolder)[DONE]) return;
  await bootstrap();
}
