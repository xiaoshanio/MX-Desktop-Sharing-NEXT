import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, json, route } from "@/lib/http";
import { ensureRoom, mintJoinToken } from "@/lib/livekit";
import { resolve } from "@/lib/nodes";
import { canPublish, requireMember } from "@/lib/rooms";

export const runtime = "nodejs";

/**
 * 签发 join token。
 *
 * 这是整套鉴权的收口：requireMember 不通过就拿不到 token，拿不到 token 就连不上 room，
 * 连不上 room 就订阅不到任何 track。「未进入房间的人看不到画面」由协议层保证。
 */
export const POST = route(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;

  const roomCtx = await requireMember(code, user);
  if (!roomCtx.room.isActive) throw badRequest("房间已关闭");
  if (!roomCtx.node.isEnabled) throw badRequest("该房间所在节点已停用");

  const node = resolve(roomCtx.node);
  // 房间可能被 LiveKit 的 emptyTimeout 回收掉了，签 token 前补一次
  await ensureRoom(node, roomCtx.room.code);

  const grant = await mintJoinToken(node, {
    identity: user.id,
    name: user.displayName,
    roomName: roomCtx.room.code,
    canPublish: canPublish(roomCtx, user),
    ttlSeconds: roomCtx.room.tokenTtlSeconds,
  });

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: "room.token.issue",
    detail: { canPublish: canPublish(roomCtx, user) },
  });

  return json(grant);
});
