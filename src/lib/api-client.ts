/**
 * 服务端返回非 2xx 时抛的错误。
 *
 * 带上 status 是为了让「服务端连消息都没给出来」这种情况也能有一句本地化的话可说 ——
 * 消息本身由服务端按调用者的语言翻好（见 lib/http.ts 的 `route()`），所以正常路径上
 * 前端不需要再翻一遍；只有 message 为空时才轮到 err.httpFailed 兜底。
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** 极薄的 fetch 封装：统一把服务端的 {error,message} 翻成 Error。 */
export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(path, {
    ...rest,
    headers: json ? { "content-type": "application/json", ...rest.headers } : rest.headers,
    body: json ? JSON.stringify(json) : rest.body,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    throw new HttpError(res.status, (data as { message?: string } | null)?.message ?? "");
  }
  return data as T;
}
