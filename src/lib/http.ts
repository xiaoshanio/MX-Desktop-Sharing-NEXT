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

/** Postgres SQLSTATE → 一句能照着做的话。只收录部署期真会撞上的那几个。 */
const SQLSTATE_HINTS: Record<string, string> = {
  "42P01": "表不存在 —— 迁移没跑过。对着这个库执行一次 npm run db:migrate。",
  "42703": "列不存在 —— 迁移只跑了一半，重新执行 npm run db:migrate。",
  "3F000": "schema 不存在 —— 检查连接串里的库名。",
  "3D000": "数据库不存在 —— 连接串里的库名写错了。",
  "28P01": "口令认证失败 —— 连接串里的密码不对。",
  "28000": "认证被拒 —— 连接串里的用户名或权限不对。",
  "53300": "连接数超限 —— Neon 换成 Pooled connection 那条连接串。",
  "08006": "连接中断 —— 检查网络，以及 Neon 实例是不是已休眠或被删了。",
  "57P03": "数据库正在启动 —— Neon 冷启动，等几秒重试。",
};

/**
 * 从错误链里挖出真正有信息量的那条消息。
 *
 * drizzle 会把驱动异常包进 `DrizzleQueryError`，而它的 `message` 只是
 * `Failed query: <SQL>\nparams: <参数>` —— 真正的原因（比如
 * `relation "app_config" does not exist`）藏在 `cause` 里。只看最外层就会得到
 * 一条既没用又把 SQL 和参数抖出去的消息，所以这里顺着 cause 走到底。
 */
export function describeDbError(err: unknown): { message: string; code?: string } {
  let cursor: unknown = err;
  let deepest = "";
  let code: string | undefined;

  for (let depth = 0; cursor && typeof cursor === "object" && depth < 8; depth++) {
    const node = cursor as { message?: unknown; code?: unknown; cause?: unknown };

    if (typeof node.message === "string") {
      // drizzle 那层的 message 除了 SQL 和参数没有别的信息，跳过
      const text = node.message.trim();
      if (text && !text.startsWith("Failed query:")) deepest = text;
    }
    // SQLSTATE 是 5 位字母数字；驱动之间字段名一致，取第一个匹配到的
    if (code === undefined && typeof node.code === "string" && /^[0-9A-Z]{5}$/.test(node.code)) {
      code = node.code;
    }
    cursor = node.cause;
  }

  const hint = code ? SQLSTATE_HINTS[code] : undefined;
  const parts = [hint, deepest].filter((p): p is string => Boolean(p));
  const message = redactSecrets(
    parts.length > 0 ? parts.join(" 原始报错：") : "数据库查询失败，原因未知。",
  );

  return code === undefined ? { message } : { message, code };
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
