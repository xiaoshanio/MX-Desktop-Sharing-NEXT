import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { livekitNodes, roomNodes, rooms } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, conflict, json, notFound, readJson, parseOr400 } from "@/lib/http";
import { route } from "@/lib/api-route";
import { assertNodeUsable, getNodeById } from "@/lib/nodes";
import { requireMember, requireRoomOwner } from "@/lib/rooms";
import { addRoomNodeSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);
  const rows = await db
    .select({ binding: roomNodes, node: livekitNodes })
    .from(roomNodes)
    .innerJoin(livekitNodes, eq(livekitNodes.id, roomNodes.nodeId))
    .where(eq(roomNodes.roomId, roomCtx.room.id));
  const result = rows.map(({ binding, node }) => ({
      id: node.id,
      name: node.name,
      kind: node.kind,
      isPrimary: binding.isPrimary || node.id === roomCtx.room.nodeId,
      addedBy: binding.addedBy,
      isMine: node.ownerId === user.id,
    }));
  if (!result.some((node) => node.id === roomCtx.room.nodeId)) {
    result.unshift({ id: roomCtx.node.id, name: roomCtx.node.name, kind: roomCtx.node.kind, isPrimary: true, addedBy: roomCtx.room.ownerId, isMine: roomCtx.node.ownerId === user.id });
  }
  return json({ nodes: result });
});

export const POST = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);
  const input = await readJson(req, (raw) => parseOr400(addRoomNodeSchema, raw));
  const node = await getNodeById(input.nodeId);
  if (node.kind !== "builtin" && node.ownerId !== user.id) throw notFound("api.node.notFound");
  await assertNodeUsable(node, user);
  if (input.primary && roomCtx.room.ownerId !== user.id && user.role !== "admin") {
    throw badRequest("api.room.ownerOnly");
  }
  if (input.primary) {
    await db.update(roomNodes).set({ isPrimary: false }).where(eq(roomNodes.roomId, roomCtx.room.id));
    await db.update(rooms).set({ nodeId: node.id }).where(eq(rooms.id, roomCtx.room.id));
  }
  const inserted = await db
    .insert(roomNodes)
    .values({ roomId: roomCtx.room.id, nodeId: node.id, addedBy: user.id, isPrimary: input.primary })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) throw conflict("api.node.duplicate");
  audit({ actorId: user.id, roomId: roomCtx.room.id, action: "room.node.add", detail: { nodeId: node.id, primary: input.primary } });
  return json({ ok: true, node: { id: node.id, name: node.name, kind: node.kind, isPrimary: input.primary } }, { status: 201 });
});

export const PATCH = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);
  const input = await readJson(req, (raw) => parseOr400(addRoomNodeSchema, raw));
  let updated = await db.select().from(roomNodes).where(and(eq(roomNodes.roomId, roomCtx.room.id), eq(roomNodes.nodeId, input.nodeId))).limit(1);
  if (updated.length === 0 && input.nodeId === roomCtx.room.nodeId) {
    updated = await db.insert(roomNodes).values({ roomId: roomCtx.room.id, nodeId: input.nodeId, addedBy: roomCtx.room.ownerId, isPrimary: true }).returning();
  }
  if (updated.length === 0) throw notFound("api.node.notFound");
  await db.update(roomNodes).set({ isPrimary: false }).where(eq(roomNodes.roomId, roomCtx.room.id));
  await db.update(roomNodes).set({ isPrimary: true }).where(eq(roomNodes.id, updated[0]!.id));
  await db.update(rooms).set({ nodeId: input.nodeId }).where(eq(rooms.id, roomCtx.room.id));
  return json({ ok: true });
});

export const DELETE = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);
  const nodeId = new URL(req.url).searchParams.get("nodeId");
  if (!nodeId) throw badRequest("api.node.notFound");
  const [binding] = await db.select().from(roomNodes).where(and(eq(roomNodes.roomId, roomCtx.room.id), eq(roomNodes.nodeId, nodeId))).limit(1);
  if (!binding) throw notFound("api.node.notFound");
  if (binding.addedBy !== user.id && roomCtx.room.ownerId !== user.id && user.role !== "admin") throw badRequest("api.room.ownerOnly");
  if (binding.isPrimary || nodeId === roomCtx.room.nodeId) throw badRequest("api.room.ownerOnly");
  await db.delete(roomNodes).where(eq(roomNodes.id, binding.id));
  return json({ ok: true });
});
