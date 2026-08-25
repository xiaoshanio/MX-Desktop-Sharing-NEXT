import { sql } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/auth";
import { adminEmail, requireBootstrapped } from "@/lib/bootstrap";
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
  // 先校验入参：那是纯计算，跟数据库没关系，配错环境也该照样回 400 而不是被 503 盖掉。
  const input = await readJson(req, (raw) => parseOr400(loginSchema, raw));

  // 管理员账户是引导时按 ADMIN_PASSWORD 建的，所以必须先于查库跑一遍。
  // 引导失败直接 503 —— 否则下面第一次碰库就炸成笼统的 500。
  const boot = await requireBootstrapped();

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

    // 首次部署忘了配 ADMIN_PASSWORD 的话，管理员账户压根没建出来。这时候回一句
    // 「密码不对」纯属误导。只在「目标就是管理员邮箱 + 账户确实不存在 + 引导报告
    // 未配置」时才这么说，所以不会泄露任何真实用户账号的存在性；这条信息
    // /api/health 本来也是公开的。判断放在 hash 之后，不影响防时序探测。
    if (!user && !boot.adminConfigured && input.email === adminEmail()) {
      throw new ApiError(
        503,
        "admin_not_configured",
        `管理员账户还没创建：环境变量 ADMIN_PASSWORD 是空的。设一个非空值后重启，` +
          `再用 ${adminEmail()} 登录。`,
      );
    }

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
