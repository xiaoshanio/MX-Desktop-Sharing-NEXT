import type { ZodTypeAny, output } from "zod";

import type { MessageVars } from "@/i18n";

/**
 * 统一的 JSON 响应 / 错误约定，让所有 route handler 长一个样。
 *
 * 这个模块**零运行时依赖**（只有类型 import）：它的每一条约定都要能被
 * tests/validation.test.mts 直接 import 来测。真正需要请求上下文的那一环
 * （把消息键翻成人话）在 ./api-route 里。
 */

/**
 * `message` 里放的是**消息键**（`api.*` / `valid.*`），不是成品文案。
 *
 * 翻译收在 `route()` 那一层：它拿得到 `Request`，因而拿得到调用者的语言
 * （cookie → Accept-Language）。这样每个 handler 只管抛出「哪一种错」，
 * 不需要各自 `await getT()`，也不会出现半数路由忘了翻译的情况。
 *
 * 传字面量文案也仍然可用 —— 翻译时认不出的键会被原样返回（见 TFunction.raw）。
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly detail?: unknown,
    /** 消息里 `{name}` 占位符的取值。 */
    readonly params?: MessageVars,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, detail?: unknown, params?: MessageVars) =>
  new ApiError(400, "bad_request", msg, detail, params);
export const unauthorized = (msg = "api.unauthorized") => new ApiError(401, "unauthorized", msg);
export const forbidden = (msg = "api.forbidden", params?: MessageVars) =>
  new ApiError(403, "forbidden", msg, undefined, params);
export const notFound = (msg = "api.notFound") => new ApiError(404, "not_found", msg);
export const conflict = (msg: string, params?: MessageVars) =>
  new ApiError(409, "conflict", msg, undefined, params);

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data as Record<string, unknown>, init);
}

/**
 * 抹掉 URL 里的 `user:password@`，供公开端点回显底层错误用。
 *
 * /api/health 不需要登录，而数据库驱动抛的异常里可能带着完整连接串。
 * 放在这里是因为「什么能回给客户端」属于传输层的判断。
 */
export function redactSecrets(message: string): string {
  return message.replace(/([a-z][a-z0-9+.-]*:\/\/)[^:@/\s]+:[^@/\s]+@/gi, "$1***:***@");
}

/** Postgres SQLSTATE → 消息键。只收录部署期真会撞上的那几个。 */
const SQLSTATE_KEYS = new Set([
  "42P01",
  "42703",
  "3F000",
  "3D000",
  "28P01",
  "28000",
  "53300",
  "08006",
  "57P03",
]);

/**
 * 从错误链里挖出真正有信息量的那条消息。
 *
 * drizzle 会把驱动异常包进 `DrizzleQueryError`，而它的 `message` 只是
 * `Failed query: <SQL>\nparams: <参数>` —— 真正的原因（比如
 * `relation "app_config" does not exist`）藏在 `cause` 里。只看最外层就会得到
 * 一条既没用又把 SQL 和参数抖出去的消息，所以这里顺着 cause 走到底。
 *
 * 返回的 `hintKey` 是消息键，由调用方（/api/health）按请求语言渲染 ——
 * 这个函数本身没有请求上下文。
 */
export function describeDbError(err: unknown): {
  message: string;
  code?: string;
  hintKey?: string;
} {
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

  const message = redactSecrets(deepest);
  const hintKey = code && SQLSTATE_KEYS.has(code) ? `api.db.${code}` : undefined;

  return { message, ...(code === undefined ? {} : { code }), ...(hintKey ? { hintKey } : {}) };
}

/**
 * 把 describeDbError 的结果拼成一句人话。放在这里而不是 health 路由里，
 * 是因为「hint + 原始报错」的拼接方式（含分隔词）也要跟着语言走。
 */
export function formatDbError(
  t: (key: string, vars?: MessageVars) => string,
  described: { message: string; hintKey?: string },
): string {
  const hint = described.hintKey ? t(described.hintKey) : "";
  const raw = described.message;
  if (hint && raw) return `${hint}${t("api.db.rawPrefix")}${raw}`;
  return hint || raw || t("api.db.unknown");
}

/** 包住 handler，把 ApiError 翻成响应 —— 见 ./api-route（它需要请求上下文，所以不在这里）。 */

export async function readJson<T>(req: Request, parse: (input: unknown) => T): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest("api.badJson");
  }
  return parse(raw);
}

/**
 * 用 zod schema 校验，失败抛 400。
 *
 * 放在这里而不是 validation.ts：schema 模块保持零依赖（纯数据描述），
 * 「校验失败该返回什么 HTTP 状态」属于传输层的事。schema 里写的 message 是
 * `valid.*` 消息键，翻译同样发生在 `route()` 那一层。
 */
export function parseOr400<S extends ZodTypeAny>(schema: S, input: unknown): output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw badRequest(first?.message ?? "api.badParams", result.error.flatten());
  }
  return result.data;
}
