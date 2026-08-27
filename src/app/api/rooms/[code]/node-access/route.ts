import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { nodeAccessGrants, roomNodes, roomMembers, users, livekitNodes } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, conflict, json, notFound, readJson, parseOr400 } from "@/lib/http";
import { route } from "@/lib/api-route";
import { requireMember, requireRoomOwner } from "@/lib/rooms";
import { grantNodeAccessSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireMember(code, user);
  const rows = await db.select({ grant: nodeAccessGrants, nodeName: livekitNodes.name, email: users.email, displayName: users.displayName })
    .from(nodeAccessGrants)
    .innerJoin(livekitNodes, eq(livekitNodes.id, nodeAccessGrants.nodeId))
    .innerJoin(users, eq(users.id, nodeAccessGrants.userId))
    .where(eq(nodeAccessGrants.roomId, roomCtx.room.id));
  return json({ grants: rows.map((r) => ({ id: r.grant.id, nodeId: r.grant.nodeId, nodeName: r.nodeName, userId: r.grant.userId, email: r.email, displayName: r.displayName })) });
});

export const POST = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);
  const input = await readJson(req, (raw) => parseOr400(grantNodeAccessSchema, raw));
  const [bound] = await db.select().from(roomNodes).where(and(eq(roomNodes.roomId, roomCtx.room.id), eq(roomNodes.nodeId, input.nodeId))).limit(1);
  if (!bound && input.nodeId !== roomCtx.room.nodeId) throw badRequest("api.node.notFound");
  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);
  if (!target) throw notFound("api.members.notMember");
  const [member] = await db.select().from(roomMembers).where(and(eq(roomMembers.roomId, roomCtx.room.id), eq(roomMembers.userId, input.userId))).limit(1);
  if (!member) throw notFound("api.members.notMember");
  const inserted = await db.insert(nodeAccessGrants).values({ roomId: roomCtx.room.id, nodeId: input.nodeId, userId: input.userId, grantedBy: user.id }).onConflictDoNothing().returning();
  if (!inserted.length) throw conflict("api.node.duplicate");
  audit({ actorId: user.id, roomId: roomCtx.room.id, action: "node.access.grant", detail: input });
  return json({ ok: true, grant: inserted[0] }, { status: 201 });
});

export const DELETE = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);
  const url = new URL(req.url);
  const nodeId = url.searchParams.get("nodeId");
  const userId = url.searchParams.get("userId");
  if (!nodeId || !userId) throw badRequest("api.node.notFound");
  await db.delete(nodeAccessGrants).where(and(eq(nodeAccessGrants.roomId, roomCtx.room.id), eq(nodeAccessGrants.nodeId, nodeId), eq(nodeAccessGrants.userId, userId)));
  return json({ ok: true });
});
