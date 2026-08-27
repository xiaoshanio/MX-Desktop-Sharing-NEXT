import { badRequest } from "@/lib/http";
import { route } from "@/lib/api-route";
import { beginAuthorization, safeNextPath } from "@/lib/oauth";
import { requireBootstrapped } from "@/lib/bootstrap";
import { appUrl } from "@/lib/url";
import type { OauthProvider } from "@/db/schema";

export const runtime = "nodejs";

const PROVIDERS = new Set<OauthProvider>(["github", "google"]);

/**
 * 第三方登录的起点。浏览器直接导航到这里（不是 fetch），我们 302 到第三方的授权页。
 *
 * 用 GET 而不是 POST 是因为它必须能作为普通链接被点击；由此带来的 CSRF 风险由
 * state 参数在回调那一侧兜住（见 lib/oauth.ts）—— 而且这一步本身不改任何状态，
 * 被人诱导点开最坏的结果是看到一个第三方登录页。
 */
export const GET = route(async (req, ctx: { params: Promise<{ provider: string }> }) => {
  const { provider } = await ctx.params;
  if (!PROVIDERS.has(provider as OauthProvider)) throw badRequest("api.oauth.unsupported");

  await requireBootstrapped();

  const nextPath = safeNextPath(new URL(req.url).searchParams.get("next"));
  const target = await beginAuthorization({
    provider: provider as OauthProvider,
    appUrl: appUrl(req),
    nextPath,
  });

  return Response.redirect(target, 302);
});
