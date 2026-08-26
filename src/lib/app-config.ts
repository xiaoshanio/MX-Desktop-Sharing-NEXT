import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appConfig } from "@/db/schema";

/**
 * app_config（全局 KV）的读写。
 *
 * 值一律包一层 `{ v: … }` 再落 jsonb：顶层直接放裸标量的话，以后想给某个键
 * 补第二个字段就得迁移已经写进去的行。包装层让「加字段」变成兼容的改动。
 *
 * 这个模块只依赖 db 和 schema —— bootstrap.ts 在最早的启动路径上用它，
 * 不能顺着 import 把别的东西拖进去。
 */

/** 读不到（键不存在）返回 null。注意 `false` 是有效值，不会被当成缺失。 */
export async function readConfigValue<T>(key: string): Promise<T | null> {
  const [row] = await db
    .select({ value: appConfig.value })
    .from(appConfig)
    .where(eq(appConfig.key, key))
    .limit(1);
  const wrapped = row?.value as { v?: T } | undefined;
  return wrapped?.v ?? null;
}

export async function writeConfigValue<T>(key: string, v: T): Promise<void> {
  await db
    .insert(appConfig)
    .values({ key, value: { v } as never })
    .onConflictDoUpdate({
      target: appConfig.key,
      set: { value: { v } as never, updatedAt: new Date() },
    });
}
