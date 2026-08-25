import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { roomIngress } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, conflict, json, notFound, route } from "@/lib/http";
import { createWhipIngress, deleteIngress, ensureRoom } from "@/lib/livekit";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { resolve } from "@/lib/nodes";
import { canPublish, requireMember } from "@/lib/rooms";

export const runtime = "nodejs";

const activeFilter = (roomId: string, userId: string) =>
  and(
    eq(roomIngress.roomId, roomId),
    eq(roomIngress.userId, userId),
    isNull(roomIngress.revokedAt),
  );

/** 取回自己在这个房间的 WHIP 推流地址（含 stream key，仅本人可见）。 */
export const GET = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);

  const [row] = await db.select().from(roomIngress).where(activeFilter(roomCtx.room.id, user.id)).limit(1);
  if (!row) throw notFound("还没有为你生成推流地址");

  return json({
    ingress: {
      id: row.id,
      // OBS: Settings → Stream → Service = WHIP
      server: row.whipUrl,
      bearerToken: decryptSecret(row.streamKeyEnc),
      participantIdentity: row.participantIdentity,
      createdAt: row.createdAt.toISOString(),
    },
  });
});

/**
 * 为「当前用户 + 当前房间」生成独立的 WHIP 推流地址，天然一人一地址。
 * 已存在则直接返回，除非 ?rotate=1。
 */
export const POST = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);

  if (!roomCtx.room.isActive) throw badRequest("房间已关闭");
  if (!canPublish(roomCtx, user)) throw badRequest("你在这个房间没有推流权限");

  const caps = roomCtx.node.capabilities as { ingress?: boolean } | null;
  if (caps && caps.ingress === false) {
    throw badRequest("该节点的 Ingress 不可用（未开启或额度已满），无法生成 OBS 推流地址");
  }

  const node = await resolve(roomCtx.node);
  const rotate = new URL(req.url).searchParams.get("rotate") === "1";

  const [existing] = await db
    .select()
    .from(roomIngress)
    .where(activeFilter(roomCtx.room.id, user.id))
    .limit(1);

  if (existing && !rotate) {
    return json({
      ingress: {
        id: existing.id,
        server: existing.whipUrl,
        bearerToken: decryptSecret(existing.streamKeyEnc),
        participantIdentity: existing.participantIdentity,
        reused: true,
      },
    });
  }

  if (existing && rotate) {
    await deleteIngress(node, existing.ingressId).catch(() => {});
    await db
      .update(roomIngress)
      .set({ revokedAt: new Date() })
      .where(eq(roomIngress.id, existing.id));
  }

  await ensureRoom(node, roomCtx.room.code);

  // identity 里带 obs: 前缀，webhook 侧可据此区分是推流端还是观众
  const identity = `obs:${user.id}`;
  const info = await createWhipIngress(node, {
    roomName: roomCtx.room.code,
    identity,
    displayName: `${user.displayName} (OBS)`,
  });

  if (!info.url || !info.streamKey) {
    throw conflict("LiveKit 未返回 WHIP 地址，请检查该项目的 Ingress 是否可用");
  }

  const [row] = await db
    .insert(roomIngress)
    .values({
      roomId: roomCtx.room.id,
      userId: user.id,
      ingressId: info.ingressId,
      participantIdentity: identity,
      whipUrl: info.url,
      streamKeyEnc: encryptSecret(info.streamKey),
    })
    .returning();

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: rotate ? "ingress.rotate" : "ingress.create",
    detail: { ingressId: info.ingressId, transcoding: false },
  });

  return json(
    {
      ingress: {
        id: row!.id,
        server: info.url,
        bearerToken: info.streamKey,
        participantIdentity: identity,
        reused: false,
      },
    },
    { status: 201 },
  );
});

/** 撤销自己的推流地址。 */
export const DELETE = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);

  const [row] = await db
    .select()
    .from(roomIngress)
    .where(activeFilter(roomCtx.room.id, user.id))
    .limit(1);
  if (!row) throw notFound("没有可撤销的推流地址");

  await deleteIngress(await resolve(roomCtx.node), row.ingressId).catch(() => {});
  await db.update(roomIngress).set({ revokedAt: new Date() }).where(eq(roomIngress.id, row.id));

  audit({ actorId: user.id, roomId: roomCtx.room.id, action: "ingress.revoke" });
  return json({ ok: true });
});
