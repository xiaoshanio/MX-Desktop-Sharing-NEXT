import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { roomIngress, rooms, type LivekitNode, type Room } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { json, parseOr400, readJson, route } from "@/lib/http";
import { deleteIngress, removeParticipant } from "@/lib/livekit";
import { resolve } from "@/lib/nodes";
import { canPublish, requireMember, requireRoomOwner } from "@/lib/rooms";
import { updateRoomSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * 掐断这个房间所有还有效的 WHIP 推流。
 *
 * 两件事都要做，只做一件都关不干净：
 * - `DeleteIngress` 把 LiveKit 侧的 ingress 资源删掉，OBS 之后拿那个 stream key 也连不上来
 *   （光把库里的行标成 revoked 不会让 OBS 停 —— 密钥在 LiveKit 侧仍然有效）；
 * - `RemoveParticipant` 把 `obs:` 那个参与者踢出房间，房里的人立刻不再收到它的画面。
 *   文档没有明说 DeleteIngress 会不会顺带终止**正在进行**的会话，与其赌，不如补这一刀。
 *
 * 一条失败不影响其余的，所以每次调用单独 catch。
 */
async function revokeRoomIngress(node: LivekitNode, room: Room): Promise<number> {
  const active = and(eq(roomIngress.roomId, room.id), isNull(roomIngress.revokedAt));
  const rows = await db.select().from(roomIngress).where(active);
  if (rows.length === 0) return 0;

  const resolved = await resolve(node);
  for (const row of rows) {
    await deleteIngress(resolved, row.ingressId).catch(() => {});
    // room.code 就是 LiveKit 侧的 room name
    await removeParticipant(resolved, room.code, row.participantIdentity).catch(() => {});
  }
  await db.update(roomIngress).set({ revokedAt: new Date() }).where(active);
  return rows.length;
}

export const GET = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);

  return json({
    room: {
      id: roomCtx.room.id,
      code: roomCtx.room.code,
      name: roomCtx.room.name,
      isActive: roomCtx.room.isActive,
      isOwner: roomCtx.room.ownerId === user.id,
      myRole: roomCtx.membership?.role ?? (user.role === "admin" ? "admin" : "viewer"),
      canPublish: canPublish(roomCtx, user),
      viewerCanPublish: roomCtx.room.viewerCanPublish,
      obsEnabled: roomCtx.room.obsEnabled,
      createdAt: roomCtx.room.createdAt.toISOString(),
      // 只暴露节点的元信息，凭据永不出服务端
      node: {
        id: roomCtx.node.id,
        name: roomCtx.node.name,
        kind: roomCtx.node.kind,
        ingressAvailable:
          (roomCtx.node.capabilities as { ingress?: boolean } | null)?.ingress ?? null,
      },
    },
  });
});

/**
 * 房间设置。目前只有 OBS 直播闸门。
 *
 * 关掉不只是改个标志位 —— 同时把这个房间已生成的 WHIP 地址全部作废，否则「关闭了却还在推」。
 * 代价是重新打开后每个推流人要再点一次「生成推流地址」并在 OBS 里换 Bearer Token：
 * LiveKit 有 UpdateIngress(enabled=false) 这种不销毁密钥的软关，但 JS server SDK 的
 * updateIngress 没有把 enabled 透出来（它按固定字段表重建请求，多传会被丢掉），
 * 要用就得自己拼 Twirp 请求。宁可换密钥，也不要一个「看起来关了其实没关」的开关。
 */
export const PATCH = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);
  const input = await readJson(req, (raw) => parseOr400(updateRoomSchema, raw));

  if (input.obsEnabled === roomCtx.room.obsEnabled) {
    // 幂等：状态没变就不要白跑一趟 LiveKit
    return json({ ok: true, obsEnabled: input.obsEnabled, revoked: 0 });
  }

  const revoked = input.obsEnabled ? 0 : await revokeRoomIngress(roomCtx.node, roomCtx.room);

  await db
    .update(rooms)
    .set({ obsEnabled: input.obsEnabled })
    .where(eq(rooms.id, roomCtx.room.id));

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: input.obsEnabled ? "room.obs.enable" : "room.obs.disable",
    detail: { revoked },
  });

  return json({ ok: true, obsEnabled: input.obsEnabled, revoked });
});

/** 关闭房间：清掉所有 ingress，并把房间标为不活跃（之后签不出 token）。 */
export const DELETE = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);

  const revoked = await revokeRoomIngress(roomCtx.node, roomCtx.room);
  await db.update(rooms).set({ isActive: false }).where(eq(rooms.id, roomCtx.room.id));

  audit({ actorId: user.id, roomId: roomCtx.room.id, action: "room.close", detail: { revoked } });
  return json({ ok: true });
});
