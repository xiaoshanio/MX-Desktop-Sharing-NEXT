import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { roomPresence, rooms, webhookEvents } from "@/db/schema";
import { audit } from "@/lib/audit";
import { json, route } from "@/lib/http";
import { webhookReceiver } from "@/lib/livekit";
import { getNodeById, resolve } from "@/lib/nodes";

export const runtime = "nodejs";

/**
 * LiveKit webhook 接收端。
 *
 * 为什么路径里要带 nodeId：webhook 的签名是用发送方那套 api key/secret 签的，
 * 多节点下必须先知道是哪个节点发来的，才能选对 secret 去验签。所以每个节点在
 * LiveKit 控制台配自己的回调地址：
 *   {NEXT_PUBLIC_APP_URL}/api/webhooks/livekit/{nodeId}
 */
export const POST = route(async (req, ctx: { params: Promise<{ nodeId: string }> }) => {
  const { nodeId } = await ctx.params;

  const auth = req.headers.get("authorization");
  if (!auth) return json({ error: "missing_authorization" }, { status: 401 });

  const node = await getNodeById(nodeId);
  const raw = await req.text();

  let event;
  try {
    // receive() 会校验 JWT 签名和 body 的 sha256，验不过直接抛
    event = await webhookReceiver(await resolve(node)).receive(raw, auth);
  } catch (err) {
    console.warn("[webhook] 验签失败", nodeId, err);
    return json({ error: "invalid_signature" }, { status: 401 });
  }

  const roomName = event.room?.name;
  const identity = event.participant?.identity;

  if (!roomName) return json({ ok: true, ignored: event.event });

  // 去重：LiveKit 会重试投递，重复的 join/leave 会把在线状态写乱。
  // 主键冲突 = 这条事件处理过了，直接返回 200（否则 LiveKit 会一直重试）。
  if (event.id) {
    const claimed = await db
      .insert(webhookEvents)
      .values({ id: event.id, nodeId, event: event.event })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });
    if (claimed.length === 0) return json({ ok: true, deduped: true });
  }

  const [room] = await db
    .select({ id: rooms.id, nodeId: rooms.nodeId })
    .from(rooms)
    .where(eq(rooms.code, roomName))
    .limit(1);

  // 房间不属于这个节点就丢掉，防止 A 节点的事件污染 B 节点的房间状态
  if (!room || room.nodeId !== nodeId) {
    return json({ ok: true, ignored: "unknown_room" });
  }

  const online =
    event.event === "participant_joined" ||
    event.event === "track_published" ||
    event.event === "ingress_started";
  const offline =
    event.event === "participant_left" ||
    event.event === "ingress_ended" ||
    event.event === "room_finished";

  if (identity && (online || offline)) {
    await db
      .insert(roomPresence)
      .values({
        roomId: room.id,
        identity,
        kind: identity.startsWith("obs:") ? "ingress" : "user",
        isOnline: online,
        lastEvent: event.event,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [roomPresence.roomId, roomPresence.identity],
        set: { isOnline: online, lastEvent: event.event, updatedAt: new Date() },
      });
  }

  // 整个房间结束：把这一房的人全标下线
  if (event.event === "room_finished") {
    await db
      .update(roomPresence)
      .set({ isOnline: false, lastEvent: event.event, updatedAt: new Date() })
      .where(and(eq(roomPresence.roomId, room.id)));
  }

  audit({
    roomId: room.id,
    action: `webhook.${event.event}`,
    detail: { identity: identity ?? null, nodeId },
  });

  return json({ ok: true });
});
