/**
 * 把各种来源的报错翻成一句用户能看懂的话。
 *
 * 界面是多语言的，但错误消息有三个来源是**英文原文**：
 *   - livekit-client（"could not establish signal connection" 之类）
 *   - 浏览器原生（"Failed to fetch"、"NotAllowedError"）
 *   - 第三方服务的响应
 * 直接把原文弹给用户，等于让他自己去猜。所以这里按模式匹配成一个**消息键**，
 * 由调用方用当前语言渲染；认不出来的保留原文（比让人看一句「未知错误」有用）。
 */

import type { MessageKey, TFunction } from "@/i18n";

/**
 * 「服务端回了非 2xx 但没给消息」的判定。
 *
 * 刻意用鸭子类型而不是 `instanceof HttpError`：那需要在运行时 import api-client，
 * 而这个模块的价值之一就是零依赖（tests/error-text.test.mts 直接 import 它来测
 * 一百多条模式匹配，不该为此拖进一个 fetch 封装）。
 */
function isEmptyHttpError(err: unknown): err is { status: number } {
  return (
    err instanceof Error &&
    err.name === "HttpError" &&
    typeof (err as { status?: unknown }).status === "number" &&
    err.message.trim() === ""
  );
}

/** 顺序有意义：先匹配更具体的模式。 */
const PATTERNS: Array<{ test: RegExp; key: MessageKey }> = [
  /* ---- LiveKit 连接 ---- */
  { test: /could not establish (a )?(signal|pc) connection/i, key: "err.signalConnection" },
  { test: /(signal|websocket).*(closed|disconnect)/i, key: "err.disconnected" },
  { test: /room is full|maximum number of participants/i, key: "err.roomFull" },
  { test: /invalid (access )?token|token (is )?expired|jwt/i, key: "err.badToken" },
  { test: /permission denied|insufficient permissions|unauthorized/i, key: "err.permissionDenied" },
  { test: /server is (full|unavailable)|503/i, key: "err.serverUnavailable" },
  { test: /quota|limit exceeded/i, key: "err.quota" },

  /* ---- 屏幕共享 / 设备 ---- */
  { test: /NotAllowedError|permission.*(denied|dismissed)/i, key: "err.screenShareDenied" },
  { test: /NotFoundError|NotReadableError/i, key: "err.noCaptureDevice" },
  { test: /NotSupportedError/i, key: "err.unsupportedBrowser" },

  /* ---- 网络 ---- */
  { test: /failed to fetch|network ?error|load failed/i, key: "err.network" },
  { test: /aborted|AbortError/i, key: "err.aborted" },
  { test: /timed? ?out/i, key: "err.timeout" },

  /* ---- 播放器 / 片源 ---- */
  { test: /CORS|cross-origin|Access-Control-Allow-Origin/i, key: "err.cors" },
  { test: /range|206|partial content/i, key: "err.range" },
  { test: /WebCodecs|decoder|codec/i, key: "err.codec" },
];

/**
 * 这些错误不该打扰用户。
 *
 * 头一条是 React 严格模式的副作用：开发环境下 effect 会被故意执行两次
 * （挂载 → 卸载 → 再挂载），LiveKitRoom 第一次的信号连接因此在建立中途被
 * 卸载逻辑 abort 掉，抛出 "could not establish signal connection: Abort handler called"。
 * 紧接着第二次挂载会正常连上 —— 也就是说这条报错出现时功能其实是好的。
 * 弹给用户只会让人以为坏了。
 */
const BENIGN = [
  /abort handler called/i,
  /client initiated disconnect/i,
  // 用户在系统的「选择要共享的窗口」弹窗里点了取消，这是正常操作不是错误
  /permission denied by system|user (cancelled|canceled|dismissed)/i,
];

export function isBenignError(err: unknown): boolean {
  const raw = rawMessage(err);
  return BENIGN.some((pattern) => pattern.test(raw));
}

function rawMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    // livekit 的 ConnectionError 会把真实原因拼在 message 后面（": Abort handler called"），
    // 有时也挂在 cause 上，两处都看
    const cause = (err as { cause?: unknown }).cause;
    const causeText = cause instanceof Error ? ` ${cause.message}` : "";
    return `${err.name}: ${err.message}${causeText}`;
  }
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/**
 * 报错 → 当前语言的一句话。认不出来时保留原文。
 *
 * 我们自己的 API 抛的 Error 已经被服务端按调用者的语言翻好了（见 lib/http.ts 的
 * `route()`），所以走到最后那一步原样返回就是对的。
 */
export function humanizeError(t: TFunction, err: unknown): string {
  const raw = rawMessage(err);

  for (const { test, key } of PATTERNS) {
    if (test.test(raw)) return t(key);
  }

  // 服务端非 2xx 但连消息都没给（502 网关页、空响应体…）
  if (isEmptyHttpError(err)) return t("err.httpFailed", { status: err.status });

  const message = err instanceof Error ? err.message : String(err);
  if (message.trim() === "") return t("err.unknown");
  // 万一某处漏了服务端翻译，消息可能还是一个裸键 —— t.raw 认得出来就翻，认不出来原样返回
  return t.raw(message);
}
