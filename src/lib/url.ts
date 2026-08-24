/**
 * 站点根地址。
 *
 * 优先用 NEXT_PUBLIC_APP_URL；没配就从请求头推。Vercel 的 preview 部署每次域名都不同，
 * 而 NEXT_PUBLIC_* 是构建期内联的，写死会导致 preview 上回显错误的 webhook 地址。
 */
export function appUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/+$/, "");

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** 某个节点该配的 LiveKit webhook 回调地址。 */
export function webhookUrlFor(req: Request, nodeId: string): string {
  return `${appUrl(req)}/api/webhooks/livekit/${nodeId}`;
}

/** 客户端 IP。Vercel 把真实 IP 放在 x-forwarded-for 第一段。 */
export function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}
