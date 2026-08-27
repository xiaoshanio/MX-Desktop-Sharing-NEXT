import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json } from "@/lib/http";
import { route } from "@/lib/api-route";
import { accentFor, encodeParticipantMeta } from "@/lib/identity";
import { ensureRoom, mintJoinToken } from "@/lib/livekit";
import { resolve } from "@/lib/nodes";
import { canPublish, isBanned, requireMember } from "@/lib/rooms";

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
  if (!roomCtx.room.isActive) throw badRequest("api.token.roomClosed");
  if (!roomCtx.node.isEnabled) throw badRequest("api.token.nodeDisabled");

  /**
   * 黑名单也在这里守一道。
   *
   * 正常流程里被拉黑的人已经不在成员表里了，所以上面那关就拦住了。但两张表是分开的，
   * 中间可能出现「成员行还在、黑名单也有他」的状态（比如先手动加了成员又拉黑，
   * 或者某次删除只成功了一半）。既然这里是所有人拿画面的唯一入口，就在这里兜住 ——
   * 少一道检查的代价是被拉黑的人还能看。
   */
  if (await isBanned(roomCtx.room.id, user.id)) {
    throw forbidden("api.token.removed");
  }

  const node = await resolve(roomCtx.node);
  // 房间可能被 LiveKit 的 emptyTimeout 回收掉了，签 token 前补一次
  await ensureRoom(node, roomCtx.room.code);

  const publishable = canPublish(roomCtx, user);

  const grant = await mintJoinToken(node, {
    identity: user.id,
    name: user.displayName,
    roomName: roomCtx.room.code,
    canPublish: publishable,
    ttlSeconds: roomCtx.room.tokenTtlSeconds,
    // 房里的成员卡片靠这几个字段渲染，不用再为每个人查一次库
    metadata: encodeParticipantMeta({
      accent: accentFor(user.id, user.cardAccent),
      avatarAt: user.avatarUpdatedAt?.toISOString() ?? null,
      bannerAt: user.bannerUpdatedAt?.toISOString() ?? null,
    }),
  });

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: "room.token.issue",
    detail: { canPublish: publishable },
  });

  return json(grant);
});
