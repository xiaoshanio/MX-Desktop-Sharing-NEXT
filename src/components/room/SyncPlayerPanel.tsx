"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

import { api } from "@/lib/api-client";
import type { SyncPlayerRow } from "@/lib/api-types";
import { useT } from "@/i18n";
import { humanizeError } from "@/lib/error-text";
import { toast } from "@/lib/toast";
import {
  ClockSync,
  HEARTBEAT_MS,
  PROBE_MS,
  SYNC_TOPIC,
  decodeSync,
  encodeSync,
  planCorrection,
  projectedPosition,
  type SyncMessage,
  type SyncStateMessage,
} from "@/lib/sync-protocol";
import { Badge, Banner, Button, Icon, IconButton, Switch, TextField, Select } from "@/ui";

/* ============================================================
   MX Player Pro — 从 CDN 按 ESM 加载
   ============================================================ */

/**
 * SDK 地址。按 INTEGRATION.md 的说明固定用 `@cdn` 这个分支标签：
 * 它始终指向最新一次 SDK 发布，而 `@latest` 会解析到仓库里最新的 Git tag
 * （不一定是 SDK 产物标签，可能直接 404）。
 */
const SDK_JS = "https://cdn.jsdelivr.net/gh/Maishan-Inc/MX-Player-Pro@cdn/mx-player.js";
const SDK_CSS = "https://cdn.jsdelivr.net/gh/Maishan-Inc/MX-Player-Pro@cdn/mx-player.css";
const CSS_ID = "mx-player-pro-css";

/** 只声明用到的那部分 API（对应 INTEGRATION.md 的「API」一节）。 */
type MXPlayerState = {
  ready: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  bufferedAhead: number;
  stalled: boolean;
  error: string | null;
};

type MXPlayerInstance = {
  load: (source: { kind: "url"; url: string }) => Promise<void>;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  getState: () => MXPlayerState;
  destroy: () => void;
  on: (event: string, handler: (payload: Record<string, unknown>) => void) => void;
  off: (event: string, handler: (payload: Record<string, unknown>) => void) => void;
};

type MXPlayerConstructor = new (options: {
  playerElm: HTMLElement | string;
  url?: string;
  label?: string;
  autoplay?: boolean;
  volume?: number;
  muted?: boolean;
  localPlayback?: boolean;
}) => MXPlayerInstance;

let sdkPromise: Promise<MXPlayerConstructor> | null = null;

/**
 * 加载 SDK。整个应用只加载一次，缓存的是 promise 所以并发调用不会重复请求。
 *
 * 用运行时 `import()` 而不是顶层 import：包不在 node_modules 里，而是 CDN 上的一个 URL。
 * 打包器看到字面量 URL 的 import 会试图在构建期解析它然后报错，所以用
 * webpackIgnore / turbopackIgnore 让这一句原样留到运行时。两个注释都写上，
 * 因为 Next 15 两种打包器都可能在用。
 *
 * SDK 是纯 ESM，没有 UMD/`window.MXPlayer` 形式，所以只能走 import()。
 */
function loadSdk(): Promise<MXPlayerConstructor> {
  sdkPromise ??= (async () => {
    if (!document.getElementById(CSS_ID)) {
      const link = document.createElement("link");
      link.id = CSS_ID;
      link.rel = "stylesheet";
      link.href = SDK_CSS;
      document.head.appendChild(link);
    }

    const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ SDK_JS)) as {
      MXPlayer?: MXPlayerConstructor;
    };
    if (!mod.MXPlayer) throw new Error("sync.sdkNoExport");
    return mod.MXPlayer;
  })().catch((err: unknown) => {
    // 失败不留缓存，让「重试」能真的重来一次
    sdkPromise = null;
    throw err;
  });

  return sdkPromise;
}

/* ============================================================
   面板
   ============================================================ */

export interface SyncPlayerPanelProps {
  code: string;
  player: SyncPlayerRow;
  /** 我能不能换片源 / 关掉它（创建者或房主） */
  canControl: boolean;
  /**
   * 房里有没有第二个人。false 时不发心跳、不探时钟、不纠偏。
   *
   * 一个人看的时候没有对齐目标：观众端收不到任何广播，而放映端每两秒往空房间
   * 发一次心跳纯属浪费。第二个人进来时他会先发 hello，放映端立刻补一次状态，
   * 所以「晚启动」不会漏掉任何东西。
   */
  syncActive: boolean;
  onClose: () => void;
  onSourceChange: (sourceUrl: string | null) => void;
}

