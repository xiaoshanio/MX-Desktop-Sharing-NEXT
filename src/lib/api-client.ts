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
    const msg =
      (data as { message?: string } | null)?.message ?? `请求失败（HTTP ${res.status}）`;
    throw new Error(msg);
  }
  return data as T;
}
