import { sql } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/auth";
import { badRequest, conflict, json, readJson, route, parseOr400 } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { isInitialized } from "@/lib/setup";
import { registerSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  if (!(await isInitialized())) throw badRequest("本站尚未初始化，请先完成 /setup");

  const input = await readJson(req, (raw) => parseOr400(registerSchema, raw));

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${input.email}`)
    .limit(1);
  if (existing.length > 0) throw conflict("该邮箱已注册");

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      displayName: input.displayName,
      passwordHash: await hashPassword(input.password),
      role: "user",
    })
    .returning();

  await createSession(user!.id);
  audit({ actorId: user!.id, action: "auth.register" });

  return json({
    user: { id: user!.id, email: user!.email, displayName: user!.displayName, role: user!.role },
  });
});
