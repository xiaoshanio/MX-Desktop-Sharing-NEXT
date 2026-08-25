import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { appConfig, users } from "@/db/schema";
import { ensureEncryptionKey } from "./key-store";
import { hashPassword } from "./password";

const ADMIN_FINGERPRINT_ROW = "admin_credential_fingerprint";

export const DEFAULT_ADMIN_EMAIL = "admin@localhost";

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

async function readConfig(key: string): Promise<string | null> {
  const [row] = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, key))
    .limit(1);
  return (row?.value as { v?: string } | undefined)?.v ?? null;
}

async function writeConfig(key: string, v: string): Promise<void> {
  await db
    .insert(appConfig)
    .values({ key, value: { v } as never })
    .onConflictDoUpdate({
      target: appConfig.key,
      set: { value: { v } as never, updatedAt: new Date() },
    });
}

/**
 * 保证管理员账户存在，并让 env 成为其密码的唯一事实来源。
 *
 * 只在「env 里的邮箱+密码组合」变化时才重新哈希写库 —— 否则每次冷启动都跑一遍
 * scrypt 太浪费。用不可逆指纹比对来判断。
 */
async function ensureAdmin(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  const email = adminEmail();

  if (!password) {
    console.error(
      `[bootstrap] ADMIN_PASSWORD 未设置，管理员账户没有创建。` +
        `设置后重启即可自动建号（邮箱默认 ${DEFAULT_ADMIN_EMAIL}，可用 ADMIN_EMAIL 覆盖）。`,
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
    const needsPasswordSync = (await readConfig(ADMIN_FINGERPRINT_ROW)) !== fingerprint;

    // 顺手确保它始终是启用状态的管理员，别被误操作锁在门外
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

export type BootstrapResult = {
  ok: boolean;
  adminConfigured: boolean;
  adminEmail: string;
  error?: string;
};

let ready: Promise<BootstrapResult> | null = null;

async function run(): Promise<BootstrapResult> {
  const email = adminEmail();
  try {
    await ensureEncryptionKey();
    const adminConfigured = await ensureAdmin();
    return { ok: true, adminConfigured, adminEmail: email };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[bootstrap] 初始化失败：", message);
    return { ok: false, adminConfigured: false, adminEmail: email, error: message };
  }
}

/**
 * 启动引导：建管理员、供给加密密钥。幂等，每进程只真正跑一次。
 *
 * 刻意**不**用 instrumentation.ts —— 那会让 webpack 把 node:crypto 拖进
 * 不支持 node: scheme 的编译目标，dev 下每个请求都 500。改成在需要的入口惰性触发。
 */
export function ensureBootstrapped(): Promise<BootstrapResult> {
  ready ??= run().then((r) => {
    // 失败不缓存，让下次请求能重试（比如数据库刚才只是抖了一下）
    if (!r.ok) ready = null;
    return r;
  });
  return ready;
}
