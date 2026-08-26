import { NextResponse } from "next/server";

import { ApiError, badRequest, route } from "@/lib/http";
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
 */
export const GET = route(async (req, ctx: { params: Promise<{ provider: string }> }) => {
  const { provider: raw } = await ctx.params;
  const base = appUrl(req);

  if (!PROVIDERS.has(raw as OauthProvider)) throw badRequest("不支持这个登录方式");
  const provider = raw as OauthProvider;

  const url = new URL(req.url);
  const fail = (message: string) =>
    NextResponse.redirect(`${base}/login?error=${encodeURIComponent(message)}`, 302);

  try {
    await requireBootstrapped();

    // 用户在第三方页面点了「取消」会带 error 回来，这是正常路径，不该当成故障
    const denied = url.searchParams.get("error");
    if (denied) {
      return fail(denied === "access_denied" ? "你取消了第三方登录。" : `第三方返回：${denied}`);
    }

    const code = url.searchParams.get("code");
    if (!code) throw badRequest("回调缺少 code 参数");

    const { nextPath, codeVerifier } = await consumeState(provider, url.searchParams.get("state"));

    const identity = await exchangeCode({ provider, code, codeVerifier, appUrl: base });
    const user = await resolveOauthLogin(identity);

    const cookie = await issueSession(user.id);
    audit({ actorId: user.id, action: "auth.login.oauth", detail: { provider } });

    const res = NextResponse.redirect(`${base}${safeNextPath(nextPath)}`, 302);
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch (err) {
    // ApiError 的 message 是给人看的（「这个邮箱已有账号但没验证」之类），可以直接显示；
    // 其余异常只记日志，回一句笼统的 —— 里面可能有第三方响应的细节。
    if (err instanceof ApiError) return fail(err.message);
    console.error("[oauth] 回调处理失败", err);
    return fail("第三方登录失败，请重试或改用邮箱登录。");
  }
});
