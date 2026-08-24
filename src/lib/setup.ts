import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appConfig } from "@/db/schema";

export const INITIALIZED_KEY = "initialized";

export async function isInitialized(): Promise<boolean> {
  const [row] = await db
    .select({ key: appConfig.key })
    .from(appConfig)
    .where(eq(appConfig.key, INITIALIZED_KEY))
    .limit(1);
  return Boolean(row);
}

/**
 * 抢初始化锁。返回 false 说明已经有人初始化过了。
 * neon-http 不支持交互式事务，所以拿这一行 insert 当互斥量用。
 */
export async function claimInitialization(): Promise<boolean> {
  const inserted = await db
    .insert(appConfig)
    .values({ key: INITIALIZED_KEY, value: { at: new Date().toISOString() } as never })
    .onConflictDoNothing()
    .returning({ key: appConfig.key });
  return inserted.length > 0;
}

/** 初始化中途失败时把锁放掉，让用户能改完配置重试。 */
export async function releaseInitialization(): Promise<void> {
  await db.delete(appConfig).where(eq(appConfig.key, INITIALIZED_KEY));
}
