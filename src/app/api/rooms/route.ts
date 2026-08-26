import { eq } from "drizzle-orm";

import { db } from "@/db";
import { roomMembers, rooms } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, conflict, json, readJson, route, parseOr400 } from "@/lib/http";
import { ensureRoom } from "@/lib/livekit";
import { assertNodeUsable, createNode, getBuiltinNode, getNodeById, resolve } from "@/lib/nodes";
import { generateRoomCode, listRoomsForUser } from "@/lib/rooms";
import { createRoomSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = route(async () => {
  const user = await requireUser();
  const rows = await listRoomsForUser(user.id);
  return json({
    rooms: rows.map((r) => ({
      id: r.room.id,
      code: r.room.code,
      name: r.room.name,
      isActive: r.room.isActive,
      role: r.role,
      nodeName: r.nodeName,
      nodeKind: r.nodeKind,
      memberCount: r.memberCount,
      onlineCount: r.onlineCount,
      createdAt: r.room.createdAt.toISOString(),
    })),
  });
});

/**
 * 建房。节点来源三选一，优先级从上到下：
 *   1. newNode  —— 建房时现场接一套自己的 LiveKit Cloud 凭据
 *   2. nodeId   —— 复用一个已接入 / 已开放的节点
 *   3. 都不给   —— 落到内置节点（前提：管理员开了 allowPublic）
 */
export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await readJson(req, (raw) => parseOr400(createRoomSchema, raw));

  // 1) 决定节点
  let node;
  if (input.newNode) {
    node = await createNode({
      name: input.newNode.name,
      wsUrl: input.newNode.wsUrl,
      apiKey: input.newNode.apiKey,
      apiSecret: input.newNode.apiSecret,
      ownerId: user.id,
      kind: "user",
    });
    audit({ actorId: user.id, action: "node.create", detail: { nodeId: node.id, via: "room" } });
  } else if (input.nodeId) {
    node = await getNodeById(input.nodeId);
  } else {
    const builtin = await getBuiltinNode();
    if (!builtin) throw badRequest("未指定节点，且本站没有内置节点可用");
    node = builtin;
  }

  await assertNodeUsable(node, user);

  // 2) 生成不撞的房间码（同时就是 LiveKit room name）
  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const [dup] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(eq(rooms.code, code))
      .limit(1);
    if (!dup) break;
    if (attempt === 4) throw conflict("房间码生成冲突，请重试");
    code = generateRoomCode();
  }

  // 3) 先在 LiveKit 侧把房建出来，这样客户端 token 不需要 roomCreate 权限
  await ensureRoom(await resolve(node), code);

  // 4) 落库 + 把房主写进成员表
  const [room] = await db
    .insert(rooms)
    .values({
      code,
      name: input.name,
      ownerId: user.id,
      nodeId: node.id,
      viewerCanPublish: input.viewerCanPublish,
      tokenTtlSeconds: input.tokenTtlSeconds,
    })
    .returning();

  await db.insert(roomMembers).values({ roomId: room!.id, userId: user.id, role: "owner" });

  audit({
    actorId: user.id,
    roomId: room!.id,
    action: "room.create",
    detail: { code, nodeId: node.id, nodeKind: node.kind },
  });

  return json(
    {
      room: {
        id: room!.id,
        code: room!.code,
        name: room!.name,
        node: { id: node.id, name: node.name, kind: node.kind },
      },
    },
    { status: 201 },
  );
});
