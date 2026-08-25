import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { appConfig, users } from "@/db/schema";
import { ApiError, redactSecrets } from "./http";
import { ensureEncryptionKey } from "./key-store";
import { hashPassword } from "./password";

const ADMIN_FINGERPRINT_ROW = "admin_credential_fingerprint";

export const DEFAULT_ADMIN_EMAIL = "admin@localhost";

/** 建议的管理员密码下限。低于此值只警告，不阻断 —— 拦死会把人锁在门外。 */
const WEAK_PASSWORD_LENGTH = 8;

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

/**
 * 读 ADMIN_PASSWORD，纯空白视为「没设」。
 *
 * `.env.example` 里写的是 `ADMIN_PASSWORD=""`，照抄下来忘了填就是空字符串；
 * 而 `ADMIN_PASSWORD="   "` 这种带引号的空白会被 dotenv 原样保留成真值。
 * 两者都该按未配置处理，否则管理员账户会静默地建不出来（或者密码是几个空格）。
 * 只在「整串都是空白」时判空，不 trim 正常密码 —— 那会悄悄改掉用户的真实密码。
 */
function adminPassword(): string | null {
  const raw = process.env.ADMIN_PASSWORD;
  if (!raw || raw.trim() === "") return null;
  return raw;
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
  const password = adminPassword();
  const email = adminEmail();

  if (!password) {
    console.error(
      `[bootstrap] ADMIN_PASSWORD 未设置（空字符串也算），管理员账户没有创建。` +
        `设置一个非空值后重启即可自动建号（邮箱默认 ${DEFAULT_ADMIN_EMAIL}，可用 ADMIN_EMAIL 覆盖）。`,
    );
    return false;
  }

  if (password.length < WEAK_PASSWORD_LENGTH) {
    console.warn(
      `[bootstrap] ADMIN_PASSWORD 只有 ${password.length} 位，建议至少 ${WEAK_PASSWORD_LENGTH} 位。` +
        `管理员能看到全站节点和用户，这个口子别留太松。`,
    );
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
    const message = explain(err instanceof Error ? err.message : String(err));
    console.error("[bootstrap] 初始化失败：", message);
    return { ok: false, adminConfigured: false, adminEmail: email, error: message };
  }
}

/**
 * 给底层报错补一句可操作的下文。
 *
 * 「表不存在」是最常见的一种：建表是手动步骤（不在构建里跑），而 login_attempts 在
 * 第二个迁移里，所以只迁移了一半的库症状恰好是「登录挂掉，别处看着正常」。
 */
function explain(message: string): string {
  const safe = redactSecrets(message);
  if (/relation .+ does not exist|undefined_table|no such table/i.test(safe)) {
    return `${safe} —— 表还没建齐，对着这个库跑一次 npm run db:migrate。`;
  }
  return safe;
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

/**
 * 引导没成功就别往下走了 —— 抛一个能看懂的 503。
 *
 * 不这么做的话，后面第一次碰数据库时会抛原始异常，被 route() 兜成笼统的
 * 「服务端错误」，配错环境变量的人只能对着 500 猜。
 *
 * **刻意不把 `result.error` 回传给客户端**：那串消息可能是数据库驱动抛的，
 * 里面可能带主机名甚至连接串。要看详情去 /api/health（那里会脱敏）。
 */
export async function requireBootstrapped(): Promise<BootstrapResult> {
  const result = await ensureBootstrapped();
  if (!result.ok) {
    throw new ApiError(
      503,
      "not_configured",
      "服务端还没就绪：数据库连不上，或者必填的环境变量没配。打开 /api/health 看具体缺哪一项。",
    );
  }
  return result;
}
