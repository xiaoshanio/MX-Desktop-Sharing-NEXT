import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { syncPlayers } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { forbidden, json, notFound, parseOr400, readJson, route } from "@/lib/http";
import { requireMember } from "@/lib/rooms";
import { updateSyncPlayerSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * 谁能动这个播放器：建它的人，或者房主/站点管理员。
 *
 * 换片源等于替所有人换台，所以不能让任意成员改。但也不能只允许房主 ——
 * 房主可以把播放器交给别人建（「你来放」），那个人得能自己选片。
 */
async function requireController(code: string, playerId: string) {
  const user = await requireUser();
  const roomCtx = await requireMember(code, user);

  const [player] = await db
    .select()
    .from(syncPlayers)
    .where(
      and(
        eq(syncPlayers.id, playerId),
        eq(syncPlayers.roomId, roomCtx.room.id),
        isNull(syncPlayers.closedAt),
      ),
    )
    .limit(1);

  // 用 404 而不是 403：房间成员没必要知道别的房间有没有这个 id
  if (!player) throw notFound("这个同步播放器不存在或已关闭");

  const allowed =
    player.createdBy === user.id ||
    roomCtx.room.ownerId === user.id ||
    roomCtx.membership?.role === "owner" ||
    user.role === "admin";
  if (!allowed) throw forbidden("只有创建者或房主能操作这个播放器");

  return { user, roomCtx, player };
}

/**
 * 换片源。
 *
 * 只把地址落库，**不碰播放进度** —— 进度由创建者的浏览器通过 LiveKit data channel
 * 直接广播（见 lib/sync-protocol.ts）。落库的这一份只是给「后进房的人」用的初始值，
 * 让他们在收到第一次心跳之前就能先开始加载片源。
 */
export const PATCH = route(
  async (req, ctx: { params: Promise<{ code: string; id: string }> }) => {
    const { code, id } = await ctx.params;
    const { user, roomCtx, player } = await requireController(code, id);
    const input = await readJson(req, (raw) => parseOr400(updateSyncPlayerSchema, raw));

    await db
      .update(syncPlayers)
      .set({ sourceUrl: input.sourceUrl, updatedAt: new Date() })
      .where(eq(syncPlayers.id, player.id));

    audit({
      actorId: user.id,
      roomId: roomCtx.room.id,
      action: "sync.source",
      // 地址本身记进日志：房主排查「谁放的什么」时这是唯一线索，且它不是密钥
      detail: { playerId: player.id, sourceUrl: input.sourceUrl },
    });

    return json({ ok: true, sourceUrl: input.sourceUrl });
  },
);

/** 关掉播放器。软删除，保留记录供审计。 */
export const DELETE = route(
  async (_req, ctx: { params: Promise<{ code: string; id: string }> }) => {
    const { code, id } = await ctx.params;
    const { user, roomCtx, player } = await requireController(code, id);

    await db
      .update(syncPlayers)
      .set({ closedAt: new Date(), updatedAt: new Date() })
      .where(eq(syncPlayers.id, player.id));

    audit({
      actorId: user.id,
      roomId: roomCtx.room.id,
      action: "sync.close",
      detail: { playerId: player.id },
    });

    return json({ ok: true });
  },
);
