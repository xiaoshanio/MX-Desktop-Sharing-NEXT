import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { roomIngress, roomMembers, roomPresence, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, conflict, json, notFound, readJson, route, parseOr400 } from "@/lib/http";
import { deleteIngress, removeParticipant } from "@/lib/livekit";
import { resolve } from "@/lib/nodes";
import { requireMember, requireRoomOwner } from "@/lib/rooms";
import { addMemberSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** 成员列表 + 在线状态（在线状态来自 webhook 落库，不是轮询 LiveKit）。 */
export const GET = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      role: roomMembers.role,
      joinedAt: roomMembers.createdAt,
      isOnline: roomPresence.isOnline,
    })
    .from(roomMembers)
    .innerJoin(users, eq(users.id, roomMembers.userId))
    .leftJoin(
      roomPresence,
      and(
        eq(roomPresence.roomId, roomMembers.roomId),
        eq(roomPresence.identity, sql`${roomMembers.userId}::text`),
      ),
    )
    .where(eq(roomMembers.roomId, roomCtx.room.id));

  return json({
    members: rows.map((r) => ({
      userId: r.userId,
      email: r.email,
      displayName: r.displayName,
      role: r.role,
      isOnline: r.isOnline ?? false,
      joinedAt: r.joinedAt.toISOString(),
    })),
  });
});

/** 拉人进房。不在成员表里的人签不出 token，所以这一步就是授权本身。 */
export const POST = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);
  const input = await readJson(req, (raw) => parseOr400(addMemberSchema, raw));

  const [target] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${input.email}`)
    .limit(1);
  if (!target) throw notFound("该邮箱还没有注册本站账号");
  if (target.isDisabled) throw badRequest("该账号已被停用");

  const inserted = await db
    .insert(roomMembers)
    .values({ roomId: roomCtx.room.id, userId: target.id, role: input.role })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) throw conflict("该用户已经是房间成员");

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: "member.add",
    detail: { targetId: target.id, role: input.role },
  });

  return json(
    {
      member: {
        userId: target.id,
        email: target.email,
        displayName: target.displayName,
        role: input.role,
      },
    },
    { status: 201 },
  );
});

/**
 * 踢人。三件事必须一起做，否则踢不干净：
 *   1. 删成员行 —— 之后再也签不出新 token
 *   2. RemoveParticipant —— 断掉当前连接（旧 token 在过期前仍然有效）
 *   3. 删他的 ingress —— 否则他的 OBS 还能继续往房里推
 */
export const DELETE = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);

  const targetId = new URL(req.url).searchParams.get("userId");
  if (!targetId) throw badRequest("缺少 userId");
  if (targetId === roomCtx.room.ownerId) throw badRequest("不能移除房主");

  const removed = await db
    .delete(roomMembers)
    .where(and(eq(roomMembers.roomId, roomCtx.room.id), eq(roomMembers.userId, targetId)))
    .returning();
  if (removed.length === 0) throw notFound("该用户不是房间成员");

  const node = await resolve(roomCtx.node);
  await removeParticipant(node, roomCtx.room.code, targetId).catch(() => {});
  await removeParticipant(node, roomCtx.room.code, `obs:${targetId}`).catch(() => {});

  const ingressRows = await db
    .select()
    .from(roomIngress)
    .where(and(eq(roomIngress.roomId, roomCtx.room.id), eq(roomIngress.userId, targetId)));
  for (const row of ingressRows) {
    await deleteIngress(node, row.ingressId).catch(() => {});
  }
  await db
    .update(roomIngress)
    .set({ revokedAt: new Date() })
    .where(and(eq(roomIngress.roomId, roomCtx.room.id), eq(roomIngress.userId, targetId)));

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: "member.remove",
    detail: { targetId },
  });

  return json({ ok: true });
});
