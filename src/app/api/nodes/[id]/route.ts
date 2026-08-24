import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { livekitNodes, rooms } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { badRequest, conflict, forbidden, json, notFound, readJson, route, parseOr400 } from "@/lib/http";
import { probeCredentials } from "@/lib/livekit";
import { getNodeById, recheckNode, toSummary } from "@/lib/nodes";
import { updateNodeSchema } from "@/lib/validation";

export const runtime = "nodejs";

async function loadOwned(id: string, userId: string, isAdmin: boolean) {
  const node = await getNodeById(id);
  const mine = node.ownerId === userId;
  if (!mine && !isAdmin) throw notFound("节点不存在");
  return node;
}

export const GET = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const node = await loadOwned(id, user.id, user.role === "admin");
  return json({ node: toSummary(node, user.id) });
});

/** 「检测」按钮：重新体检并把结果写回。 */
export const POST = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const node = await loadOwned(id, user.id, user.role === "admin");
  const probe = await recheckNode(node);
  audit({ actorId: user.id, action: "node.recheck", detail: { nodeId: id, ok: probe.ok } });
  return json({ ok: probe.ok, error: probe.error ?? null, capabilities: probe.capabilities });
});

/** 改名 / 换密钥。换密钥要求两个字段都给，且必须通过体检才写入。 */
export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const node = await loadOwned(id, user.id, user.role === "admin");
  const input = await readJson(req, (raw) => parseOr400(updateNodeSchema, raw));

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;

  if (input.apiKey !== undefined || input.apiSecret !== undefined) {
    if (!input.apiKey || !input.apiSecret) {
      throw badRequest("换密钥必须同时提供 API Key 和 API Secret");
    }
    // 先用新凭据体检，避免把一个连不上的节点写进去
    const probe = await probeCredentials({
      id: node.id,
      name: node.name,
      kind: node.kind,
      wsUrl: node.wsUrl,
      apiKey: input.apiKey,
      apiSecret: input.apiSecret,
    });
    if (!probe.ok) throw badRequest(`新凭据校验失败：${probe.error}`);

    patch.apiKey = input.apiKey;
    patch.apiSecretEnc = encryptSecret(input.apiSecret);
    patch.lastCheckedAt = new Date();
    patch.lastCheckOk = true;
    patch.lastCheckError = null;
    patch.capabilities = probe.capabilities;
  }

  if (Object.keys(patch).length === 0) throw badRequest("没有要修改的字段");

  await db.update(livekitNodes).set(patch).where(eq(livekitNodes.id, id));
  audit({
    actorId: user.id,
    action: "node.update",
    detail: { nodeId: id, renamed: input.name !== undefined, rotated: "apiKey" in patch },
  });
  return json({ ok: true });
});

export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const node = await loadOwned(id, user.id, user.role === "admin");

  if (node.kind === "builtin") throw forbidden("内置节点不可删除，只能在管理页停用");

  const [row] = await db
    .select({ n: count() })
    .from(rooms)
    .where(and(eq(rooms.nodeId, id), eq(rooms.isActive, true)));
  if ((row?.n ?? 0) > 0) throw conflict("该节点下还有活跃房间，先关闭这些房间再删");

  await db.delete(livekitNodes).where(eq(livekitNodes.id, id));
  audit({ actorId: user.id, action: "node.delete", detail: { nodeId: id } });
  return json({ ok: true });
});
