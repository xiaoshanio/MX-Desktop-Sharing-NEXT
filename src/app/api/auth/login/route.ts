import { sql } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/auth";
import { ApiError, json, readJson, route, parseOr400 } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import {
  assertLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/rate-limit";
import { clientIp } from "@/lib/url";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  const input = await readJson(req, (raw) => parseOr400(loginSchema, raw));
  const ip = clientIp(req);

  // 限流在校验密码之前：达到阈值直接 429，连 hash 都不算
  await assertLoginAllowed(input.email, ip);

  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${input.email}`)
    .limit(1);

  // 邮箱不存在也要走一遍 hash 校验，避免用响应时间探测账号是否存在
  const stored = user?.passwordHash ?? "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$AAAA";
  const ok = await verifyPassword(input.password, stored);

  if (!user || !ok || user.isDisabled) {
    await recordLoginFailure(input.email, ip);
    throw new ApiError(401, "invalid_credentials", "邮箱或密码不正确");
  }

  await clearLoginFailures(input.email);
  await createSession(user.id);
  audit({ actorId: user.id, action: "auth.login" });

  return json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  });
});
