import { and, count, desc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { livekitNodes, rooms, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { badRequest, json, readJson, route, parseOr400 } from "@/lib/http";
import { adminUpdateNodeSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** 管理员总览：所有节点（含房间数）+ 所有用户。 */
export const GET = route(async () => {
  await requireAdmin();

  const nodeRows = await db.select().from(livekitNodes).orderBy(desc(livekitNodes.createdAt));

  const counts = await db
    .select({ nodeId: rooms.nodeId, n: count() })
    .from(rooms)
    .where(eq(rooms.isActive, true))
    .groupBy(rooms.nodeId);
  const countByNode = new Map(counts.map((c) => [c.nodeId, Number(c.n)]));

  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isDisabled: users.isDisabled,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return json({
    nodes: nodeRows.map((n) => ({
      id: n.id,
      name: n.name,
      kind: n.kind,
      wsUrl: n.wsUrl,
      isEnabled: n.isEnabled,
      allowPublic: n.allowPublic,
      maxRooms: n.maxRooms,
      ownerId: n.ownerId,
      activeRooms: countByNode.get(n.id) ?? 0,
      lastCheckOk: n.lastCheckOk,
      lastCheckError: n.lastCheckError,
      capabilities: n.capabilities,
    })),
    users: userRows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
  });
});

/** 改内置节点的开放策略 / 房间上限 / 启停，或把某个节点提升为内置节点。 */
export const PATCH = route(async (req) => {
  const admin = await requireAdmin();
  const nodeId = new URL(req.url).searchParams.get("nodeId");
  if (!nodeId) throw badRequest("缺少 nodeId");

  const input = await readJson(req, (raw) => parseOr400(adminUpdateNodeSchema, raw));
  const patch: Record<string, unknown> = {};
  if (input.isEnabled !== undefined) patch.isEnabled = input.isEnabled;
  if (input.allowPublic !== undefined) patch.allowPublic = input.allowPublic;
  if (input.maxRooms !== undefined) patch.maxRooms = input.maxRooms;

  if (input.makeBuiltin === true) {
    // 全站只允许一个内置节点：先把现有的降回普通节点
    await db
      .update(livekitNodes)
      .set({ kind: "user", allowPublic: false })
      .where(and(eq(livekitNodes.kind, "builtin"), ne(livekitNodes.id, nodeId)));
    patch.kind = "builtin";
    // 提升为内置的目的就是共享，默认顺手开放
    if (input.allowPublic === undefined) patch.allowPublic = true;
  }

  if (Object.keys(patch).length === 0) throw badRequest("没有要修改的字段");

  const updated = await db
    .update(livekitNodes)
    .set(patch)
    .where(eq(livekitNodes.id, nodeId))
    .returning({ id: livekitNodes.id });
  if (updated.length === 0) throw badRequest("节点不存在");

  audit({ actorId: admin.id, action: "admin.node.update", detail: { nodeId, ...patch } });
  return json({ ok: true });
});
