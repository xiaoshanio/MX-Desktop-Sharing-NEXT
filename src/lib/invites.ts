import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { roomBans, roomInvites, roomMembers, rooms, type User } from "@/db/schema";
import { badRequest, forbidden, notFound } from "./http";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export function newInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, tokenHash: hash(token) };
}

type CreateInviteInput = {
  roomId: string;
  createdBy: string;
  role: "publisher" | "viewer";
  expiresInHours: number | null;
  maxUses: number | null;
};

export async function createInvite(input: CreateInviteInput) {
  const { token, tokenHash } = newInviteToken();
  const [row] = await db
    .insert(roomInvites)
    .values({
      roomId: input.roomId,
      tokenHash,
      role: input.role,
      createdBy: input.createdBy,
      expiresAt:
        input.expiresInHours === null
          ? null
          : new Date(Date.now() + input.expiresInHours * 3600_000),
      maxUses: input.maxUses,
    })
    .returning();

  // token 明文只在这里返回一次，之后库里只有 hash
  return { invite: row!, token };
}

/**
 * 凭邀请 token 入房。
 *
 * 用条件 UPDATE 原子地占用一次名额：把「校验 + 自增」放进一条语句，
 * 避免并发下 max_uses 被击穿（neon-http 没有交互式事务）。
 */
export async function redeemInvite(token: string, user: User) {
  const tokenHash = hash(token);

  /**
   * 先只读地摸一下这条邀请指向哪个房间，为的是在**占用名额之前**判黑名单。
   *
   * 顺序反过来的话，被拉黑的人每点一次链接都会白烧掉一次使用名额 ——
   * 一条限 5 次的邀请链接会被他自己点没，房主完全看不出发生了什么。
   *
   * 这一读和下面的原子占用之间存在极小的竞态（读完之后那一刻才被拉黑），
   * 不去消除它：真正的兜底在签 token 那一步（见 api/rooms/[code]/token），
   * 那里过不去就拿不到任何画面。这里只是为了不浪费名额和给出准确的报错。
   */
  const [peek] = await db
    .select({ roomId: roomInvites.roomId })
    .from(roomInvites)
    .where(eq(roomInvites.tokenHash, tokenHash))
    .limit(1);

  if (peek) {
    const [banned] = await db
      .select({ userId: roomBans.userId })
      .from(roomBans)
      .where(and(eq(roomBans.roomId, peek.roomId), eq(roomBans.userId, user.id)))
      .limit(1);
    if (banned) throw forbidden("你已被移出这个房间，邀请链接对你无效。");
  }

  const claimed = await db
    .update(roomInvites)
    .set({ useCount: sql`${roomInvites.useCount} + 1` })
    .where(
      and(
        eq(roomInvites.tokenHash, tokenHash),
        isNull(roomInvites.revokedAt),
        or(isNull(roomInvites.expiresAt), gt(roomInvites.expiresAt, new Date())),
        or(isNull(roomInvites.maxUses), sql`${roomInvites.useCount} < ${roomInvites.maxUses}`),
      ),
    )
    .returning();

  const invite = claimed[0];
  if (!invite) {
    // 分不清是「不存在」还是「已过期/用完」——对外统一话术，不给探测空间
    throw notFound("邀请链接无效或已失效");
  }

  const [room] = await db.select().from(rooms).where(eq(rooms.id, invite.roomId)).limit(1);
  if (!room) throw notFound("房间不存在");
  if (!room.isActive) throw badRequest("房间已关闭");

  // 已经是成员就直接放行，不重复写、也不算浪费一次名额之外的副作用
  await db
    .insert(roomMembers)
    .values({ roomId: room.id, userId: user.id, role: invite.role })
    .onConflictDoNothing();

  return { room, invite };
}

export async function listInvites(roomId: string) {
  return db.select().from(roomInvites).where(eq(roomInvites.roomId, roomId));
}

export async function revokeInvite(inviteId: string, roomId: string) {
  const revoked = await db
    .update(roomInvites)
    .set({ revokedAt: new Date() })
    .where(and(eq(roomInvites.id, inviteId), eq(roomInvites.roomId, roomId)))
    .returning();
  if (revoked.length === 0) throw notFound("邀请不存在");
}
