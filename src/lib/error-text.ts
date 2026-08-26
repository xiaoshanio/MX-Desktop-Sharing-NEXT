/**
 * 把各种来源的报错翻成一句用户能看懂的中文。
 *
 * 界面全是中文，但错误消息有三个来源是英文的：
 *   - livekit-client（"could not establish signal connection" 之类）
 *   - 浏览器原生（"Failed to fetch"、"NotAllowedError"）
 *   - 第三方服务的响应
 * 直接把原文弹给用户，等于让他自己去猜。所以这里按模式匹配翻一遍，
 * 认不出来的保留原文（比让人看一句「未知错误」有用）。
 */

/** 顺序有意义：先匹配更具体的模式。 */
const PATTERNS: Array<{ test: RegExp; text: string }> = [
  /* ---- LiveKit 连接 ---- */
  {
    test: /could not establish (a )?(signal|pc) connection/i,
    text: "连不上房间的媒体服务器。检查网络，或确认这个 LiveKit 节点还可用。",
  },
  {
    test: /(signal|websocket).*(closed|disconnect)/i,
    text: "和房间的连接断开了，正在重连…",
  },
  { test: /room is full|maximum number of participants/i, text: "房间人数已满。" },
  {
    test: /invalid (access )?token|token (is )?expired|jwt/i,
    text: "访问凭据无效或已过期。刷新页面会重新签发一张。",
  },
  { test: /permission denied|insufficient permissions|unauthorized/i, text: "你没有做这个操作的权限。" },
  { test: /server is (full|unavailable)|503/i, text: "媒体服务器暂时不可用，稍后再试。" },
  { test: /quota|limit exceeded/i, text: "这个 LiveKit 节点的额度用完了。" },

  /* ---- 屏幕共享 / 设备 ---- */
  {
    test: /NotAllowedError|permission.*(denied|dismissed)/i,
    text: "浏览器拒绝了屏幕共享请求。需要在地址栏的站点权限里放开。",
  },
  { test: /NotFoundError|NotReadableError/i, text: "找不到可用的采集设备，或它被别的程序占用了。" },
  { test: /NotSupportedError/i, text: "当前浏览器不支持这个功能，换 Chrome/Edge 试试。" },

  /* ---- 网络 ---- */
  { test: /failed to fetch|network ?error|load failed/i, text: "网络请求失败。检查一下网络连接。" },
  { test: /aborted|AbortError/i, text: "请求被中断了。" },
  { test: /timed? ?out/i, text: "请求超时，稍后再试。" },

  /* ---- 播放器 / 片源 ---- */
  {
    test: /CORS|cross-origin|Access-Control-Allow-Origin/i,
    text: "片源不允许本站跨域读取（CORS）。需要在存放视频的服务器上放开。",
  },
  { test: /range|206|partial content/i, text: "片源不支持 Range 请求，没法边下边播。" },
  { test: /WebCodecs|decoder|codec/i, text: "浏览器解不了这个编码。视频需要是 H.264/HEVC，音频 AAC/FLAC/Opus。" },
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

/** 报错 → 一句中文。认不出来时保留原文。 */
export function humanizeError(err: unknown): string {
  const raw = rawMessage(err);

  for (const { test, text } of PATTERNS) {
    if (test.test(raw)) return text;
  }

  // 我们自己的 API 抛的 Error 已经是中文了（见 lib/http.ts 的错误约定），原样返回
  const message = err instanceof Error ? err.message : String(err);
  return message.trim() === "" ? "操作失败，原因未知。" : message;
}