export function SyncPlayerPanel({
  code,
  player,
  canControl,
  syncActive,
  onClose,
  onSourceChange,
}: SyncPlayerPanelProps) {
  const t = useT();
  const room = useRoomContext();
  const isHost = player.isMine;

  const holderRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<MXPlayerInstance | null>(null);
  /** 当前真正加载进播放器的地址，用来判断要不要 load() */
  const loadedUrlRef = useRef<string | null>(null);

  const [sdkError, setSdkError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [urlDraft, setUrlDraft] = useState(player.sourceUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [access, setAccess] = useState(player.access);

  /**
   * 播放器出错要同时做两件事：弹一个右上角提示（用户可能正看着别处），
   * 以及在播放器区域内留下一条说明（错误是持续状态，提示卡片会消失，
   * 而「这个播放器现在放不了」得一直看得见）。
   */
  const fail = useCallback(
    (error: unknown) => {
      const text = humanizeError(t, error);
      setErr(text);
      toast.error(text);
    },
    [t],
  );

  /** 观众端：跟不跟放映端。关掉后停止纠偏，用户可以自己拖进度。 */
  const [following, setFollowing] = useState(true);
  const followingRef = useRef(true);
  useEffect(() => {
    followingRef.current = following;
  }, [following]);

  const [drift, setDrift] = useState<number | null>(null);
  const [clockInfo, setClockInfo] = useState<{ offsetMs: number; halfRttMs: number } | null>(null);

  const clockRef = useRef(new ClockSync());
  const lastStateRef = useRef<SyncStateMessage | null>(null);
  const seqRef = useRef(0);
  /** 放映端记住上一次 timeupdate，用来识别「用户拖了进度条」 */
  const lastTickRef = useRef<{ at: number; position: number } | null>(null);

  /**
   * onSourceChange 存进 ref。
   * 它是父组件每次渲染都新建的函数，直接进依赖数组会让下面几个 effect 反复重建 ——
   * 对播放器来说那等于反复销毁重建实例，画面会一直闪。
   */
  const onSourceChangeRef = useRef(onSourceChange);
  useEffect(() => {
    onSourceChangeRef.current = onSourceChange;
  }, [onSourceChange]);

  useEffect(() => {
    setUrlDraft(player.sourceUrl ?? "");
    setAccess(player.access);
  }, [player.sourceUrl, player.access]);

  /* ---- 发消息 ---- */
  const publish = useCallback(
    (message: SyncMessage) => {
      // 房间还没连上时静默丢弃：刚进房那一两百毫秒里心跳会打空
      if (room.state !== "connected") return;
      void room.localParticipant
        .publishData(encodeSync(message), { reliable: true, topic: SYNC_TOPIC })
        .catch(() => {
          /* 对端还没就绪，下一次心跳会补上 */
        });
    },
    [room],
  );

  /** 放映端：把当前播放状态广播出去。 */
  const broadcastState = useCallback(() => {
    const instance = instanceRef.current;
    if (!instance || !isHost) return;

    const state = instance.getState();
    seqRef.current += 1;
    publish({
      t: "state",
      playerId: player.id,
      url: loadedUrlRef.current,
      paused: !state.playing,
      position: state.currentTime,
      at: Date.now(),
      rate: state.playbackRate || 1,
      seq: seqRef.current,
    });
  }, [isHost, player.id, publish]);

  /**
   * 观众：把自己对齐到放映端那份状态。
   *
   * 「严格同步」真正落地的地方。分三档纠偏（见 lib/sync-protocol.ts 的 planCorrection）：
   * 大偏差硬跳转，小偏差用倍速悄悄吃掉，够近了就把倍速放回放映端的倍速。
   *
   * 必须定义在用到它的那几个 effect **之前** —— useEffect 的依赖数组是在渲染期求值的，
   * 引用一个还没初始化的 const 会直接抛 ReferenceError。
   */
  const applyState = useCallback((state: SyncStateMessage) => {
    const instance = instanceRef.current;
    if (!instance) return;

    // 片源换了，先跟着换
    if (state.url && loadedUrlRef.current !== state.url) {
      loadedUrlRef.current = state.url;
      onSourceChangeRef.current(state.url);
      void instance
        .load({ kind: "url", url: state.url })
        .catch((error: unknown) => fail(error));
      return; // 加载完之后的心跳会把进度对上
    }

    if (!followingRef.current) return;

    const local = instance.getState();
    if (!local.ready) return;

    const target = projectedPosition(state, clockRef.current.hostNow());
    const plan = planCorrection({
      target,
      actual: local.currentTime,
      hostRate: state.rate,
      paused: state.paused,
    });
    setDrift(plan.drift);

    switch (plan.kind) {
      case "seek":
        instance.seek(plan.to);
        instance.setPlaybackRate(state.rate);
        break;
      case "rate":
        instance.setPlaybackRate(plan.rate);
        break;
      case "none":
        if (Math.abs(local.playbackRate - state.rate) > 0.001) {
          instance.setPlaybackRate(state.rate);
        }
        break;
    }

    // 播放/暂停跟着放映端走
    if (state.paused && local.playing) instance.pause();
    if (!state.paused && !local.playing) instance.play();
  }, []);

  /* ---- 创建 / 销毁播放器实例 ---- */
  useEffect(() => {
    let disposed = false;
    let instance: MXPlayerInstance | null = null;

    setReady(false);

    void loadSdk()
      .then((MXPlayer) => {
        if (disposed || !holderRef.current) return;

        instance = new MXPlayer({
          playerElm: holderRef.current,
          label: player.name,
          // 自动播放交给同步逻辑决定，不让播放器自己抢跑
          autoplay: false,
          volume: 0.85,
          // 只有放映端能拖本地文件进来 —— 观众选了本地文件别人也看不到，纯粹误导
          localPlayback: isHost,
        });
        instanceRef.current = instance;

        instance.on("ready", () => {
          setReady(true);
          setErr(null);
        });
        instance.on("error", (payload) => {
          fail(typeof payload.message === "string" ? payload.message : t("sync.playbackError"));
        });

        if (isHost) {
          // 放映端的每一次播放/暂停都要立刻让所有人知道，不能等下一次心跳
          instance.on("play", () => broadcastState());
          instance.on("pause", () => broadcastState());

          /**
           * 识别放映端拖进度条。
           *
           * 文档的事件表里没有 seek/seeked，所以只能从 timeupdate 的不连续性推：
           * 正常播放时两次 tick 之间的位置增量约等于流逝的真实时间，差得多就说明
           * 位置被跳了。不做这一步的话，拖完进度观众最多要等一个心跳周期才跟上。
           */
          instance.on("timeupdate", (payload) => {
            const currentTime = typeof payload.currentTime === "number" ? payload.currentTime : 0;
            const now = Date.now();
            const previous = lastTickRef.current;
            lastTickRef.current = { at: now, position: currentTime };
            if (!previous) return;

            const expected = previous.position + (now - previous.at) / 1000;
            if (Math.abs(currentTime - expected) > 0.5) broadcastState();
          });
        }
      })
      .catch((error: unknown) => {
        if (!disposed) setSdkError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      disposed = true;
      instanceRef.current = null;
      loadedUrlRef.current = null;
      try {
        instance?.destroy();
      } catch {
        /* 已经销毁了 */
      }
    };
    // player.id 变了就是换了一个播放器，整个重建
  }, [player.id, player.name, isHost, broadcastState, retryKey, fail, t]);

  /* ---- 放映端：把库里存的片源加载进来 ---- */
  useEffect(() => {
    if (!isHost || !ready) return;
    const instance = instanceRef.current;
    if (!instance || !player.sourceUrl) return;
    if (loadedUrlRef.current === player.sourceUrl) return;

    loadedUrlRef.current = player.sourceUrl;
    void instance
      .load({ kind: "url", url: player.sourceUrl })
      .then(() => broadcastState())
      .catch((error: unknown) => fail(error));
  }, [isHost, player.sourceUrl, ready, broadcastState, fail]);

  /* ---- 放映端：心跳 ---- */
  useEffect(() => {
    if (!isHost || !syncActive) return;
    // 先立刻广播一次，别让刚进来的人等满一个心跳周期
    broadcastState();
    const timer = setInterval(broadcastState, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [isHost, syncActive, broadcastState]);

  /* ---- 观众：进来先要一次状态，然后定期探时钟 ---- */
  useEffect(() => {
    if (isHost || !syncActive) return;

    const probe = () =>
      publish({
        t: "ping",
        playerId: player.id,
        id: Math.random().toString(36).slice(2),
        c0: Date.now(),
      });

    publish({ t: "hello", playerId: player.id });
    probe();
    // 前两秒多探几次让偏移快点收敛，之后交给固定间隔
    const warmup = [300, 900, 1800].map((delay) => setTimeout(probe, delay));
    const timer = setInterval(probe, PROBE_MS);

    return () => {
      warmup.forEach(clearTimeout);
      clearInterval(timer);
    };
  }, [isHost, syncActive, player.id, publish]);

  /* ---- 收消息 ---- */
  useEffect(() => {
    const onData = (payload: Uint8Array, ..._rest: unknown[]) => {
      // livekit 的回调签名是 (payload, participant, kind, topic)
      const topic = _rest[2];
      if (topic !== SYNC_TOPIC) return;

      const message = decodeSync(payload);
      if (!message || message.playerId !== player.id) return;

      switch (message.t) {
        case "hello":
          // 有人刚进来，立刻补一次状态，不让他等心跳
          if (isHost) broadcastState();
          return;

        case "ping":
          if (isHost) {
            publish({
              t: "pong",
              playerId: player.id,
              id: message.id,
              c0: message.c0,
              s: Date.now(),
            });
          }
          return;

        case "pong": {
          if (isHost) return;
          clockRef.current.accept({ c0: message.c0, s: message.s, c1: Date.now() });
          const stats = clockRef.current.stats;
          setClockInfo({ offsetMs: stats.offsetMs, halfRttMs: stats.halfRttMs });
          return;
        }

        case "state": {
          if (isHost) return;
          const previous = lastStateRef.current;
          // 乱序到达的旧状态要丢掉，否则会把进度往回拽
          if (previous && message.seq < previous.seq) return;
          lastStateRef.current = message;
          applyState(message);
          return;
        }
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, isHost, player.id, broadcastState, publish, applyState]);

  /* ---- 观众：两次心跳之间也持续纠偏 ---- */
  useEffect(() => {
    if (isHost || !syncActive) return;
    const timer = setInterval(() => {
      const state = lastStateRef.current;
      if (state) applyState(state);
    }, 1000);
    return () => clearInterval(timer);
  }, [isHost, syncActive, applyState]);

  /* ---- 换片源 ---- */
  async function saveSource(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await api<{ sourceUrl: string | null }>(
        `/api/rooms/${code}/sync-players/${player.id}`,
        { method: "PATCH", json: { sourceUrl: urlDraft.trim() } },
      );
      onSourceChange(res.sourceUrl);

      const instance = instanceRef.current;
      if (instance && res.sourceUrl) {
        loadedUrlRef.current = res.sourceUrl;
        await instance.load({ kind: "url", url: res.sourceUrl });
        broadcastState();
      }
      toast.success(res.sourceUrl ? t("sync.sourceSwitched") : t("sync.sourceCleared"));
    } catch (error) {
      fail(error);
    } finally {
      setSaving(false);
    }
  }

  const syncTone =
    drift === null
      ? "neutral"
      : Math.abs(drift) < 0.15
        ? "success"
        : Math.abs(drift) < 0.75
          ? "info"
          : "warning";

  return (
    <section className="mx-syncplayer">
      <header className="mx-syncplayer__bar">
        <Icon name="film" size={15} />
        <span className="mx-syncplayer__name">{player.name}</span>
        <Badge tone={isHost ? "accent" : "neutral"}>
          {isHost ? t("sync.hostedByYou") : t("sync.hostedBy", { name: player.creatorName })}
        </Badge>

        {!syncActive ? (
          // 一个人在房里时明确说清楚，否则观众会以为同步坏了
          <Badge tone="neutral">{t("sync.waitingForOthers")}</Badge>
        ) : (
          !isHost && (
            <Badge tone={syncTone} dot>
              {drift === null
                ? t("sync.waitingForHost")
                : Math.abs(drift) < 0.15
                  ? t("sync.inSync")
                  : t("sync.drift", {
                      value: `${drift > 0 ? "+" : ""}${drift.toFixed(2)}`,
                    })}
            </Badge>
          )
        )}

        <span className="mx-syncplayer__spacer" />

        <Select
          label={t("sync.accessLabel")}
          value={access}
          options={[
            { value: "members", label: t("sync.accessMembers") },
            { value: "publishers", label: t("sync.accessPublishers") },
            { value: "owner", label: t("sync.accessOwner") }
          ]}
          onChange={async (event) => {
            const value = event.target.value as typeof access;
            setAccess(value);
            try {
              await api(`/api/rooms/${code}/sync-players/${player.id}`, {
                method: "PATCH",
                json: { access: value }
              });
              toast.success(t("sync.accessUpdated"));
            } catch (error) {
              toast.error(humanizeError(t, error));
              setAccess(player.access);
            }
          }}
        />

        {canControl && (
          <IconButton size="sm" tone="danger" label={t("sync.close")} onClick={onClose}>
            <Icon name="x" size={15} />
          </IconButton>
        )}
      </header>

      {sdkError ? (
        <div className="mx-syncplayer__fallback">
          <Banner tone="error" title={t("sync.sdkFailedTitle")}>
            {t("sync.sdkFailedBody", { message: sdkError })}
            <br />
            {t("sync.sdkFailedHint")}
          </Banner>
          <Button
            variant="secondary"
            onClick={() => {
              setSdkError(null);
              setRetryKey((key) => key + 1);
            }}
          >
            <Icon name="refresh" size={15} />
            {t("common.retry")}
          </Button>
        </div>
      ) : (
        <div className="mx-syncplayer__stage">
          <div ref={holderRef} className="mx-syncplayer__mount" />
          {err ? (
            /**
             * 播放失败是持续状态，所以留在画面里 —— 右上角的提示卡片会自动消失，
             * 而「这个片源放不了」需要一直看得见（CORS / Range / 编码不支持之类）。
             */
            <div className="mx-syncplayer__empty" data-tone="error">
              <Icon name="alert" size={22} />
              <span className="mx-syncplayer__empty-title">{t("sync.badSourceTitle")}</span>
              <span className="mx-syncplayer__empty-body">{err}</span>
            </div>
          ) : (
            !player.sourceUrl && (
              <div className="mx-syncplayer__empty">
                <Icon name="film" size={22} />
                <span className="mx-syncplayer__empty-title">
                  {canControl ? t("sync.noSourceHost") : t("sync.noSourceViewer")}
                </span>
                <span className="mx-syncplayer__empty-body">{t("sync.noSourceBody")}</span>
              </div>
            )
          )}
        </div>
      )}

      <footer className="mx-syncplayer__foot">
        {canControl ? (
          <form className="mx-syncplayer__form" onSubmit={saveSource}>
            <div className="mx-syncplayer__input" style={{ minWidth: 420, flex: 1 }}>
              <TextField
                label={t("sync.urlLabel")}
                placeholder="https://example.com/video.m3u8"
                hint={t("sync.urlHint")}
                value={urlDraft}
                onChange={(event) => setUrlDraft(event.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" disabled={saving}>
              <Icon name="play" size={13} />
              {saving ? t("sync.switching") : t("sync.play")}
            </Button>
          </form>
        ) : (
          <div className="mx-syncplayer__viewer">
            <Switch
              checked={following}
              label={t("sync.follow")}
              hint={following ? t("sync.followOn") : t("sync.followOff")}
              onChange={(event) => setFollowing(event.target.checked)}
            />
            {clockInfo && following && (
              <span className="mx-text-caption mx-text-muted">
                {t("sync.clock", {
                  offset: clockInfo.offsetMs,
                  latency: clockInfo.halfRttMs,
                })}
              </span>
            )}
          </div>
        )}
      </footer>
    </section>
  );
}
