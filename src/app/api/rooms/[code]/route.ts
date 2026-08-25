import { eq } from "drizzle-orm";

import { db } from "@/db";
import { roomIngress, rooms } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { json, route } from "@/lib/http";
import { deleteIngress } from "@/lib/livekit";
import { resolve } from "@/lib/nodes";
import { canPublish, requireMember, requireRoomOwner } from "@/lib/rooms";

export const runtime = "nodejs";

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

/** 关闭房间：清掉所有 ingress，并把房间标为不活跃（之后签不出 token）。 */
export const DELETE = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);

  const node = await resolve(roomCtx.node);
  const ingressRows = await db
    .select()
    .from(roomIngress)
    .where(eq(roomIngress.roomId, roomCtx.room.id));

  for (const row of ingressRows) {
    if (row.revokedAt) continue;
    await deleteIngress(node, row.ingressId).catch(() => {});
  }
  await db
    .update(roomIngress)
    .set({ revokedAt: new Date() })
    .where(eq(roomIngress.roomId, roomCtx.room.id));

  await db.update(rooms).set({ isActive: false }).where(eq(rooms.id, roomCtx.room.id));

  audit({ actorId: user.id, roomId: roomCtx.room.id, action: "room.close" });
  return json({ ok: true });
});
