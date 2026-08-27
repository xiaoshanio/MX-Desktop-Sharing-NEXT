import { ApiError } from "./http";
import { getCredential } from "./service-credentials";

/**
 * Cloudflare Turnstile 服务端校验。
 *
 * 前端那个小组件只负责拿到一枚 token；**没有这一步的话它形同虚设** ——
 * 脚本直接 POST /api/auth/login 就绕过去了。所以登录、注册、发验证码
 * 三个入口都在做正事之前先过这里。
 *
 * 没配 Turnstile 凭据时直接放行：这套系统要能在内网/自建环境零配置跑起来，
 * 管理员没接人机验证就不该把所有人锁在门外。是否已启用由 /api/auth/providers 告诉前端。
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileOutcome = { ok: true; skipped: boolean } | { ok: false; reason: string };

export async function verifyTurnstile(
  token: string | null | undefined,
  ip: string | null,
): Promise<TurnstileOutcome> {
  const credential = await getCredential("turnstile");
  if (!credential) return { ok: true, skipped: true };

  if (!token || token.trim() === "") {
    return { ok: false, reason: "api.captcha.required" };
  }

  const body = new URLSearchParams({ secret: credential.secret, response: token });
  // Cloudflare 用 remoteip 做额外的风险判断，拿不到就不传（传空串会被判非法参数）
  if (ip) body.set("remoteip", ip);

  let payload: { success?: boolean; "error-codes"?: string[] };
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      // 校验接口挂了不能把登录卡死在这儿
      signal: AbortSignal.timeout(8000),
    });
    payload = (await res.json()) as typeof payload;
  } catch {
    return { ok: false, reason: "api.captcha.unreachable" };
  }

  if (payload.success) return { ok: true, skipped: false };

  const codes = payload["error-codes"] ?? [];
  // timeout-or-duplicate 是最常见的一种：token 只能用一次，且 5 分钟内有效。
  // 直接把 Cloudflare 的原始码抛给用户看没意义，翻成能照着做的话。
  const reason = codes.includes("timeout-or-duplicate")
    ? "api.captcha.expired"
    : codes.includes("invalid-input-secret")
      ? "api.captcha.badSecret"
      : "api.captcha.failed";
  return { ok: false, reason };
}

/** 校验失败直接抛 400，给 route handler 用的糖。 */
export async function assertHuman(token: string | null | undefined, ip: string | null): Promise<void> {
  const outcome = await verifyTurnstile(token, ip);
  if (!outcome.ok) throw new ApiError(400, "captcha_failed", outcome.reason);
}
