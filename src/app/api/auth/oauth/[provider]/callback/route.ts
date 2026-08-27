import { NextResponse } from "next/server";

import { ApiError, badRequest } from "@/lib/http";
import { route } from "@/lib/api-route";
import { tFromRequest } from "@/i18n/request";
import { audit } from "@/lib/audit";
import { resolveOauthLogin } from "@/lib/accounts";
import { issueSession } from "@/lib/auth";
import { requireBootstrapped } from "@/lib/bootstrap";
import { consumeState, exchangeCode, safeNextPath } from "@/lib/oauth";
import { appUrl } from "@/lib/url";
import type { OauthProvider } from "@/db/schema";

export const runtime = "nodejs";

const PROVIDERS = new Set<OauthProvider>(["github", "google"]);

/**
 * 第三方回调。走到这里时浏览器正在跳转过程中，所以**不能回 JSON** ——
 * 用户会看到一屏原始的 `{"error":...}`。所有结果都必须变成一次跳转：
 * 成功回落地页，失败回登录页并把原因挂在查询串上让登录页显示出来。
 *
 * 会话 cookie 显式挂在这个响应上（见 lib/auth.ts 的 issueSession 注释）。
 *
 * 这里的失败消息**自己翻**：它不是走 `route()` 的 JSON 错误通道，而是被塞进
 * 跳转 URL 的查询串，由登录页原样弹出来。
 */
export const GET = route(async (req, ctx: { params: Promise<{ provider: string }> }) => {
  const { provider: raw } = await ctx.params;
  const base = appUrl(req);
  const t = tFromRequest(req);

  if (!PROVIDERS.has(raw as OauthProvider)) throw badRequest("api.oauth.unsupported");
  const provider = raw as OauthProvider;

  const url = new URL(req.url);
  const fail = (message: string) =>
    NextResponse.redirect(`${base}/login?error=${encodeURIComponent(message)}`, 302);

  try {
    await requireBootstrapped();

    // 用户在第三方页面点了「取消」会带 error 回来，这是正常路径，不该当成故障
    const denied = url.searchParams.get("error");
    if (denied) {
      return fail(
        denied === "access_denied"
          ? t("api.oauth.userCancelled")
          : t("api.oauth.providerReturned", { error: denied }),
      );
    }

    const code = url.searchParams.get("code");
    if (!code) throw badRequest("api.oauth.missingCode");

    const { nextPath, codeVerifier } = await consumeState(provider, url.searchParams.get("state"));

    const identity = await exchangeCode({ provider, code, codeVerifier, appUrl: base });
    const user = await resolveOauthLogin(identity);

    const cookie = await issueSession(user.id);
    audit({ actorId: user.id, action: "auth.login.oauth", detail: { provider } });

    const res = NextResponse.redirect(`${base}${safeNextPath(nextPath)}`, 302);
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch (err) {
    // ApiError 的 message 是消息键（「这个邮箱已有账号但没验证」之类），翻出来给用户看；
    // 其余异常只记日志，回一句笼统的 —— 里面可能有第三方响应的细节。
    if (err instanceof ApiError) return fail(t.raw(err.message, err.params));
    console.error("[oauth] callback failed", err);
    return fail(t("api.oauth.failed"));
  }
});
