import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { livekitNodes, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/auth";
import { badRequest, conflict, forbidden, json, readJson, route, parseOr400 } from "@/lib/http";
import { probeCredentials } from "@/lib/livekit";
import { createNode } from "@/lib/nodes";
import { hashPassword } from "@/lib/password";
import { claimInitialization, isInitialized, releaseInitialization } from "@/lib/setup";
import { webhookUrlFor } from "@/lib/url";
import { setupSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** 前端用来决定是否把用户弹到 /setup。 */
export const GET = route(async () => {
  return json({
    initialized: await isInitialized(),
    requiresSetupToken: Boolean(process.env.SETUP_TOKEN),
  });
});

function checkSetupToken(provided: string | undefined): void {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) return;

  const a = Buffer.from(provided ?? "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw forbidden("SETUP_TOKEN 不正确");
  }
}

/**
 * 首次初始化：建管理员 + 写入内置 LiveKit 节点。
 * 只能成功一次；成功后 /setup 直接 409。
 */
export const POST = route(async (req) => {
  if (await isInitialized()) throw conflict("本站已经初始化过了");

  const input = await readJson(req, (raw) => parseOr400(setupSchema, raw));
  checkSetupToken(input.setupToken);

  // 先体检凭据再抢锁，避免因为填错 key 把初始化状态卡死
  const probe = await probeCredentials({
    id: "setup-probe",
    name: input.builtinNode.name,
    kind: "builtin",
    wsUrl: input.builtinNode.wsUrl,
    apiKey: input.builtinNode.apiKey,
    apiSecret: input.builtinNode.apiSecret,
  });
  if (!probe.ok) throw badRequest(`内置节点凭据校验失败：${probe.error}`);

  if (!(await claimInitialization())) throw conflict("本站已经初始化过了");

  try {
    const [admin] = await db
      .insert(users)
      .values({
        email: input.admin.email,
        displayName: input.admin.displayName,
        passwordHash: await hashPassword(input.admin.password),
        role: "admin",
      })
      .returning();

    const node = await createNode({
      name: input.builtinNode.name,
      wsUrl: input.builtinNode.wsUrl,
      apiKey: input.builtinNode.apiKey,
      apiSecret: input.builtinNode.apiSecret,
      ownerId: null,
      kind: "builtin",
      allowPublic: input.builtinNode.allowPublic,
      maxRooms: input.builtinNode.maxRooms,
    });

    await createSession(admin!.id);
    audit({ actorId: admin!.id, action: "setup.completed", detail: { nodeId: node.id } });

    return json({
      ok: true,
      admin: { id: admin!.id, email: admin!.email },
      builtinNode: {
        id: node.id,
        name: node.name,
        wsUrl: node.wsUrl,
        capabilities: probe.capabilities,
      },
      webhookUrl: webhookUrlFor(req, node.id),
    });
  } catch (err) {
    // 回滚：放掉锁并清掉可能已插入的半成品
    await db.delete(users).where(eq(users.email, input.admin.email)).catch(() => {});
    await db.delete(livekitNodes).where(eq(livekitNodes.kind, "builtin")).catch(() => {});
    await releaseInitialization();
    throw err;
  }
});
