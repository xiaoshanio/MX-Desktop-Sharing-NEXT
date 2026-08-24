import { timingSafeEqual } from "node:crypto";
import { lt } from "drizzle-orm";

import { db } from "@/db";
import { loginAttempts, sessions, webhookEvents } from "@/db/schema";
import { forbidden, json, route } from "@/lib/http";

export const runtime = "nodejs";

/**
 * Vercel Cron 会带 Authorization: Bearer $CRON_SECRET。
 * 没配 CRON_SECRET 就只允许 Vercel 内部调用标记，避免这个端点被公网随意触发。
 */
function assertCron(req: Request): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // 没配密钥时，只信任 Vercel 注入的 cron 标记
    if (req.headers.get("x-vercel-cron")) return;
    throw forbidden("未配置 CRON_SECRET，拒绝外部调用");
  }
  const provided = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw forbidden("凭据不正确");
}

/** 清理过期会话、旧的登录失败记录、旧的 webhook 去重记录。 */
export const GET = route(async (req) => {
  assertCron(req);
  const now = new Date();

  const expiredSessions = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .returning({ id: sessions.id });

  // 限流窗口只有 15 分钟，留 1 天足够排查
  const staleAttempts = await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.createdAt, new Date(now.getTime() - 24 * 3600_000)))
    .returning({ id: loginAttempts.id });

  // webhook 去重记录留 7 天，远超 LiveKit 的重试窗口
  const staleEvents = await db
    .delete(webhookEvents)
    .where(lt(webhookEvents.receivedAt, new Date(now.getTime() - 7 * 24 * 3600_000)))
    .returning({ id: webhookEvents.id });

  return json({
    ok: true,
    deleted: {
      sessions: expiredSessions.length,
      loginAttempts: staleAttempts.length,
      webhookEvents: staleEvents.length,
    },
  });
});
