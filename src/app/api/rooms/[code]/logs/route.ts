import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { json, route } from "@/lib/http";
import { requireMember } from "@/lib/rooms";

export const runtime = "nodejs";

/** 房间审计日志。房主/管理员可查；普通成员只能看自己房间的操作记录。 */
export const GET = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);

  const limit = Math.min(200, Number(new URL(req.url).searchParams.get("limit") ?? 50));

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      detail: auditLogs.detail,
      createdAt: auditLogs.createdAt,
      actorName: users.displayName,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(eq(auditLogs.roomId, roomCtx.room.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return json({
    logs: rows.map((r) => ({
      id: r.id,
      action: r.action,
      actor: r.actorName,
      detail: r.detail,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});
