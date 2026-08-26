import {
  AccessToken,
  IngressAudioEncodingPreset,
  IngressAudioOptions,
  IngressClient,
  IngressInput,
  IngressVideoEncodingPreset,
  IngressVideoOptions,
  RoomServiceClient,
  TrackSource,
  WebhookReceiver,
  type IngressInfo,
} from "livekit-server-sdk";

/** 已解密、可直接用来构造 SDK client 的节点。绝不可整体回传给前端。 */
export type ResolvedNode = {
  id: string;
  name: string;
  kind: "builtin" | "user";
  wsUrl: string;
  apiKey: string;
  apiSecret: string;
};

/** wss://x.livekit.cloud → https://x.livekit.cloud（server SDK 走 http） */
export function httpUrl(wsUrl: string): string {
  return wsUrl.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
}

export const roomService = (node: ResolvedNode) =>
  new RoomServiceClient(httpUrl(node.wsUrl), node.apiKey, node.apiSecret);

export const ingressClient = (node: ResolvedNode) =>
  new IngressClient(httpUrl(node.wsUrl), node.apiKey, node.apiSecret);

export const webhookReceiver = (node: ResolvedNode) =>
  new WebhookReceiver(node.apiKey, node.apiSecret);

type GrantOptions = {
  identity: string;
  name?: string;
  roomName: string;
  canPublish: boolean;
  ttlSeconds: number;
  /**
   * 随 token 带给房里所有人的公开信息（头像版本、卡片底色）。
   *
   * 走 metadata 而不是让前端为每个参与者发一次请求：参与者列表是客户端 SDK
   * 直接给的，卡片要在人一上线的瞬间就画对。**房里所有人可见**，
   * 所以只能放呈现用的字段，见 lib/identity.ts 的 ParticipantMeta。
   */
  metadata?: string;
};

/**
 * 签发 join token。
 *
 * 鉴权的关键全在这里：room 字段只写一个房间名，所以这张 token 物理上无法用于
 * 订阅别的房间——不是应用层过滤，是协议层保证。调用方必须先确认调用者是该房间成员。
 */
export async function mintJoinToken(
  node: ResolvedNode,
  opts: GrantOptions,
): Promise<{ token: string; wsUrl: string; expiresAt: string }> {
  const at = new AccessToken(node.apiKey, node.apiSecret, {
    identity: opts.identity,
    name: opts.name,
    ttl: opts.ttlSeconds,
    metadata: opts.metadata,
  });

  at.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canSubscribe: true,
    canPublish: opts.canPublish,
    // 同步播放器的时钟对齐走 data channel，所有人都要能发 —— 观众也得能回 ping。
    // 这只放开数据消息，跟能不能发布音视频轨（canPublish）是两件事。
    canPublishData: true,
    // 不给 roomCreate / roomAdmin / roomList，房间由服务端提前建好
  });

  return {
    token: await at.toJwt(),
    wsUrl: node.wsUrl,
    expiresAt: new Date(Date.now() + opts.ttlSeconds * 1000).toISOString(),
  };
}

/** 房间必须先在 LiveKit 侧存在，客户端 token 才不需要 roomCreate 权限。 */
export async function ensureRoom(node: ResolvedNode, roomName: string): Promise<void> {
  const svc = roomService(node);
  try {
    await svc.createRoom({ name: roomName, emptyTimeout: 60 * 10, departureTimeout: 60 * 2 });
  } catch (err) {
    // 已存在就当成功；其余错误（凭据失效、配额打满）要抛出去
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/i.test(msg)) throw err;
  }
}

/**
 * 建一个绑定到「该用户 + 该房间」的 WHIP ingress。
 *
 * enableTranscoding: false 是免费额度能不能用的分水岭 —— WHIP 直通不吃
 * transcode 分钟（免费层只有 60 分钟/月）。代价是没有服务端 simulcast，
 * 要让推流端（OBS 32.1.0+）自己开多层。
 */
export async function createWhipIngress(
  node: ResolvedNode,
  args: { roomName: string; identity: string; displayName: string },
): Promise<IngressInfo> {
  return ingressClient(node).createIngress(IngressInput.WHIP_INPUT, {
    name: `${args.roomName}:${args.identity}`,
    roomName: args.roomName,
    participantIdentity: args.identity,
    participantName: args.displayName,
    enableTranscoding: false,
  });
}

/** 备用：确实需要 RTMP 时用这个，但要向用户明示会烧 transcode 额度。 */
export async function createRtmpIngress(
  node: ResolvedNode,
  args: { roomName: string; identity: string; displayName: string },
): Promise<IngressInfo> {
  return ingressClient(node).createIngress(IngressInput.RTMP_INPUT, {
    name: `${args.roomName}:${args.identity}`,
    roomName: args.roomName,
    participantIdentity: args.identity,
    participantName: args.displayName,
    enableTranscoding: true,
    // encodingOptions 是 protobuf 的 oneof，要写成 { case, value }
    video: new IngressVideoOptions({
      source: TrackSource.SCREEN_SHARE,
      encodingOptions: {
        case: "preset",
        value: IngressVideoEncodingPreset.H264_1080P_30FPS_3_LAYERS,
      },
    }),
    audio: new IngressAudioOptions({
      source: TrackSource.MICROPHONE,
      encodingOptions: {
        case: "preset",
        value: IngressAudioEncodingPreset.OPUS_STEREO_96KBPS,
      },
    }),
  });
}

export async function deleteIngress(node: ResolvedNode, ingressId: string): Promise<void> {
  await ingressClient(node).deleteIngress(ingressId);
}

export async function removeParticipant(
  node: ResolvedNode,
  roomName: string,
  identity: string,
): Promise<void> {
  await roomService(node).removeParticipant(roomName, identity);
}

export async function setParticipantPublish(
  node: ResolvedNode,
  roomName: string,
  identity: string,
  canPublish: boolean,
): Promise<void> {
  await roomService(node).updateParticipant(roomName, identity, undefined, {
    canPublish,
    canSubscribe: true,
    canPublishData: canPublish,
  });
}

/** 房里此刻连着的参与者 identity 列表。房间不存在时返回空数组。 */
export async function listParticipantIdentities(
  node: ResolvedNode,
  roomName: string,
): Promise<string[]> {
  try {
    const list = await roomService(node).listParticipants(roomName);
    return list.map((participant) => participant.identity);
  } catch {
    // 房间已被 emptyTimeout 回收 —— 没人在线，没什么要改的
    return [];
  }
}

export type ProbeResult = {
  ok: boolean;
  error?: string;
  capabilities: { listRooms: boolean; ingress: boolean };
};

/**
 * 凭据体检：接节点前先打两个只读请求，别等到用户建完房才发现 key 是错的。
 * listRooms 失败 = 凭据/地址不对；ingress 失败通常是该项目没开 ingress 或配额已满。
 */
export async function probeCredentials(node: ResolvedNode): Promise<ProbeResult> {
  const capabilities = { listRooms: false, ingress: false };

  try {
    await roomService(node).listRooms();
    capabilities.listRooms = true;
  } catch (err) {
    return {
      ok: false,
      error: `连不上或凭据无效：${err instanceof Error ? err.message : String(err)}`,
      capabilities,
    };
  }

  try {
    await ingressClient(node).listIngress({});
    capabilities.ingress = true;
  } catch {
    // 不算致命：房间还能当纯 WebRTC 用，只是拿不到 OBS 推流地址
  }

  return { ok: true, capabilities };
}
