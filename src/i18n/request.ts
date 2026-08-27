import { LOCALE_COOKIE, normalizeLocale, resolveLocale, type Locale } from "./config";
import { getT, type TFunction } from "./translate";

/**
 * 路由处理器用的语言判定 —— 直接从 `Request` 上读，不碰 `next/headers`。
 *
 * 这样 `route()` 那层包装（lib/http.ts）就能在**一个地方**把抛出来的 ApiError 消息
 * 翻成发起这次请求的人的语言，而不需要给每个 handler 都塞一个 await getT()。
 */
export function localeFromRequest(req: Request): Locale {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`).exec(cookieHeader);
  const fromCookie = match ? decodeURIComponent(match[1] ?? "") : null;

  return resolveLocale(
    normalizeLocale(fromCookie),
    req.headers.get("accept-language"),
  );
}

export function tFromRequest(req: Request): TFunction {
  return getT(localeFromRequest(req));
}
