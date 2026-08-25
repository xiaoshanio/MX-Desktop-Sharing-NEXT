import type { ZodTypeAny, output } from "zod";

/** 统一的 JSON 响应 / 错误约定，让所有 route handler 长一个样。 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, detail?: unknown) =>
  new ApiError(400, "bad_request", msg, detail);
export const unauthorized = (msg = "请先登录") => new ApiError(401, "unauthorized", msg);
export const forbidden = (msg = "没有权限") => new ApiError(403, "forbidden", msg);
export const notFound = (msg = "对象不存在") => new ApiError(404, "not_found", msg);
export const conflict = (msg: string) => new ApiError(409, "conflict", msg);

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data as Record<string, unknown>, init);
}

/**
 * 抹掉 URL 里的 `user:password@`，供公开端点回显底层错误用。
 *
 * /api/health 不需要登录，而数据库驱动抛的异常里可能带着完整连接串。
 * 放在这里是因为「什么能回给客户端」属于传输层的判断，而且这个模块零依赖，好测。
 */
export function redactSecrets(message: string): string {
  return message.replace(/([a-z][a-z0-9+.-]*:\/\/)[^:@/\s]+:[^@/\s]+@/gi, "$1***:***@");
}

/** 包住 handler，把 ApiError 翻成响应，其余异常记日志后统一 500。 */
export function route<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<Response>,
) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json(
          { error: err.code, message: err.message, detail: err.detail ?? null },
          { status: err.status },
        );
      }
      console.error("[api] 未捕获异常", err);
      return Response.json({ error: "internal", message: "服务端错误" }, { status: 500 });
    }
  };
}

export async function readJson<T>(req: Request, parse: (input: unknown) => T): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest("请求体不是合法 JSON");
  }
  return parse(raw);
}

/**
 * 用 zod schema 校验，失败抛 400。
 *
 * 放在这里而不是 validation.ts：schema 模块保持零依赖（纯数据描述），
 * 「校验失败该返回什么 HTTP 状态」属于传输层的事。
 */
export function parseOr400<S extends ZodTypeAny>(schema: S, input: unknown): output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw badRequest(first?.message ?? "参数不合法", result.error.flatten());
  }
  return result.data;
}
