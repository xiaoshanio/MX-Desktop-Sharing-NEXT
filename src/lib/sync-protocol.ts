/**
 * 同步播放器的线上协议。
 *
 * 走 LiveKit 的 data channel 点对点广播，**不落库、不经过本服务**。
 * 视频字节更是完全不碰服务端：MX Player Pro 在浏览器里直接对片源发 Range 请求
 * （见 INTEGRATION.md 的「云端资源要求」一节）。所以这里传的只有「现在播到第几秒」。
 *
 * 时钟对齐是这套东西的关键。两台机器的 Date.now() 可以差几秒，直接拿房主发来的
 * position 去 seek，误差就等于时钟差；再加上数据包的单程延迟，越同步越歪。
 * 所以先用 ping/pong 估出「本机时钟 → 房主时钟」的偏移（NTP 那套做法的简化版），
 * 之后所有位置换算都在房主时钟上做。
 */

export const SYNC_TOPIC = "mx-sync";

/** 房主广播的权威状态。position 是「在 at 这一刻播到了第几秒」。 */
export type SyncStateMessage = {
  t: "state";
  playerId: string;
  /** 片源地址。null = 房主还没选片。 */
  url: string | null;
  paused: boolean;
  /** 秒 */
  position: number;
  /** 房主时钟下的毫秒时间戳（Date.now()） */
  at: number;
  rate: number;
  /** 单调递增，用来丢弃乱序到达的旧状态 */
  seq: number;
};

/** 观众问房主：现在几点了。c0 是观众发出时的本机时间。 */
export type SyncPingMessage = { t: "ping"; playerId: string; id: string; c0: number };

/** 房主回：我收到时我的时钟是 s。原样带回 c0，观众才能算往返。 */
export type SyncPongMessage = { t: "pong"; playerId: string; id: string; c0: number; s: number };

/** 观众刚进来，请房主立刻补发一次状态，而不用等下一次心跳。 */
export type SyncHelloMessage = { t: "hello"; playerId: string };

export type SyncMessage = SyncStateMessage | SyncPingMessage | SyncPongMessage | SyncHelloMessage;

/** 房主心跳间隔。够密以便观众持续纠偏，又不至于把 data channel 打满。 */
export const HEARTBEAT_MS = 2000;
/** 时钟探测间隔。前几次密一点，收敛后放缓。 */
export const PROBE_MS = 5000;

/** 超过这个偏差就硬 seek —— 已经不是「微调能追上」的范围了。 */
export const HARD_SEEK_THRESHOLD = 0.75;
/** 小于这个偏差就认为已经同步，把倍速放回房主的倍速。 */
export const IN_SYNC_THRESHOLD = 0.15;
/** 微调时允许的最大倍速偏移（±8%）。再大就能听出音调变化了。 */
const MAX_RATE_NUDGE = 0.08;

/**
 * 序列化成可以直接交给 LiveKit publishData 的字节。
 *
 * 为什么要多拷一次：TS 5.7 起 TypedArray 带上了「底层缓冲区类型」这个泛型参数，
 * `TextEncoder.encode()` 的返回类型是 `Uint8Array<ArrayBufferLike>`（可能是
 * SharedArrayBuffer），而 publishData 只接受 `Uint8Array<ArrayBuffer>`。
 * 与其用 as 断言把这个差异藏掉，不如拷到一个明确的 ArrayBuffer 上 ——
 * 这些消息只有一两百字节，一次拷贝的代价可以忽略。
 */
export function encodeSync(message: SyncMessage): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(JSON.stringify(message));
  const out = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  out.set(encoded);
  return out;
}

export function decodeSync(payload: Uint8Array): SyncMessage | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payload)) as SyncMessage;
    return typeof parsed?.t === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 「本机时钟 → 房主时钟」的偏移估计。
 *
 * 每次 pong 得到一个样本：
 *   offset = s - (c0 + c1) / 2      （假设去程和回程延迟相等）
 *   rtt    = c1 - c0
 *
 * 取 **rtt 最小** 的那个样本，而不是求平均。理由：rtt 里的抖动几乎全部来自排队延迟，
 * 而排队只会让延迟变大、不会变小，所以最小 rtt 的那次是最接近「真实单程延迟」的一次，
 * 它给出的 offset 也最准。平均反而会被几个卡顿样本拖歪。这也是 NTP 的做法。
 */
export class ClockSync {
  private bestRtt = Infinity;
  private offsetMs = 0;
  private samples = 0;

  /** 收到 pong 时喂进来。c1 传本机收到的时刻。 */
  accept(sample: { c0: number; s: number; c1: number }): void {
    const rtt = sample.c1 - sample.c0;
    // 负的或荒谬的 rtt 说明中途改过系统时间，丢掉
    if (rtt < 0 || rtt > 10_000) return;

    this.samples++;
    if (rtt <= this.bestRtt) {
      this.bestRtt = rtt;
      this.offsetMs = sample.s - (sample.c0 + sample.c1) / 2;
    }
  }

  /** 换算成房主时钟的「现在」。没有任何样本时退化成本机时间。 */
  hostNow(): number {
    return Date.now() + this.offsetMs;
  }

  get ready(): boolean {
    return this.samples > 0;
  }

  /** 诊断用：估计的单程延迟和时钟偏移。 */
  get stats(): { offsetMs: number; halfRttMs: number; samples: number } {
    return {
      offsetMs: Math.round(this.offsetMs),
      halfRttMs: Number.isFinite(this.bestRtt) ? Math.round(this.bestRtt / 2) : 0,
      samples: this.samples,
    };
  }
}

/**
 * 房主那份状态在「现在」对应的播放位置。
 * 暂停时位置就是快照里的位置；播放时按房主时钟往前推。
 */
export function projectedPosition(state: SyncStateMessage, hostNow: number): number {
  if (state.paused) return state.position;
  const elapsed = (hostNow - state.at) / 1000;
  return Math.max(0, state.position + elapsed * state.rate);
}

export type Correction =
  | { kind: "seek"; to: number; drift: number }
  | { kind: "rate"; rate: number; drift: number }
  | { kind: "none"; drift: number };

/**
 * 该怎么追上房主。
 *
 * 分三档而不是「一律 seek」：seek 会让画面卡一下（要重新解码到关键帧），
 * 每两秒心跳都 seek 一次的话根本没法看。小偏差用倍速悄悄吃掉，
 * 观众察觉不到，几秒内自然收敛。
 */
export function planCorrection(input: {
  target: number;
  actual: number;
  hostRate: number;
  paused: boolean;
}): Correction {
  const drift = input.actual - input.target;

  // 暂停状态下不能靠倍速追，只能对齐位置
  if (input.paused) {
    return Math.abs(drift) > IN_SYNC_THRESHOLD
      ? { kind: "seek", to: input.target, drift }
      : { kind: "none", drift };
  }

  if (Math.abs(drift) > HARD_SEEK_THRESHOLD) {
    return { kind: "seek", to: input.target, drift };
  }

  if (Math.abs(drift) > IN_SYNC_THRESHOLD) {
    // 落后（drift < 0）要放快，超前要放慢。偏差越大调得越猛，但夹在 ±8% 内。
    const nudge = Math.max(-MAX_RATE_NUDGE, Math.min(MAX_RATE_NUDGE, -drift / 4));
    return { kind: "rate", rate: Number((input.hostRate * (1 + nudge)).toFixed(3)), drift };
  }

  return { kind: "none", drift };
}
