import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { roomBans, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, json, notFound, route } from "@/lib/http";
import { requireRoomOwner } from "@/lib/rooms";

export const runtime = "nodejs";

/**
 * 房间黑名单。只有房主/管理员看得到 —— 谁被踢过属于房间的管理信息，
 * 没道理让每个观众都能查。
 */
export const GET = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);

  // 只 join 被拉黑的那个人。「是谁拉黑的」在审计日志里（member.ban），
  // 这里不为了显示一个操作者名字再多连一次表。
  const rows = await db
    .select({
      userId: roomBans.userId,
      email: users.email,
      displayName: users.displayName,
      reason: roomBans.reason,
      createdAt: roomBans.createdAt,
    })
    .from(roomBans)
    .innerJoin(users, eq(users.id, roomBans.userId))
    .where(eq(roomBans.roomId, roomCtx.room.id))
    .orderBy(desc(roomBans.createdAt));

  return json({
    bans: rows.map((r) => ({
      userId: r.userId,
      email: r.email,
      displayName: r.displayName,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

/**
 * 解除拉黑。只是把黑名单那一行删掉 —— **不会**自动把人加回成员表。
 * 解禁和重新邀请是两个决定，合成一步的话房主一点「解除」就等于又把人放进来了。
 */
export const DELETE = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);

  const targetId = new URL(req.url).searchParams.get("userId");
  if (!targetId) throw badRequest("缺少 userId");

  const removed = await db
    .delete(roomBans)
    .where(and(eq(roomBans.roomId, roomCtx.room.id), eq(roomBans.userId, targetId)))
    .returning();
  if (removed.length === 0) throw notFound("这个人不在黑名单里");

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: "member.unban",
    detail: { targetId },
  });

  return json({ ok: true });
});
