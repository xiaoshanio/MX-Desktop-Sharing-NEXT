"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";

import { api } from "@/lib/api-client";
import type { Ban, Invite, LogRow, Member, RoomDetail, SyncPlayerRow } from "@/lib/api-types";
import { humanizeError, isBenignError } from "@/lib/error-text";
import { formatTime, roleLabel, roleTone } from "@/lib/labels";
import { toast } from "@/lib/toast";
import { AppShell, type ShellUser } from "@/components/AppShell";
import { CoachMark } from "@/components/CoachMark";
import { CopyRow } from "@/components/CopyRow";
import { ParticipantRail, type RailEntry } from "@/components/room/ParticipantRail";
import { SyncPlayerPanel } from "@/components/room/SyncPlayerPanel";
import {
  Badge,
  Banner,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Icon,
  IconButton,
  LinkButton,
  Loading,
  Modal,
  Select,
  Switch,
  Tabs,
  TextField,
} from "@/ui";

type Grant = { token: string; wsUrl: string; expiresAt: string };
type PeopleTab = "members" | "invites";
type SettingsTab = "publish" | "room" | "logs" | "bans";

export function RoomClient({ code, user }: { code: string; user: ShellUser }) {
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [grant, setGrant] = useState<Grant | null>(null);
  /** 只保留「整个房间打不开」这一种致命错误，其余都走右上角提示。 */
  const [fatal, setFatal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [syncPlayers, setSyncPlayers] = useState<SyncPlayerRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  /** 哪个弹窗开着。分享和添加成员是同一个弹窗的两个标签。 */
  const [peopleTab, setPeopleTab] = useState<PeopleTab | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const [creatingPlayer, setCreatingPlayer] = useState(false);

  /** 首次进房的推流地址引导 */
  const [tipOpen, setTipOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * 房间详情和 token 一起要。
   *
   * 刻意并发而不是「先拿详情再拿 token」：两个请求各自都要过一次 Neon（neon-http
   * 每条语句一次 HTTP），串起来等于把进房的等待时间翻倍。token 那个接口自己会
   * 校验成员资格，不依赖详情的结果，所以没有先后依赖。
   */
  const load = useCallback(async () => {
    try {
      const detailPromise = api<{ room: RoomDetail }>(`/api/rooms/${code}`);
      const tokenPromise = api<Grant>(`/api/rooms/${code}/token`, { method: "POST" }).catch(
        () => null, // 房间已关闭时签不出 token，这不是致命错误
      );

      const [detailRes, tokenRes] = await Promise.all([detailPromise, tokenPromise]);
      setDetail(detailRes.room);
      if (detailRes.room.isActive && tokenRes) setGrant(tokenRes);
    } catch (error) {
      setFatal(humanizeError(error));
    } finally {
      setLoading(false);
    }
  }, [code]);

  const loadMembers = useCallback(async () => {
    try {
      const res = await api<{ members: Member[] }>(`/api/rooms/${code}/members`);
      setMembers(res.members);
    } catch {
      /* 成员列表拿不到不影响看画面，静默 */
    }
  }, [code]);

  const loadSyncPlayers = useCallback(async () => {
    try {
      const res = await api<{ players: SyncPlayerRow[] }>(`/api/rooms/${code}/sync-players`);
      setSyncPlayers(res.players);
    } catch {
      /* 同上 */
    }
  }, [code]);

  useEffect(() => {
    void load();
    void loadMembers();
    void loadSyncPlayers();
  }, [load, loadMembers, loadSyncPlayers]);

  /** 首次进房弹一次推流地址引导。看过之后 users.ingress_tip_seen_at 就落了。 */
  useEffect(() => {
    if (!detail || user.ingressTipSeen) return;
    setTipOpen(true);
  }, [detail, user.ingressTipSeen]);

  const dismissTip = useCallback(async () => {
    setTipOpen(false);
    // 关掉弹窗后再指一下顶栏那个齿轮，告诉他以后去哪找
    setCoachOpen(true);
    try {
      await api("/api/me/ingress-tip", { method: "POST" });
    } catch {
      /* 记不上就下次再弹一遍，不值得打断用户 */
    }
  }, []);

  /**
   * token 到期前自动续签。
   * 不续的话 6 小时后连接会被服务端断开，长时间挂着看的人会莫名掉线。
   */
  useEffect(() => {
    if (!grant) return;
    const msLeft = new Date(grant.expiresAt).getTime() - Date.now();
    // 提前 5 分钟换，且至少等 30 秒，避免异常情况下打成循环
    const delay = Math.max(30_000, msLeft - 5 * 60_000);
    const timer = setTimeout(() => {
      api<Grant>(`/api/rooms/${code}/token`, { method: "POST" })
        .then(setGrant)
        .catch(() => {
          /* 续签失败就让现有连接自然走完，不打断当前观看 */
        });
    }, delay);
    return () => clearTimeout(timer);
  }, [grant, code]);

  const ownerId = useMemo(
    () => members.find((member) => member.role === "owner")?.userId ?? null,
    [members],
  );
  const canManage = detail?.isOwner ?? false;

  /* ---- 成员管理（右键菜单的落点）---- */
  const changeRole = useCallback(
    async (entry: RailEntry, role: "publisher" | "viewer") => {
      try {
        await api(`/api/rooms/${code}/members`, {
          method: "PATCH",
          json: { userId: entry.userId, role },
        });
        toast.success(
          `已把「${entry.displayName}」改成${role === "publisher" ? "可推流" : "仅观看"}`,
        );
        await loadMembers();
      } catch (error) {
        toast.error(humanizeError(error));
      }
    },
    [code, loadMembers],
  );

  const [kicking, setKicking] = useState<{ entry: RailEntry; ban: boolean } | null>(null);
  const [kickBusy, setKickBusy] = useState(false);

  const confirmKick = useCallback(async () => {
    if (!kicking) return;
    setKickBusy(true);
    try {
      const query = new URLSearchParams({ userId: kicking.entry.userId });
      if (kicking.ban) query.set("ban", "1");
      await api(`/api/rooms/${code}/members?${query}`, { method: "DELETE" });
      toast.success(
        kicking.ban
          ? `已移出「${kicking.entry.displayName}」并加入黑名单`
          : `已移出「${kicking.entry.displayName}」`,
      );
      setKicking(null);
      await loadMembers();
    } catch (error) {
      toast.error(humanizeError(error));
      setKicking(null);
    } finally {
      setKickBusy(false);
    }
  }, [kicking, code, loadMembers]);

  /* ---- 同步播放器 ---- */
  const closeSyncPlayer = useCallback(
    async (id: string) => {
      setSyncPlayers((previous) => previous.filter((player) => player.id !== id));
      try {
        await api(`/api/rooms/${code}/sync-players/${id}`, { method: "DELETE" });
        toast.success("同步播放器已关闭");
      } catch (error) {
        toast.error(humanizeError(error));
        await loadSyncPlayers();
      }
    },
    [code, loadSyncPlayers],
  );

  const patchSyncSource = useCallback((id: string, sourceUrl: string | null) => {
    setSyncPlayers((previous) =>
      previous.map((player) => (player.id === id ? { ...player, sourceUrl } : player)),
    );
  }, []);

  /* ---- 打不开 / 还没加载 ---- */
  if (fatal) {
    return (
      <AppShell user={user} heading={<span>房间 {code}</span>}>
        <section className="mx-section">
          <header className="mx-section__header">
            <div className="mx-section__heading">
              <h1 className="mx-section__title">打不开这个房间</h1>
            </div>
          </header>
          <Banner tone="error">{fatal}</Banner>
          <EmptyState
            icon="rooms"
            title="没有访问权限"
            actions={
              <LinkButton href="/dashboard" variant="primary">
                <Icon name="rooms" size={16} />
                回到房间列表
              </LinkButton>
            }
          >
            非成员看到的就是「房间不存在」—— 这是故意的，避免有人拿房间码逐个探测。
          </EmptyState>
        </section>
      </AppShell>
    );
  }

  if (loading || !detail) {
    return (
      <AppShell user={user} loading loadingLabel="正在进入房间…" heading={<span>房间 {code}</span>}>
        <span />
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      wide
      flush
      // 房间名本身就是「返回列表」的按钮：反向的箭头 + 房间名，一个目标
      heading={detail.name}
      backHref="/dashboard"
      backLabel="返回房间列表"
      actions={
        <>
          <IconButton
            size="sm"
            label="分享房间（邀请链接）"
            onClick={() => setPeopleTab("invites")}
          >
            <Icon name="share" size={16} />
          </IconButton>
          <IconButton size="sm" label="成员" onClick={() => setPeopleTab("members")}>
            <Icon name="users" size={16} />
          </IconButton>
          <IconButton
            ref={settingsButtonRef}
            size="sm"
            label="房间设置与推流信息"
            onClick={() => setSettingsTab("publish")}
          >
            <Icon name="settings" size={16} />
          </IconButton>
          {canManage && (
            <IconButton
              size="sm"
              label="新建同步播放器"
              onClick={() => setCreatingPlayer(true)}
            >
              <Icon name="film" size={16} />
            </IconButton>
          )}
        </>
      }
      status={
        <>
          <span className="mx-statusbar__item">房间码 {detail.code}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">
            节点 {detail.node.name}
            {detail.node.kind === "builtin" ? "（内置）" : ""}
          </span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item" data-tone={detail.isActive ? "success" : undefined}>
            {detail.isActive ? "活跃" : "已关闭"}
          </span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">
            {detail.isOwner ? "房主" : detail.canPublish ? "可推流" : "仅观看"}
          </span>
          {members.length > 0 && (
            <>
              <span className="mx-statusbar__divider" />
              <span className="mx-statusbar__item">成员 {members.length}</span>
            </>
          )}
        </>
      }
    >
      <div className="mx-room">
        {!detail.isActive && (
          <Banner tone="warning" title="房间已关闭">
            无法再签发 token，画面和推流都不可用。
          </Banner>
        )}

        {grant ? (
          <LiveKitRoom
            className="mx-room__live"
            serverUrl={grant.wsUrl}
            token={grant.token}
            connect
            // 观众默认不开麦不开摄像头，只订阅
            audio={false}
            video={false}
            onError={(error) => {
              /**
               * 严格模式在开发环境会把 effect 跑两遍（挂载→卸载→再挂载），
               * 第一次的信号连接因此在建立中途被 abort，抛出
               * "could not establish signal connection: Abort handler called"。
               * 紧接着第二次挂载就连上了 —— 这条报错出现时功能是好的，不该弹给用户。
               */
              if (isBenignError(error)) return;
              toast.error(humanizeError(error));
            }}
          >
            <RoomWorkspace
              code={code}
              detail={detail}
              members={members}
              ownerId={ownerId}
              canManage={canManage}
              selected={selected}
              onSelect={setSelected}
              onChangeRole={(entry, role) => void changeRole(entry, role)}
              onKick={(entry, ban) => setKicking({ entry, ban })}
              syncPlayers={syncPlayers}
              onCloseSyncPlayer={(id) => void closeSyncPlayer(id)}
              onSyncSourceChange={patchSyncSource}
            />
            <RoomAudioRenderer />
          </LiveKitRoom>
        ) : (
          <OfflineStage active={detail.isActive} />
        )}
      </div>

      {/* ---- 成员 / 邀请 ---- */}
      <Modal
        open={peopleTab !== null}
        size="lg"
        title="房间成员"
        onClose={() => setPeopleTab(null)}
      >
        <Tabs
          label="成员与邀请"
          value={peopleTab ?? "members"}
          onChange={setPeopleTab}
          items={[
            { value: "members", label: "成员", icon: "users", count: members.length },
            ...(detail.isOwner
              ? ([{ value: "invites", label: "邀请", icon: "link" }] as const)
              : []),
          ]}
        />
        {peopleTab === "members" && (
          <MembersPanel
            code={code}
            isOwner={detail.isOwner}
            members={members}
            onChanged={loadMembers}
          />
        )}
        {peopleTab === "invites" && detail.isOwner && <InvitePanel code={code} />}
      </Modal>

      {/* ---- 设置：推流信息 + 房间开关 +（房主）日志与黑名单 ---- */}
      <Modal
        open={settingsTab !== null}
        size="xl"
        title="房间设置"
        onClose={() => setSettingsTab(null)}
      >
        <Tabs
          label="房间设置"
          value={settingsTab ?? "publish"}
          onChange={setSettingsTab}
          items={[
            { value: "publish", label: "推流信息", icon: "broadcast" },
            ...(detail.isOwner
              ? ([
                  { value: "room", label: "房间", icon: "settings" },
                  { value: "logs", label: "操作日志", icon: "logs" },
                  { value: "bans", label: "黑名单", icon: "ban" },
                ] as const)
              : []),
          ]}
        />

        {settingsTab === "publish" && <ObsPanel code={code} detail={detail} />}
        {settingsTab === "room" && detail.isOwner && (
          <RoomSettingsPanel
            code={code}
            detail={detail}
            onPatched={(patch) =>
              setDetail((previous) => (previous ? { ...previous, ...patch } : previous))
            }
          />
        )}
        {settingsTab === "logs" && detail.isOwner && <LogsPanel code={code} />}
        {settingsTab === "bans" && detail.isOwner && <BansPanel code={code} />}
      </Modal>

      <CreateSyncPlayerModal
        open={creatingPlayer}
        code={code}
        onClose={() => setCreatingPlayer(false)}
        onCreated={(player) => {
          setSyncPlayers((previous) => [...previous, player]);
          setCreatingPlayer(false);
        }}
      />

      {/* ---- 首次进房引导 ---- */}
      <IngressTipModal
        open={tipOpen}
        code={code}
        detail={detail}
        onClose={() => void dismissTip()}
      />
      {coachOpen && (
        <CoachMark
          anchor={settingsButtonRef.current}
          title="推流信息就在这里"
          onDismiss={() => setCoachOpen(false)}
        >
          以后想看或重新生成 OBS 推流地址，点顶栏这个齿轮 → 「推流信息」。
        </CoachMark>
      )}

      <ConfirmDialog
        open={kicking !== null}
        danger
        busy={kickBusy}
        title={kicking?.ban ? "移出并加入黑名单" : "移出成员"}
        confirmLabel={kicking?.ban ? "移出并拉黑" : "移出"}
        body={
          kicking?.ban ? (
            <>
              把「{kicking.entry.displayName}」移出房间并加入黑名单？他会立刻断开，
              推流地址作废，之后<b>即使拿到邀请链接也进不来</b>，直到你在设置里解除拉黑。
            </>
          ) : (
            <>
              移出「{kicking?.entry.displayName}」？会同时断开他的连接并删掉他的推流地址。
              注意：他手上还有效的邀请链接仍然能让他自己回来 —— 要彻底挡住请用「移出并加入黑名单」。
            </>
          )
        }
        onConfirm={() => void confirmKick()}
        onClose={() => setKicking(null)}
      />
    </AppShell>
  );
}

/* ============================================================
   Workspace — 在 LiveKitRoom 内部，所以能读实时的参与者列表
   ============================================================ */

/**
 * 房间的两栏工作区。
 *
 * 左栏是「在线成员卡片 + 同步播放器」，右栏是屏幕画面。同步播放器排在成员卡片
 * 下面、贴着左栏底部往上堆（CSS 里的 margin-top:auto）。
 *
 * 之所以要单独一个组件而不是写在 RoomClient 里：`useParticipants()` 必须在
 * LiveKitRoom 的 context 内部调用，而「房里有几个人」这件事同时决定
 *   - 成员卡片列表
 *   - 同步播放器要不要开始对时（一个人的时候没有同步对象）
 */
function RoomWorkspace({
  code,
  detail,
  members,
  ownerId,
  canManage,
  selected,
  onSelect,
  onChangeRole,
  onKick,
  syncPlayers,
  onCloseSyncPlayer,
  onSyncSourceChange,
}: {
  code: string;
  detail: RoomDetail;
  members: Member[];
  ownerId: string | null;
  canManage: boolean;
  selected: string | null;
  onSelect: (identity: string | null) => void;
  onChangeRole: (entry: RailEntry, role: "publisher" | "viewer") => void;
  onKick: (entry: RailEntry, ban: boolean) => void;
  syncPlayers: SyncPlayerRow[];
  onCloseSyncPlayer: (id: string) => void;
  onSyncSourceChange: (id: string, sourceUrl: string | null) => void;
}) {
  const participants = useParticipants();

  /**
   * 只有房里不止一个人时才开始对时。
   *
   * 一个人看的时候没有对齐目标：观众端拿不到任何 state 广播，而放映端每两秒
   * 往空房间发一次心跳纯属浪费。等第二个人进来再启动，双方的 hello/ping 会
   * 立刻把进度对上，所以并不会因为「晚启动」而错过什么。
   */
  const syncActive = participants.length >= 2;

  return (
    <div className="mx-room__grid">
      <div className="mx-room__side">
        <ParticipantRail
          selected={selected}
          onSelect={onSelect}
          members={members}
          canManage={canManage}
          ownerId={ownerId}
          onChangeRole={onChangeRole}
          onKick={onKick}
        />

        {syncPlayers.length > 0 && (
          <div className="mx-room__sync">
            {syncPlayers.map((player) => (
              <SyncPlayerPanel
                key={player.id}
                code={code}
                player={player}
                canControl={player.isMine || canManage}
                syncActive={syncActive}
                onClose={() => onCloseSyncPlayer(player.id)}
                onSourceChange={(sourceUrl) => onSyncSourceChange(player.id, sourceUrl)}
              />
            ))}
          </div>
        )}
      </div>

      <Stage selected={selected} viewerCanPublish={detail.viewerCanPublish} />
    </div>
  );
}

/* ============================================================
   Stage — the video area. Lives inside LiveKitRoom so it can read room state.
   ============================================================ */

/**
 * 画面区：优先显示屏幕共享，其次摄像头。上线检测靠 SDK 事件，不轮询后端。
 *
 * `selected` 来自左侧成员栏：选中某个人就只放他的画面，没选就平铺全部。
 */
function Stage({
  selected,
  viewerCanPublish,
}: {
  selected: string | null;
  viewerCanPublish: boolean;
}) {
  const room = useRoomContext();
  const allTracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: false },
      // WHIP 直通（enableTranscoding: false）没给 IngressVideoOptions.source，
      // 进来的轨可能带不上 source。不收这一档的话 OBS 推上来了这里却是「无信号」。
      { source: Track.Source.Unknown, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );
  // withPlaceholder: false 时不会有占位项，但类型上仍是联合，收窄一下
  const everyTrack = allTracks.filter(isTrackReference);
  const participants = useParticipants();

  /**
   * 「我现在能不能推流」直接读 LiveKit 下发的实时权限，而不是进房时那份接口快照。
   *
   * 房主在设置里打开「允许所有人共享」时，服务端会对在线的观众调一次
   * UpdateParticipant，LiveKit 随即把新权限推给客户端。读实时权限的话按钮当场
   * 出现；读快照就得等用户刷新页面（或者等 6 小时后的 token 续签），
   * 表现就是「房主开了开关，我这边啥也没变」。
   */
  const [canPublish, setCanPublish] = useState(
    () => room.localParticipant.permissions?.canPublish ?? false,
  );

  useEffect(() => {
    const sync = () => setCanPublish(room.localParticipant.permissions?.canPublish ?? false);
    sync();
    room.on(RoomEvent.ParticipantPermissionsChanged, sync);
    room.on(RoomEvent.Connected, sync);
    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, sync);
      room.off(RoomEvent.Connected, sync);
    };
  }, [room]);

  const tracks = selected
    ? everyTrack.filter((ref) => ref.participant.identity === selected)
    : everyTrack;
  const live = tracks.length > 0;

  return (
    <div className="mx-stage" data-fill="true">
      <div className="mx-stage__bar">
        <span className="mx-stage__live" data-live={live}>
          <span className="mx-stage__live-dot" />
          {live ? "直播中" : "无信号"}
        </span>
        <span>房内 {participants.length} 人</span>
        {selected && <Badge tone="info">只看选中的人</Badge>}
        <span className="mx-stage__spacer" />
        {canPublish ? (
          <ShareControls />
        ) : (
          /**
           * 没有推流权限时给一句解释，而不是干脆什么都不显示。
           * 「为什么我这里没有共享按钮」是最容易让人以为坏了的情况。
           */
          <span className="mx-stage__note">
            {viewerCanPublish
              ? "正在获取推流权限…"
              : "你是「仅观看」—— 让房主在设置里改你的权限，或打开「允许所有人共享」"}
          </span>
        )}
      </div>

      {live ? (
        <div className="mx-stage__grid" data-single={tracks.length === 1 ? "true" : undefined}>
          {tracks.map((ref) => (
            <div
              key={`${ref.participant.identity}:${ref.publication.trackSid}`}
              className="mx-stage__tile"
            >
              <VideoTrack trackRef={ref} />
              <span className="mx-stage__tag">
                {ref.participant.name || ref.participant.identity}
                {" · "}
                {ref.participant.identity.startsWith("obs:")
                  ? "OBS 推流"
                  : ref.source === Track.Source.ScreenShare
                    ? "屏幕共享"
                    : "摄像头"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-stage__idle">
          <span className="mx-stage__idle-icon">
            <Icon name="broadcast" size={24} />
          </span>
          <span className="mx-stage__idle-title">
            {selected ? "这个人没有在共享画面" : "还没有人在推流"}
          </span>
          <span className="mx-stage__idle-body">
            {selected
              ? "点左侧的「显示全部」可以看房里其他人的画面。"
              : "推流端一连上，这里会自动出现画面 —— 不需要刷新页面。"}
          </span>
        </div>
      )}
    </div>
  );
}

/** 房间没连上时（已关闭 / 还在签 token）的占位画面。 */
function OfflineStage({ active }: { active: boolean }) {
  return (
    <div className="mx-stage">
      <div className="mx-stage__bar">
        <span className="mx-stage__live" data-live="false">
          <span className="mx-stage__live-dot" />
          未连接
        </span>
        <span className="mx-stage__spacer" />
      </div>
      <div className="mx-stage__idle">
        <span className="mx-stage__idle-icon">
          <Icon name="share" size={24} />
        </span>
        <span className="mx-stage__idle-title">{active ? "正在连接房间…" : "房间已关闭"}</span>
        <span className="mx-stage__idle-body">
          {active ? "正在签发访问 token。" : "关闭的房间不再签发 token，也不能推流。"}
        </span>
      </div>
    </div>
  );
}

/** 浏览器直接共享屏幕。不用 OBS 的那条路。 */
function ShareControls() {
  const room = useRoomContext();
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const sync = () => setSharing(room.localParticipant.isScreenShareEnabled);
    sync();
    room.on(RoomEvent.LocalTrackPublished, sync);
    room.on(RoomEvent.LocalTrackUnpublished, sync);
    return () => {
      room.off(RoomEvent.LocalTrackPublished, sync);
      room.off(RoomEvent.LocalTrackUnpublished, sync);
    };
  }, [room]);

  async function toggle() {
    setBusy(true);
    try {
      await room.localParticipant.setScreenShareEnabled(!sharing, {
        audio: true,
        // 桌面共享要清晰的文字，优先分辨率而非帧率
        resolution: { width: 1920, height: 1080, frameRate: 15 },
      });
    } catch (error) {
      // 用户在系统的「选择要共享的窗口」里点了取消也会走到这里 —— 那是正常操作，
      // isBenignError 会把它认出来，不弹提示
      if (!isBenignError(error)) toast.error(humanizeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={sharing ? "danger" : "primary"}
      disabled={busy}
      onClick={() => void toggle()}
    >
      <Icon name={sharing ? "stop" : "play"} size={13} />
      {busy ? "处理中…" : sharing ? "停止共享" : "共享我的屏幕"}
    </Button>
  );
}

/* ============================================================
   Panels
   ============================================================ */

/** 生成/取回本人在本房间的 WHIP 推流地址。首次进房的引导弹窗也复用这段逻辑。 */
function useIngress(code: string, enabled: boolean) {
  const [ingress, setIngress] = useState<{ server: string; bearerToken: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIngress(null);
      return;
    }
    api<{ ingress: { server: string; bearerToken: string } }>(`/api/rooms/${code}/ingress`)
      .then((res) => setIngress(res.ingress))
      .catch(() => setIngress(null)); // 404 = 还没生成，正常
  }, [code, enabled]);

  const generate = useCallback(
    async (rotate = false) => {
      setBusy(true);
      try {
        const res = await api<{ ingress: { server: string; bearerToken: string } }>(
          `/api/rooms/${code}/ingress${rotate ? "?rotate=1" : ""}`,
          { method: "POST" },
        );
        setIngress(res.ingress);
      } catch (error) {
        toast.error(humanizeError(error));
      } finally {
        setBusy(false);
      }
    },
    [code],
  );

  const revoke = useCallback(async () => {
    setBusy(true);
    try {
      await api(`/api/rooms/${code}/ingress`, { method: "DELETE" });
      setIngress(null);
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setBusy(false);
    }
  }, [code]);

  return { ingress, busy, generate, revoke };
}

/** 推流信息面板：一人一房一个独立 WHIP 地址。房间级闸门在「房间」那一栏。 */
function ObsPanel({ code, detail }: { code: string; detail: RoomDetail }) {
  const obsEnabled = detail.obsEnabled;
  const { ingress, busy, generate, revoke } = useIngress(code, obsEnabled);
  const [revoking, setRevoking] = useState(false);

  if (detail.node.ingressAvailable === false) {
    return (
      <Card title="OBS 推流">
        <Banner tone="warning" title="这个节点的 Ingress 不可用">
          拿不到 OBS 推流地址。你仍然可以用画面上方的「共享我的屏幕」直接从浏览器推。
        </Banner>
      </Card>
    );
  }

  if (!detail.canPublish) {
    return (
      <Card title="OBS 推流">
        <Banner tone="info" title="你是「仅观看」">
          房主把你设成了只看，所以没有推流地址。需要推流的话找房主改一下权限。
        </Banner>
      </Card>
    );
  }

  if (!obsEnabled) {
    return (
      <Card title="OBS 推流">
        <Banner tone="warning" title="房主关闭了 OBS 直播">
          这个房间现在不接受 OBS 推流，也生成不出推流地址。用画面上方的「共享我的屏幕」
          可以直接从浏览器推。
        </Banner>
      </Card>
    );
  }

  return (
    <>

      <Card
        title="我的 OBS 推流地址"
        description="绑定到「你 + 这个房间」，别人拿不到也用不了。走 WHIP 直通，不消耗 transcode 额度。"
        actions={ingress ? <Badge tone="success" dot>已生成</Badge> : <Badge tone="neutral">未生成</Badge>}
      >
        {!ingress ? (
          <div className="mx-card__actions">
            <Button variant="primary" disabled={busy} onClick={() => void generate(false)}>
              <Icon name="broadcast" size={15} />
              {busy ? "生成中…" : "生成推流地址"}
            </Button>
          </div>
        ) : (
          <>
            <ol className="mx-steps">
              <li>
                OBS → 设置 → 直播 → 服务选 <b>WHIP</b>
              </li>
              <li>把下面两个值分别填进 Server 和 Bearer Token</li>
              <li>
                WHIP 直通没有服务端 simulcast。要多档清晰度得在 OBS 32.1.0+ 自己开（1–4 层）。
              </li>
            </ol>

            <div className="mx-field">
              <span className="mx-field__label">Server</span>
              <CopyRow value={ingress.server} label="Server 地址" />
            </div>

            <div className="mx-field">
              <span className="mx-field__label">Bearer Token（就是 Stream Key）</span>
              <CopyRow value={ingress.bearerToken} secret label="Bearer Token" />
            </div>

            <div className="mx-card__actions">
              <Button variant="secondary" disabled={busy} onClick={() => void generate(true)}>
                <Icon name="refresh" size={15} />
                {busy ? "处理中…" : "重新生成"}
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => setRevoking(true)}>
                <Icon name="trash" size={15} />
                撤销
              </Button>
            </div>
            <p className="mx-text-caption">重新生成会让旧地址立即失效。</p>
          </>
        )}

        <ConfirmDialog
          open={revoking}
          danger
          busy={busy}
          title="撤销推流地址"
          confirmLabel="撤销"
          body="撤销后 OBS 会立刻推不上来，需要重新生成并在 OBS 里改一遍。确定？"
          onConfirm={async () => {
            await revoke();
            setRevoking(false);
          }}
          onClose={() => setRevoking(false)}
        />
      </Card>

      {/* 房主也在这个标签里，但闸门开关放「房间」那一栏，避免和自己的地址混在一起 */}
      {detail.isOwner && (
        <p className="mx-text-caption mx-text-muted">
          想彻底关掉这个房间的 OBS 通道？在「房间」标签里。
        </p>
      )}
    </>
  );
}

/** 房间级开关。目前只有 OBS 闸门。 */
function RoomSettingsPanel({
  code,
  detail,
  onPatched,
}: {
  code: string;
  detail: RoomDetail;
  onPatched: (patch: Partial<RoomDetail>) => void;
}) {
  const [closingGate, setClosingGate] = useState(false);
  const [gateBusy, setGateBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const obsEnabled = detail.obsEnabled;

  type RoomPatchResult = { obsEnabled: boolean; viewerCanPublish: boolean; revoked: number };

  /** 开合闸门。关的那一下服务端会把本房间所有推流地址一起作废。 */
  async function setGate(next: boolean) {
    setGateBusy(true);
    try {
      const res = await api<RoomPatchResult>(`/api/rooms/${code}`, {
        method: "PATCH",
        json: { obsEnabled: next },
      });
      onPatched({ obsEnabled: res.obsEnabled });
      setClosingGate(false);
      toast.success(next ? "已允许 OBS 推流" : `已关闭 OBS 通道，作废了 ${res.revoked} 个推流地址`);
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setGateBusy(false);
    }
  }

  /** 让「仅观看」的成员也能共享屏幕。服务端会顺手把权限推给在线的人，当场生效。 */
  async function setViewerPublish(next: boolean) {
    setShareBusy(true);
    try {
      const res = await api<RoomPatchResult>(`/api/rooms/${code}`, {
        method: "PATCH",
        json: { viewerCanPublish: next },
      });
      onPatched({ viewerCanPublish: res.viewerCanPublish });
      toast.success(next ? "现在所有成员都能共享屏幕了" : "已改回只有可推流的成员能共享");
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setShareBusy(false);
    }
  }

  return (
    <>
      <Card
        title="谁能共享屏幕"
        description="新加入的人默认是「仅观看」，所以他们看不到画面上方的「共享我的屏幕」按钮。想让所有人都能共享，打开下面这个开关；只想放开某几个人，就在画面左侧的成员卡片上右键改成「可推流」。"
        actions={
          detail.viewerCanPublish ? (
            <Badge tone="success" dot>
              所有人
            </Badge>
          ) : (
            <Badge tone="neutral">仅房主与可推流成员</Badge>
          )
        }
      >
        <Switch
          checked={detail.viewerCanPublish}
          disabled={shareBusy || !detail.isActive}
          label="允许所有成员共享屏幕"
          hint="立刻对房里在线的人生效，不用他们刷新页面。只影响浏览器共享，OBS 那条路由下面的闸门管。"
          onChange={(event) => void setViewerPublish(event.target.checked)}
        />
      </Card>

      <Card
        title="OBS 直播闸门"
        description="只管 OBS/WHIP 这条路。浏览器的「共享我的屏幕」是另一条路（WebRTC 直连），不受它影响。"
        actions={
          obsEnabled ? <Badge tone="success" dot>已开启</Badge> : <Badge tone="neutral">已关闭</Badge>
        }
      >
        <Switch
          checked={obsEnabled}
          disabled={gateBusy || !detail.isActive}
          label="允许 OBS 往这个房间推流"
          hint="关闭会立刻掐断正在推的 OBS，并作废本房间已生成的全部推流地址。"
          onChange={(event) => {
            // 关是破坏性的（地址会作废），先确认；开则直接生效
            if (event.target.checked) void setGate(true);
            else setClosingGate(true);
          }}
        />
      </Card>

      <ConfirmDialog
        open={closingGate}
        danger
        busy={gateBusy}
        title="关闭 OBS 直播"
        confirmLabel="关闭"
        body="正在推的 OBS 会立刻断开，本房间所有人已生成的推流地址一并作废。重新打开后要各自再生成一次，并把 OBS 里的 Bearer Token 换成新的。确定关闭？"
        onConfirm={() => void setGate(false)}
        onClose={() => setClosingGate(false)}
      />
    </>
  );
}

function MembersPanel({
  code,
  isOwner,
  members,
  onChanged,
}: {
  code: string;
  isOwner: boolean;
  members: Member[];
  onChanged: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "publisher">("viewer");
  const [busy, setBusy] = useState(false);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(`/api/rooms/${code}/members`, { method: "POST", json: { email, role } });
      setEmail("");
      await onChanged();
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="成员"
      description="不在这张表里的人签不出 token，也就订阅不到任何画面 —— 这是协议层的限制，不是前端过滤。改权限和踢人在画面左侧的成员卡片上右键。"
      actions={<Badge tone="neutral">{members.length} 人</Badge>}
    >

      <div className="mx-table-wrap">
        <table className="mx-table">
          <thead>
            <tr>
              <th>成员</th>
              <th data-shrink="true">权限</th>
              <th data-shrink="true">状态</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId}>
                <td>
                  <span className="mx-cell">
                    <span className="mx-cell__label">{member.displayName}</span>
                    <span className="mx-cell__hint">{member.email}</span>
                  </span>
                </td>
                <td data-shrink="true">
                  <Badge tone={roleTone(member.role)}>{roleLabel(member.role)}</Badge>
                </td>
                <td data-shrink="true">
                  {member.isOnline ? (
                    <Badge tone="success" dot>
                      在线
                    </Badge>
                  ) : (
                    <Badge tone="neutral">离线</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOwner && (
        <>
          <hr className="mx-card__divider" />
          <form className="mx-field-row" onSubmit={add}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <TextField
                label="邀请已注册的用户"
                type="email"
                required
                placeholder="user@example.com"
                hint="对方需要先注册本站账号。没账号的人用「邀请」标签页发链接。"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div style={{ width: 150 }}>
              <Select
                label="权限"
                value={role}
                onChange={(event) => setRole(event.target.value as "viewer" | "publisher")}
                options={[
                  { value: "viewer", label: "仅观看" },
                  { value: "publisher", label: "可推流" },
                ]}
              />
            </div>
            <Button type="submit" variant="primary" disabled={busy}>
              <Icon name="plus" size={15} />
              添加
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

/** 邀请链接：房主不必知道对方邮箱就能拉人。 */
function InvitePanel({ code }: { code: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [role, setRole] = useState<"viewer" | "publisher">("viewer");
  const [expires, setExpires] = useState("24");
  const [maxUses, setMaxUses] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<Invite | null>(null);

  const load = useCallback(async () => {
    const res = await api<{ invites: Invite[] }>(`/api/rooms/${code}/invites`);
    setInvites(res.invites);
  }, [code]);

  useEffect(() => {
    load().catch((error) => toast.error(humanizeError(error)));
  }, [load]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ joinUrl: string }>(`/api/rooms/${code}/invites`, {
        method: "POST",
        json: {
          role,
          expiresInHours: expires.trim() === "" ? null : Number(expires),
          maxUses: maxUses.trim() === "" ? null : Number(maxUses),
        },
      });
      setFresh(res.joinUrl);
      await load();
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!revoking) return;
    setBusy(true);
    try {
      await api(`/api/rooms/${code}/invites?id=${revoking.id}`, { method: "DELETE" });
      setRevoking(null);
      await load();
    } catch (error) {
      toast.error(humanizeError(error));
      setRevoking(null);
    } finally {
      setBusy(false);
    }
  }

  const active = invites.filter((invite) => !invite.revokedAt);

  return (
    <Card
      title="邀请链接"
      description="对方打开链接、登录（或注册）后自动入房。链接只在创建时显示一次，之后库里只有哈希。"
      actions={<Badge tone="neutral">{active.length} 个有效</Badge>}
    >

      {fresh && (
        <Banner tone="success" title="新链接已生成，请立刻复制">
          <span className="mx-text-caption">这一次之后就再也看不到它了。</span>
          <div style={{ marginTop: "var(--mx-space-sm)" }}>
            <CopyRow value={fresh} label="邀请链接" />
          </div>
        </Banner>
      )}

      <form className="mx-field-row" onSubmit={create}>
        <div style={{ width: 150 }}>
          <Select
            label="权限"
            value={role}
            onChange={(event) => setRole(event.target.value as "viewer" | "publisher")}
            options={[
              { value: "viewer", label: "仅观看" },
              { value: "publisher", label: "可推流" },
            ]}
          />
        </div>
        <div style={{ width: 170 }}>
          <TextField
            label="有效小时数"
            type="number"
            min={1}
            placeholder="空 = 永久"
            value={expires}
            onChange={(event) => setExpires(event.target.value)}
          />
        </div>
        <div style={{ width: 170 }}>
          <TextField
            label="可用次数"
            type="number"
            min={1}
            placeholder="空 = 不限"
            value={maxUses}
            onChange={(event) => setMaxUses(event.target.value)}
          />
        </div>
        <Button type="submit" variant="primary" disabled={busy}>
          <Icon name="link" size={15} />
          {busy ? "生成中…" : "生成链接"}
        </Button>
      </form>

      {active.length > 0 && (
        <div className="mx-table-wrap">
          <table className="mx-table">
            <thead>
              <tr>
                <th data-shrink="true">权限</th>
                <th data-shrink="true">已用</th>
                <th>过期时间</th>
                <th data-shrink="true" data-align="right" />
              </tr>
            </thead>
            <tbody>
              {active.map((invite) => (
                <tr key={invite.id}>
                  <td data-shrink="true">
                    <Badge tone={roleTone(invite.role)}>{roleLabel(invite.role)}</Badge>
                  </td>
                  <td data-shrink="true">
                    {invite.useCount}
                    <span className="mx-text-muted">
                      {invite.maxUses === null ? " / 不限" : ` / ${invite.maxUses}`}
                    </span>
                  </td>
                  <td>
                    {invite.expiresAt ? (
                      formatTime(invite.expiresAt)
                    ) : (
                      <span className="mx-text-muted">永久</span>
                    )}
                  </td>
                  <td data-shrink="true" data-align="right">
                    <Button variant="secondary" size="sm" onClick={() => setRevoking(invite)}>
                      撤销
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={revoking !== null}
        danger
        busy={busy}
        title="撤销邀请链接"
        confirmLabel="撤销"
        body="撤销后这条链接立刻失效，已经用它入房的人不受影响。"
        onConfirm={() => void revoke()}
        onClose={() => setRevoking(null)}
      />
    </Card>
  );
}

/** 房间黑名单。被拉黑的人即使拿到邀请链接也进不来。 */
function BansPanel({ code }: { code: string }) {
  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ bans: Ban[] }>(`/api/rooms/${code}/bans`);
      setBans(res.bans);
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  async function unban(userId: string) {
    setBusy(true);
    try {
      await api(`/api/rooms/${code}/bans?userId=${userId}`, { method: "DELETE" });
      await load();
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="黑名单"
      description="在这张表里的人进不了这个房间 —— 邀请链接对他们也无效。解除拉黑不会自动把人加回成员，需要你再请他一次。"
      actions={<Badge tone="neutral">{bans.length} 人</Badge>}
    >

      {loading ? (
        <Loading />
      ) : bans.length === 0 ? (
        <EmptyState icon="ban" title="黑名单是空的">
          在画面左侧的成员卡片上右键，选「移出并加入黑名单」就会出现在这里。
        </EmptyState>
      ) : (
        <div className="mx-table-wrap">
          <table className="mx-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>拉黑时间</th>
                <th data-shrink="true" data-align="right" />
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => (
                <tr key={ban.userId}>
                  <td>
                    <span className="mx-cell">
                      <span className="mx-cell__label">{ban.displayName}</span>
                      <span className="mx-cell__hint">{ban.email}</span>
                    </span>
                  </td>
                  <td>{formatTime(ban.createdAt)}</td>
                  <td data-shrink="true" data-align="right">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void unban(ban.userId)}
                    >
                      解除拉黑
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** 房间操作日志 —— 排查用。 */
function LogsPanel({ code }: { code: string }) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ logs: LogRow[] }>(`/api/rooms/${code}/logs`);
      setLogs(res.logs);
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card
      title="操作日志"
      description="房间里发生过的动作，按时间倒序。"
      actions={
        <Button variant="secondary" size="sm" onClick={() => void load()}>
          <Icon name="refresh" size={14} />
          刷新
        </Button>
      }
    >
      {loading ? (
        <Loading />
      ) : logs.length === 0 ? (
        <EmptyState icon="logs" title="暂无记录">
          建房、生成推流地址、成员进出这些动作都会记在这里。
        </EmptyState>
      ) : (
        <div className="mx-logs">
          {logs.map((log) => (
            <div key={log.id} className="mx-log">
              <span className="mx-log__time">{formatTime(log.createdAt)}</span>
              <span className="mx-log__action">{log.action}</span>
              <span className="mx-log__actor">{log.actor ?? "系统"}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   弹窗
   ============================================================ */

function CreateSyncPlayerModal({
  open,
  code,
  onClose,
  onCreated,
}: {
  open: boolean;
  code: string;
  onClose: () => void;
  onCreated: (player: SyncPlayerRow) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ player: SyncPlayerRow }>(`/api/rooms/${code}/sync-players`, {
        method: "POST",
        json: { name: name.trim() },
      });
      setName("");
      onCreated(res.player);
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="新建同步播放器" onClose={onClose}>
      <form className="mx-form" onSubmit={submit}>
        <p className="mx-text-caption">
          建好之后它会出现在画面右侧。你（创建者）就是放映端 ——
          你的播放进度是权威的，房里其他人自动对齐到你这里。
          视频由每个人的浏览器直连片源读取，<b>不经过本站服务器，也不经过 LiveKit</b>。
        </p>

        <TextField
          label="播放器名字"
          required
          maxLength={60}
          placeholder="例如：周五观影"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <Button type="submit" variant="primary" full disabled={busy || name.trim() === ""}>
          <Icon name="film" size={15} />
          {busy ? "创建中…" : "创建"}
        </Button>
      </form>
    </Modal>
  );
}

/**
 * 首次进房的引导弹窗：把推流地址直接摆在眼前。
 *
 * 刻意**不**自动生成地址 —— 生成会在 LiveKit 侧真的建一个 ingress 资源，
 * 而大部分人第一次进房只是来看的。已经有地址就显示，没有就给一个按钮。
 */
function IngressTipModal({
  open,
  code,
  detail,
  onClose,
}: {
  open: boolean;
  code: string;
  detail: RoomDetail;
  onClose: () => void;
}) {
  const publishable = detail.canPublish && detail.obsEnabled && detail.node.ingressAvailable !== false;
  const { ingress, busy, generate } = useIngress(code, open && publishable);

  return (
    <Modal
      open={open}
      title="欢迎，先认一下推流地址"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          知道了
        </Button>
      }
    >
      <p>
        这个房间有两条把画面推上来的路：画面上方的<b>「共享我的屏幕」</b>
        （浏览器直连，点一下就能用），以及下面这个 <b>OBS 推流地址</b>。
      </p>

      {!publishable ? (
        <Banner tone="info" title="你这个房间暂时没有推流地址">
          {!detail.canPublish
            ? "房主把你设成了「仅观看」。"
            : !detail.obsEnabled
              ? "房主关闭了这个房间的 OBS 通道。"
              : "这个节点的 Ingress 不可用。"}
          <br />
          仍然可以用「共享我的屏幕」从浏览器直接推。
        </Banner>
      ) : ingress ? (
        <>
          <div className="mx-field">
            <span className="mx-field__label">Server（OBS → 设置 → 直播 → 服务选 WHIP）</span>
            <CopyRow value={ingress.server} label="Server 地址" />
          </div>
          <div className="mx-field">
            <span className="mx-field__label">Bearer Token（就是 Stream Key）</span>
            <CopyRow value={ingress.bearerToken} secret label="Bearer Token" />
          </div>
        </>
      ) : (
        <>
          <p className="mx-text-caption">
            你还没生成过推流地址。它绑定到「你 + 这个房间」，别人拿不到也用不了。
          </p>
          <Button variant="secondary" disabled={busy} onClick={() => void generate(false)}>
            <Icon name="broadcast" size={15} />
            {busy ? "生成中…" : "现在生成"}
          </Button>
        </>
      )}
    </Modal>
  );
}
