import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { livekitNodes, roomNodes, rooms } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { json, readJson, parseOr400 } from "@/lib/http";
import { route } from "@/lib/api-route";
import { createNode, toSummary } from "@/lib/nodes";
import { webhookUrlFor } from "@/lib/url";
import { createNodeSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** 列出「我能用」的节点：自己接的 + 开放的内置节点（管理员看到全部内置）。 */
export const GET = route(async (req) => {
  const user = await requireUser();

  const rows = await db
    .select()
    .from(livekitNodes)
    .where(
      or(
        eq(livekitNodes.ownerId, user.id),
        user.role === "admin"
          ? eq(livekitNodes.kind, "builtin")
          : and(
              eq(livekitNodes.kind, "builtin"),
              eq(livekitNodes.allowPublic, true),
              eq(livekitNodes.isEnabled, true),
            ),
      ),
    )
    .orderBy(desc(livekitNodes.createdAt));

  const bindings = await db.select({ nodeId: roomNodes.nodeId, code: rooms.code, name: rooms.name, isPrimary: roomNodes.isPrimary }).from(roomNodes).innerJoin(rooms, eq(rooms.id, roomNodes.roomId));
  return json({
    nodes: rows.map((n) => ({
      ...toSummary(n, user.id),
      // 每个节点的回调地址都不同：验签要用该节点自己的密钥
      webhookUrl: webhookUrlFor(req, n.id),
      bindings: bindings.filter((b) => b.nodeId === n.id).map(({ code, name, isPrimary }) => ({ code, name, isPrimary })),
    })),
  });
});

/** 普通用户接入自己的 LiveKit Cloud 项目（会先体检凭据）。 */
export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await readJson(req, (raw) => parseOr400(createNodeSchema, raw));

  const node = await createNode({
    name: input.name,
    wsUrl: input.wsUrl,
    apiKey: input.apiKey,
    apiSecret: input.apiSecret,
    ownerId: user.id,
    kind: "user",
  });

  audit({ actorId: user.id, action: "node.create", detail: { nodeId: node.id, wsUrl: node.wsUrl } });
  return json(
    { node: toSummary(node, user.id), webhookUrl: webhookUrlFor(req, node.id) },
    { status: 201 },
  );
});
