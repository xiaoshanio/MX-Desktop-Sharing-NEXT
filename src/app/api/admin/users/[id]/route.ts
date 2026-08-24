import { and, count, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { badRequest, json, readJson, route, parseOr400 } from "@/lib/http";
import { adminUpdateUserSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** 停用/启用账号、提升或撤销管理员。 */
export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const input = await readJson(req, (raw) => parseOr400(adminUpdateUserSchema, raw));

  if (id === admin.id) {
    // 防止把自己锁在门外：最后一个管理员降级/停用会导致没人能管
    throw badRequest("不能修改自己的角色或状态");
  }

  const patch: Record<string, unknown> = {};
  if (input.role !== undefined) patch.role = input.role;
  if (input.isDisabled !== undefined) patch.isDisabled = input.isDisabled;
  if (Object.keys(patch).length === 0) throw badRequest("没有要修改的字段");

  // 撤销别人的管理员前，确认站内还留有至少一个管理员
  if (input.role === "user") {
    const [row] = await db
      .select({ n: count() })
      .from(users)
      .where(and(eq(users.role, "admin"), ne(users.id, id), eq(users.isDisabled, false)));
    if ((row?.n ?? 0) === 0) throw badRequest("站内必须保留至少一个启用的管理员");
  }

  const updated = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  if (updated.length === 0) throw badRequest("用户不存在");

  // 停用账号要顺手把他的会话全部作废，否则已登录的浏览器还能继续用
  if (input.isDisabled === true) {
    await db.delete(sessions).where(eq(sessions.userId, id));
  }

  audit({ actorId: admin.id, action: "admin.user.update", detail: { targetId: id, ...patch } });
  return json({ ok: true });
});
