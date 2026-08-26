import { audit } from "@/lib/audit";
import { resolveEmailCodeLogin } from "@/lib/accounts";
import { createSession } from "@/lib/auth";
import { requireBootstrapped } from "@/lib/bootstrap";
import { consumeCode } from "@/lib/email-codes";
import { json, parseOr400, readJson, route } from "@/lib/http";
import { clearLoginFailures } from "@/lib/rate-limit";
import { verifyEmailCodeSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * 用邮箱验证码换一个会话。没有账号就当场建一个。
 *
 * 这一步**不再要人机验证**：发码那一步已经过了，而且这里的爆破面由
 * consumeCode 自己的试错上限守着（5 次就作废整条码）。在这儿再放一个
 * Turnstile 只会让用户在同一次登录里验两遍。
 */
export const POST = route(async (req) => {
  const input = await readJson(req, (raw) => parseOr400(verifyEmailCodeSchema, raw));
  await requireBootstrapped();

  await consumeCode(input.email, input.code);

  const user = await resolveEmailCodeLogin(input.email);

  // 验证码登录成功也把密码失败计数清零：同一个人已经证明了邮箱归他所有，
  // 没道理还让之前几次输错密码继续锁着他。
  await clearLoginFailures(input.email);
  await createSession(user.id);
  audit({ actorId: user.id, action: "auth.login.email_code" });

  return json({
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
  });
});
