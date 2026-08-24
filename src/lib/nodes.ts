import { and, count, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { livekitNodes, rooms, type LivekitNode, type User } from "@/db/schema";
import { decryptSecret, encryptSecret } from "./crypto";
import { badRequest, conflict, forbidden, notFound } from "./http";
import { probeCredentials, type ResolvedNode } from "./livekit";

/** 给前端看的节点视图：只有元信息，没有任何密钥。 */
export type NodeSummary = {
  id: string;
  name: string;
  kind: "builtin" | "user";
  wsUrl: string;
  isEnabled: boolean;
  isMine: boolean;
  lastCheckOk: boolean | null;
  lastCheckedAt: string | null;
  capabilities: { listRooms: boolean; ingress: boolean } | null;
  roomCount?: number;
};

export function toSummary(node: LivekitNode, viewerId: string): NodeSummary {
  return {
    id: node.id,
    name: node.name,
    kind: node.kind,
    wsUrl: node.wsUrl,
    isEnabled: node.isEnabled,
    isMine: node.ownerId === viewerId,
    lastCheckOk: node.lastCheckOk,
    lastCheckedAt: node.lastCheckedAt?.toISOString() ?? null,
    capabilities: (node.capabilities as NodeSummary["capabilities"]) ?? null,
  };
}

export function resolve(node: LivekitNode): ResolvedNode {
  return {
    id: node.id,
    name: node.name,
    kind: node.kind,
    wsUrl: node.wsUrl,
    apiKey: node.apiKey,
    apiSecret: decryptSecret(node.apiSecretEnc),
  };
}

export async function getNodeById(id: string): Promise<LivekitNode> {
  const [node] = await db.select().from(livekitNodes).where(eq(livekitNodes.id, id)).limit(1);
  if (!node) throw notFound("节点不存在");
  return node;
}

export async function resolveNodeById(id: string): Promise<ResolvedNode> {
  return resolve(await getNodeById(id));
}

/** 内置节点：管理员初始化时写入的那个，全站唯一。 */
export async function getBuiltinNode(): Promise<LivekitNode | null> {
  const [node] = await db
    .select()
    .from(livekitNodes)
    .where(eq(livekitNodes.kind, "builtin"))
    .limit(1);
  return node ?? null;
}

/** 一个用户建房时能挑的节点 = 自己接的 + （开放的）内置节点。 */
export async function listUsableNodes(user: User): Promise<LivekitNode[]> {
  return db
    .select()
    .from(livekitNodes)
    .where(
      and(
        eq(livekitNodes.isEnabled, true),
        or(
          eq(livekitNodes.ownerId, user.id),
          user.role === "admin"
            ? eq(livekitNodes.kind, "builtin")
            : and(eq(livekitNodes.kind, "builtin"), eq(livekitNodes.allowPublic, true)),
        ),
      ),
    );
}

/**
 * 建房时确定用哪个节点，并校验调用者有权用它。
 * 这里是配额归属的分水岭：user 节点烧用户自己的免费额度，builtin 烧站长的。
 */
export async function assertNodeUsable(node: LivekitNode, user: User): Promise<void> {
  if (!node.isEnabled) throw badRequest(`节点「${node.name}」已被停用`);

  if (node.kind === "user") {
    if (node.ownerId !== user.id && user.role !== "admin") {
      throw forbidden("不能使用别人接入的节点");
    }
    return;
  }

  // builtin
  if (!node.allowPublic && user.role !== "admin") {
    throw forbidden("内置节点未对普通用户开放，请接入你自己的 LiveKit Cloud 项目");
  }
  if (node.maxRooms !== null) {
    const [row] = await db
      .select({ n: count() })
      .from(rooms)
      .where(and(eq(rooms.nodeId, node.id), eq(rooms.isActive, true)));
    if ((row?.n ?? 0) >= node.maxRooms) {
      throw conflict(`内置节点房间数已达上限（${node.maxRooms}），请接入自己的节点`);
    }
  }
}

type CreateNodeInput = {
  name: string;
  wsUrl: string;
  apiKey: string;
  apiSecret: string;
  ownerId: string | null;
  kind?: "builtin" | "user";
  allowPublic?: boolean;
  maxRooms?: number | null;
};

/** 落库前必须先体检通过，避免库里堆一堆连不上的死节点。 */
export async function createNode(input: CreateNodeInput): Promise<LivekitNode> {
  const probe = await probeCredentials({
    id: "probe",
    name: input.name,
    kind: input.kind ?? "user",
    wsUrl: input.wsUrl,
    apiKey: input.apiKey,
    apiSecret: input.apiSecret,
  });

  if (!probe.ok) throw badRequest(probe.error ?? "凭据校验失败");

  const dup = await db
    .select({ id: livekitNodes.id })
    .from(livekitNodes)
    .where(
      and(
        input.ownerId ? eq(livekitNodes.ownerId, input.ownerId) : isNull(livekitNodes.ownerId),
        eq(livekitNodes.wsUrl, input.wsUrl),
        eq(livekitNodes.apiKey, input.apiKey),
      ),
    )
    .limit(1);
  if (dup.length > 0) throw conflict("这套凭据已经接入过了");

  const [node] = await db
    .insert(livekitNodes)
    .values({
      name: input.name,
      kind: input.kind ?? "user",
      wsUrl: input.wsUrl,
      apiKey: input.apiKey,
      apiSecretEnc: encryptSecret(input.apiSecret),
      ownerId: input.ownerId,
      allowPublic: input.allowPublic ?? false,
      maxRooms: input.maxRooms ?? null,
      lastCheckedAt: new Date(),
      lastCheckOk: true,
      lastCheckError: null,
      capabilities: probe.capabilities as never,
    })
    .returning();

  return node!;
}

/** 重新体检并把结果写回，供 /nodes 页面上的「检测」按钮用。 */
export async function recheckNode(node: LivekitNode): Promise<import("./livekit").ProbeResult> {
  const probe = await probeCredentials(resolve(node));
  await db
    .update(livekitNodes)
    .set({
      lastCheckedAt: new Date(),
      lastCheckOk: probe.ok,
      lastCheckError: probe.error ?? null,
      capabilities: probe.capabilities as never,
    })
    .where(eq(livekitNodes.id, node.id));
  return probe;
}
