import { createHash, randomInt } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { emailCodes } from "@/db/schema";
import { ApiError, badRequest } from "./http";

/**
 * 邮箱验证码的签发与核验。
 *
 * 几条刻意的选择：
 * - 库里只存 sha256。验证码短、生命周期也短，但拖库的人照样不该拿着它就能登录任何账号。
 * - 一条码最多试错 MAX_ATTEMPTS 次，超了直接作废。6 位数只有 100 万种，
 *   不限次数的话在 10 分钟窗口里是爆得开的。
 * - 同一邮箱重发有冷却，且新码签发时把旧码全部作废 —— 否则「连点五次发送」会
 *   同时留下五个有效码，等于把爆破空间乘了 5。
 */

const CODE_LENGTH = 6;
export const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
/** 两封验证码之间的最小间隔。挡住「连点发送」把别人邮箱当轰炸目标。 */
const RESEND_COOLDOWN_SECONDS = 60;
/** 单个邮箱每小时最多签发几条。 */
const MAX_PER_HOUR = 6;

const hash = (code: string) => createHash("sha256").update(code).digest("hex");

/** 6 位数字。用 randomInt 而不是 Math.random —— 后者不是密码学安全的。 */
function generateCode(): string {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

/**
 * 签发一条新验证码，返回明文（只在这里出现一次，接着就进邮件正文）。
 *
 * 冷却和频次都在这一步查，所以「发信」永远发生在限流之后 —— 不然限流形同虚设，
 * 每次点击都已经把邮件发出去了。
 */
export async function issueCode(email: string): Promise<{ code: string; expiresAt: Date }> {
  const now = new Date();

  const [recent] = await db
    .select({ createdAt: emailCodes.createdAt })
    .from(emailCodes)
    .where(eq(emailCodes.email, email))
    .orderBy(desc(emailCodes.createdAt))
    .limit(1);

  if (recent) {
    const elapsed = (now.getTime() - recent.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      throw new ApiError(
        429,
        "too_many_requests",
        "api.code.tooFast",
        undefined,
        { seconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) },
      );
    }
  }

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailCodes)
    .where(
      and(
        eq(emailCodes.email, email),
        gt(emailCodes.createdAt, new Date(now.getTime() - 60 * 60 * 1000)),
      ),
    );

  if (count >= MAX_PER_HOUR) {
    throw new ApiError(429, "too_many_requests", "api.code.tooManyToday");
  }

  // 旧码一律作废：多个并存等于放大爆破面
  await db
    .update(emailCodes)
    .set({ consumedAt: now })
    .where(and(eq(emailCodes.email, email), isNull(emailCodes.consumedAt)));

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);
  await db.insert(emailCodes).values({ email, codeHash: hash(code), expiresAt });

  return { code, expiresAt };
}

/**
 * 核验并消费一条验证码。成功返回 true，失败抛 400（带剩余次数提示）。
 *
 * 消费是「一次性」的：核验通过立刻标记 consumedAt，同一串码不能用两次登录两个会话。
 */
export async function consumeCode(email: string, code: string): Promise<void> {
  const now = new Date();

  const [row] = await db
    .select()
    .from(emailCodes)
    .where(and(eq(emailCodes.email, email), isNull(emailCodes.consumedAt)))
    .orderBy(desc(emailCodes.createdAt))
    .limit(1);

  if (!row) throw badRequest("api.code.noPending");
  if (row.expiresAt.getTime() <= now.getTime()) {
    await db.update(emailCodes).set({ consumedAt: now }).where(eq(emailCodes.id, row.id));
    throw badRequest("api.code.expired");
  }

  if (hash(code.trim()) !== row.codeHash) {
    const attempts = row.attempts + 1;
    // 试错次数用满就作废整条，不给人接着猜
    await db
      .update(emailCodes)
      .set({ attempts, ...(attempts >= MAX_ATTEMPTS ? { consumedAt: now } : {}) })
      .where(eq(emailCodes.id, row.id));

    const left = MAX_ATTEMPTS - attempts;
    throw badRequest(
      left > 0 ? "api.code.wrongLeft" : "api.code.tooManyWrong",
      undefined,
      { left },
    );
  }

  await db.update(emailCodes).set({ consumedAt: now }).where(eq(emailCodes.id, row.id));
}
