/**
 * 全局提示（右上角滑入的小卡片）。
 *
 * 刻意做成模块级的发布/订阅，而不是 React context：
 * 报错的地方经常不在组件里（fetch 包装、事件回调、LiveKit 的 onError），
 * 用 context 就得把 hook 一路传下去，或者到处套 provider。
 * 这样任何代码 `import { toast }` 就能用。
 */

export type ToastTone = "error" | "success" | "info" | "warning";

export type ToastItem = {
  id: number;
  tone: ToastTone;
  title?: string;
  message: string;
  /** 毫秒。0 = 不自动消失（错误默认不自动消失，用户得看见）。 */
  duration: number;
  /** 同一条消息重复出现的次数，界面上显示成 ×N。 */
  count: number;
};

/** 一次最多堆几张。再多就把最旧的挤掉 —— 糊满整个屏幕没人会读。 */
const MAX_VISIBLE = 4;

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 3200,
  info: 4000,
  warning: 6000,
  // 错误不自动消失：一闪而过的报错等于没报
  error: 0,
};

let seq = 0;
let items: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();

function emit(): void {
  const snapshot = items;
  for (const listener of listeners) listener(snapshot);
}

export function subscribeToasts(listener: (items: ToastItem[]) => void): () => void {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: number): void {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function clearToasts(): void {
  items = [];
  emit();
}

function push(tone: ToastTone, message: string, options?: { title?: string; duration?: number }): number {
  const text = message.trim();
  if (text === "") return -1;

  /**
   * 同一条消息不重复堆叠，只把计数加一。
   *
   * 需要这一条是因为有些错误会连着来：同步播放器的心跳每两秒一次，
   * token 续签失败会重试，网络断了每个请求都报一次。不去重的话
   * 用户会看到一整屏一样的卡片。
   */
  const existing = items.find((item) => item.message === text && item.tone === tone);
  if (existing) {
    items = items.map((item) =>
      item.id === existing.id ? { ...item, count: item.count + 1 } : item,
    );
    emit();
    return existing.id;
  }

  const item: ToastItem = {
    id: ++seq,
    tone,
    title: options?.title,
    message: text,
    duration: options?.duration ?? DEFAULT_DURATION[tone],
    count: 1,
  };

  items = [...items, item].slice(-MAX_VISIBLE);
  emit();
  return item.id;
}

export const toast = {
  error: (message: string, options?: { title?: string; duration?: number }) =>
    push("error", message, options),
  warning: (message: string, options?: { title?: string; duration?: number }) =>
    push("warning", message, options),
  success: (message: string, options?: { title?: string; duration?: number }) =>
    push("success", message, options),
  info: (message: string, options?: { title?: string; duration?: number }) =>
    push("info", message, options),
};
