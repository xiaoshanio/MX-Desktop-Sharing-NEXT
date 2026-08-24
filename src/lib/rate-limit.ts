import { and, count, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { ApiError } from "./http";

const WINDOW_MS = 15 * 60 * 1000; // 15 分钟
const MAX_PER_IDENTIFIER = 8; // 同一邮箱 15 分钟内最多 8 次失败
const MAX_PER_IP = 30; // 同一 IP 15 分钟内最多 30 次失败（撞库防护）

/**
 * 登录限流。基于 DB 时间窗口计数——没有 Redis，但登录 QPS 很低，这点开销可接受。
 *
 * 在校验密码「之前」调用：达到阈值直接 429，连 hash 都不算，省算力也更抗压。
 */
export async function assertLoginAllowed(identifier: string, ip: string | null): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MS);

  const [identRow] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.identifier, identifier), gt(loginAttempts.createdAt, since)));
  if ((identRow?.n ?? 0) >= MAX_PER_IDENTIFIER) {
    throw new ApiError(429, "rate_limited", "登录尝试过于频繁，请 15 分钟后再试");
  }

  if (ip) {
    const [ipRow] = await db
      .select({ n: count() })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), gt(loginAttempts.createdAt, since)));
    if ((ipRow?.n ?? 0) >= MAX_PER_IP) {
      throw new ApiError(429, "rate_limited", "该网络登录尝试过于频繁，请稍后再试");
    }
  }
}

export async function recordLoginFailure(identifier: string, ip: string | null): Promise<void> {
  await db.insert(loginAttempts).values({ identifier, ip });
}

/** 登录成功后清掉该邮箱的失败记录，避免误伤下一次登录。 */
export async function clearLoginFailures(identifier: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.identifier, identifier));
}
