import { sql } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/auth";
import { requireBootstrapped } from "@/lib/bootstrap";
import { conflict, json, readJson, route, parseOr400 } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { assertRegistrationOpen } from "@/lib/site-settings";
import { assertHuman } from "@/lib/turnstile";
import { clientIp } from "@/lib/url";
import { registerSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  // 入参校验先走，纯计算，不该被下面的 503 盖掉
  const input = await readJson(req, (raw) => parseOr400(registerSchema, raw));

  // 和登录一样：数据库/环境变量没就绪时给可读的 503，而不是笼统的 500
  await requireBootstrapped();

  // 站点关了注册就到此为止。放在人机验证**之前**：Turnstile 的 token 是一次性的，
  // 让它在一个注定要被拒的请求上烧掉，等于逼用户重验一次才能看到「本站不开放注册」。
  await assertRegistrationOpen();

  // 注册比登录更需要人机验证：没有它，脚本可以批量建号把 users 表撑满
  await assertHuman(input.captchaToken, clientIp(req));

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
