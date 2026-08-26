import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  livekitNodes,
  roomBans,
  roomMembers,
  rooms,
  type LivekitNode,
  type Room,
  type RoomMember,
  type User,
} from "@/db/schema";
import { forbidden, notFound } from "./http";

export { generateRoomCode } from "./room-code";

export type RoomContext = {
  room: Room;
  node: LivekitNode;
  membership: RoomMember | null;
};

export async function loadRoomByCode(code: string): Promise<{ room: Room; node: LivekitNode }> {
  const [row] = await db
    .select({ room: rooms, node: livekitNodes })
    .from(rooms)
    .innerJoin(livekitNodes, eq(livekitNodes.id, rooms.nodeId))
    .where(eq(rooms.code, code))
    .limit(1);

  if (!row) throw notFound("房间不存在");
  return row;
}

export async function getMembership(
  roomId: string,
  userId: string,
): Promise<RoomMember | null> {
  const [row] = await db
    .select()
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .limit(1);
  return row ?? null;
}

/**
 * 取房间上下文并要求调用者是成员。
 * 所有签 token / 拿推流地址的接口都必须先过这一关。
 */
export async function requireMember(code: string, user: User): Promise<RoomContext> {
  const { room, node } = await loadRoomByCode(code);
  const membership = await getMembership(room.id, user.id);

  if (!membership && user.role !== "admin") {
    // 故意用 404 而不是 403：不让非成员探测房间是否存在
    throw notFound("房间不存在");
  }
  return { room, node, membership };
}

export async function requireRoomOwner(code: string, user: User): Promise<RoomContext> {
  const ctx = await requireMember(code, user);
  const isOwner = ctx.room.ownerId === user.id || ctx.membership?.role === "owner";
  if (!isOwner && user.role !== "admin") throw forbidden("只有房主可以做这个操作");
  return ctx;
}

/**
 * 这个人是不是被这个房间拉黑了。
 *
 * 黑名单和成员表是两道独立的门：删成员行只能把人踢到门外，
 * 而他手上那条邀请链接还能让他自己走回来。所以每一条「往房间里加人」的路径
 * （加成员、用邀请链接入房）都必须先过这一关。
 */
export async function isBanned(roomId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ userId: roomBans.userId })
    .from(roomBans)
    .where(and(eq(roomBans.roomId, roomId), eq(roomBans.userId, userId)))
    .limit(1);
  return row !== undefined;
}

export async function assertNotBanned(roomId: string, userId: string): Promise<void> {
  if (await isBanned(roomId, userId)) {
    throw forbidden("这个用户已被移入该房间的黑名单，需要先解除拉黑。");
  }
}

export function canPublish(ctx: RoomContext, user: User): boolean {
  if (ctx.room.ownerId === user.id) return true;
  if (ctx.membership?.role === "owner" || ctx.membership?.role === "publisher") return true;
  return ctx.room.viewerCanPublish;
}

export async function listRoomsForUser(userId: string) {
  return db
    .select({
      room: rooms,
      nodeName: livekitNodes.name,
      nodeKind: livekitNodes.kind,
      role: roomMembers.role,
    })
    .from(roomMembers)
    .innerJoin(rooms, eq(rooms.id, roomMembers.roomId))
    .innerJoin(livekitNodes, eq(livekitNodes.id, rooms.nodeId))
    .where(eq(roomMembers.userId, userId))
    .orderBy(desc(rooms.createdAt));
}
