import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { roomBans, roomIngress, roomMembers, roomPresence, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, conflict, json, notFound, readJson, parseOr400 } from "@/lib/http";
import { route } from "@/lib/api-route";
import { accentFor } from "@/lib/identity";
import { deleteIngress, removeParticipant, setParticipantPublish } from "@/lib/livekit";
import { resolve } from "@/lib/nodes";
import { assertNotBanned, requireMember, requireRoomOwner } from "@/lib/rooms";
import { addMemberSchema, updateMemberSchema } from "@/lib/validation";

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
      cardAccent: users.cardAccent,
      avatarUpdatedAt: users.avatarUpdatedAt,
      bannerUpdatedAt: users.bannerUpdatedAt,
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
      cardAccent: accentFor(r.userId, r.cardAccent),
      avatarAt: r.avatarUpdatedAt?.toISOString() ?? null,
      bannerAt: r.bannerUpdatedAt?.toISOString() ?? null,
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
  if (!target) throw notFound("api.members.emailNotRegistered");
  if (target.isDisabled) throw badRequest("api.members.accountDisabled");

  // 拉黑过的人不能靠「加成员」绕回来 —— 房主得先显式解除拉黑
  await assertNotBanned(roomCtx.room.id, target.id);

  const inserted = await db
    .insert(roomMembers)
    .values({ roomId: roomCtx.room.id, userId: target.id, role: input.role })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) throw conflict("api.members.alreadyMember");

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
 * 改成员权限（右键成员卡片 → 权限）。
 *
 * 两件事都要做：
 *   1. 改成员表 —— 决定**下一次**签 token 时给不给发布权限；
 *   2. UpdateParticipant —— 对**当前**连接立即生效。
 *
 * 只做第一件的话，被降权的人手里那张 token 在过期前仍然能继续推流，
 * 房主会看到「我把他改成仅观看了，画面还在」。反过来只做第二件则会在
 * 下次续签时被打回原状（RoomClient 每 6 小时会自动续签）。
 *
 * 房主本人的角色不允许在这里改 —— 转让房主是另一件事，别混在权限开关里。
 */
export const PATCH = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);
  const input = await readJson(req, (raw) => parseOr400(updateMemberSchema, raw));

  if (input.userId === roomCtx.room.ownerId) throw badRequest("api.members.cantChangeOwner");

  const updated = await db
    .update(roomMembers)
    .set({ role: input.role })
    .where(and(eq(roomMembers.roomId, roomCtx.room.id), eq(roomMembers.userId, input.userId)))
    .returning();
  if (updated.length === 0) throw notFound("api.members.notMember");

  const canPublish = input.role === "publisher";
  const node = await resolve(roomCtx.node);
  // 人不在线时 UpdateParticipant 会 404，那是正常的 —— 成员表已经改好，下次进来就是新权限
  await setParticipantPublish(node, roomCtx.room.code, input.userId, canPublish).catch(() => {});

  // 降权时顺手掐掉他的 OBS：那条路绕过浏览器权限，光改 participant 权限管不到它
  if (!canPublish) {
    await removeParticipant(node, roomCtx.room.code, `obs:${input.userId}`).catch(() => {});
  }

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: "member.role",
    detail: { targetId: input.userId, role: input.role },
  });

  return json({ ok: true, role: input.role });
});

/**
 * 踢人。三件事必须一起做，否则踢不干净：
 *   1. 删成员行 —— 之后再也签不出新 token
 *   2. RemoveParticipant —— 断掉当前连接（旧 token 在过期前仍然有效）
 *   3. 删他的 ingress —— 否则他的 OBS 还能继续往房里推
 *
 * `?ban=1` 时再加一条：写进房间黑名单。不加这一条的话，对方手上任何一条还有效的
 * 邀请链接都能让他立刻自己走回来 —— 踢人就变成了纯粹的仪式。
 */
export const DELETE = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);

  const url = new URL(req.url);
  const targetId = url.searchParams.get("userId");
  const ban = url.searchParams.get("ban") === "1";
  const reason = url.searchParams.get("reason")?.slice(0, 200) ?? null;

  if (!targetId) throw badRequest("api.members.missingUserId");
  if (targetId === roomCtx.room.ownerId) throw badRequest("api.members.cantRemoveOwner");

  const removed = await db
    .delete(roomMembers)
    .where(and(eq(roomMembers.roomId, roomCtx.room.id), eq(roomMembers.userId, targetId)))
    .returning();
  if (removed.length === 0) throw notFound("api.members.notMember");

  if (ban) {
    // 先写黑名单再断连接：万一后面几步失败，至少他回不来
    await db
      .insert(roomBans)
      .values({ roomId: roomCtx.room.id, userId: targetId, bannedBy: user.id, reason })
      .onConflictDoNothing();
  }

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
    action: ban ? "member.ban" : "member.remove",
    detail: { targetId, reason },
  });

  return json({ ok: true, banned: ban });
});
