import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { syncPlayers, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, json, parseOr400, readJson, route } from "@/lib/http";
import { requireMember, requireRoomOwner } from "@/lib/rooms";
import { createSyncPlayerSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** 一个房间同时最多几个同步播放器。多了没有意义，只会把带宽和注意力都摊薄。 */
const MAX_OPEN_PER_ROOM = 3;

/** 房间里当前开着的同步播放器。房间成员都能看。 */
export const GET = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);

  const rows = await db
    .select({
      id: syncPlayers.id,
      name: syncPlayers.name,
      sourceUrl: syncPlayers.sourceUrl,
      createdBy: syncPlayers.createdBy,
      createdAt: syncPlayers.createdAt,
      creatorName: users.displayName,
    })
    .from(syncPlayers)
    .innerJoin(users, eq(users.id, syncPlayers.createdBy))
    .where(and(eq(syncPlayers.roomId, roomCtx.room.id), isNull(syncPlayers.closedAt)))
    .orderBy(asc(syncPlayers.createdAt));

  return json({
    players: rows.map((r) => ({
      id: r.id,
      name: r.name,
      sourceUrl: r.sourceUrl,
      createdBy: r.createdBy,
      creatorName: r.creatorName,
      createdAt: r.createdAt.toISOString(),
      /** 谁是「房主」（同步的时钟基准）由前端据此判断 */
      isMine: r.createdBy === user.id,
    })),
  });
});

/**
 * 建一个同步播放器。只有房主/管理员能建。
 *
 * 建者同时是同步的时钟基准（见 lib/sync-protocol.ts）：他的播放进度是权威的，
 * 其他人向他对齐。所以「谁能建」等于「谁能控制大家一起看什么」，得卡在房主这一级。
 */
export const POST = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);
  const input = await readJson(req, (raw) => parseOr400(createSyncPlayerSchema, raw));

  if (!roomCtx.room.isActive) throw badRequest("房间已关闭");

  const open = await db
    .select({ id: syncPlayers.id })
    .from(syncPlayers)
    .where(and(eq(syncPlayers.roomId, roomCtx.room.id), isNull(syncPlayers.closedAt)));
  if (open.length >= MAX_OPEN_PER_ROOM) {
    throw badRequest(`一个房间最多同时开 ${MAX_OPEN_PER_ROOM} 个同步播放器，先关掉一个再建。`);
  }

  const [created] = await db
    .insert(syncPlayers)
    .values({ roomId: roomCtx.room.id, name: input.name, createdBy: user.id })
    .returning();

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: "sync.create",
    detail: { playerId: created!.id, name: input.name },
  });

  return json(
    {
      player: {
        id: created!.id,
        name: created!.name,
        sourceUrl: null,
        createdBy: user.id,
        creatorName: user.displayName,
        createdAt: created!.createdAt.toISOString(),
        isMine: true,
      },
    },
    { status: 201 },
  );
});
