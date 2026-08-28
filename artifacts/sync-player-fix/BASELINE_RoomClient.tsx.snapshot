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
import type { Ban, Invite, LogRow, Member, RoomDetail, SyncPlayerRow, RoomNodeRow } from "@/lib/api-types";
import { RichText, useI18n, useT } from "@/i18n";
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
  Slider,
  Switch,
  Tabs,
  TextField,
} from "@/ui";

type Grant = { token: string; wsUrl: string; expiresAt: string };
type PeopleTab = "members" | "invites";
type SettingsTab = "publish" | "room" | "nodes" | "logs" | "bans";

export function RoomClient({ code, user }: { code: string; user: ShellUser }) {
  const t = useT();
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [grant, setGrant] = useState<Grant | null>(null);
  /** 只保留「整个房间打不开」这一种致命错误，其余都走右上角提示。 */
  const [fatal, setFatal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [syncPlayers, setSyncPlayers] = useState<SyncPlayerRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  /** 哪个弹窗开着。分享和添加成员是同一个弹窗的两个标签。 */
  const [peopleTab, setPeopleTab] = useState<PeopleTab | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const [creatingPlayer, setCreatingPlayer] = useState(false);
  const [granting, setGranting] = useState<RailEntry | null>(null);

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
      setFatal(humanizeError(t, error));
    } finally {
      setLoading(false);
    }
  }, [code, t]);

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

  useEffect(() => {
    setActiveRoom((current) =>
      current && syncPlayers.some((player) => player.id === current)
        ? current
        : (syncPlayers[0]?.id ?? null),
    );
  }, [syncPlayers]);

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
          t("room.roleChanged", {
            name: entry.displayName,
            role: role === "publisher" ? t("label.role.publisher") : t("label.role.viewer"),
          }),
        );
        await loadMembers();
      } catch (error) {
        toast.error(humanizeError(t, error));
      }
    },
    [code, loadMembers, t],
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
          ? t("room.kickedBanned", { name: kicking.entry.displayName })
          : t("room.kicked", { name: kicking.entry.displayName }),
      );
      setKicking(null);
      await loadMembers();
    } catch (error) {
      toast.error(humanizeError(t, error));
      setKicking(null);
    } finally {
      setKickBusy(false);
    }
  }, [kicking, code, loadMembers, t]);

  /* ---- 同步播放器 ---- */
  const closeSyncPlayer = useCallback(
    async (id: string) => {
      setSyncPlayers((previous) => previous.filter((player) => player.id !== id));
      try {
        await api(`/api/rooms/${code}/sync-players/${id}`, { method: "DELETE" });
        toast.success(t("sync.closed"));
      } catch (error) {
        toast.error(humanizeError(t, error));
        await loadSyncPlayers();
      }
    },
    [code, loadSyncPlayers, t],
  );

  const patchSyncSource = useCallback((id: string, sourceUrl: string | null) => {
    setSyncPlayers((previous) =>
      previous.map((player) => (player.id === id ? { ...player, sourceUrl } : player)),
    );
  }, []);

  /* ---- 打不开 / 还没加载 ---- */
  if (fatal) {
    return (
      <AppShell user={user} heading={<span>{t("room.heading", { code })}</span>}>
        <section className="mx-section">
          <header className="mx-section__header">
            <div className="mx-section__heading">
              <h1 className="mx-section__title">{t("room.fatalTitle")}</h1>
            </div>
          </header>
          <Banner tone="error">{fatal}</Banner>
          <EmptyState
            icon="rooms"
            title={t("room.fatal.emptyTitle")}
            actions={
              <LinkButton href="/dashboard" variant="primary">
                <Icon name="rooms" size={16} />
                {t("room.fatal.back")}
              </LinkButton>
            }
          >
            {t("room.fatal.body")}
          </EmptyState>
        </section>
      </AppShell>
    );
  }

  if (loading || !detail) {
    return (
      <AppShell
        user={user}
        loading
        loadingLabel={t("room.entering")}
        heading={<span>{t("room.heading", { code })}</span>}
      >
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
      backLabel={t("room.backLabel")}
      actions={
        <>
          <IconButton
            size="sm"
            label={t("room.action.share")}
            onClick={() => setPeopleTab("invites")}
          >
            <Icon name="share" size={16} />
          </IconButton>
          <IconButton
            size="sm"
            label={t("room.action.members")}
            onClick={() => setPeopleTab("members")}
          >
            <Icon name="users" size={16} />
          </IconButton>
          <IconButton
            ref={settingsButtonRef}
            size="sm"
            label={t("room.action.settings")}
            onClick={() => setSettingsTab("publish")}
          >
            <Icon name="signal" size={16} />
          </IconButton>
          {canManage && (
            <IconButton
              size="sm"
              label={t("room.action.newPlayer")}
              onClick={() => setCreatingPlayer(true)}
            >
              <Icon name="film" size={16} />
            </IconButton>
          )}
        </>
      }
      status={
        <>
          <span className="mx-statusbar__item">
            {t("room.stat.code", { code: detail.code })}
          </span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">
            {t("room.stat.node", { name: detail.node.name })}
            {detail.node.kind === "builtin" ? t("room.stat.nodeBuiltin") : ""}
          </span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item" data-tone={detail.isActive ? "success" : undefined}>
            {detail.isActive ? t("room.stat.active") : t("room.stat.closed")}
          </span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">
            {detail.isOwner
              ? t("label.role.owner")
              : detail.canPublish
                ? t("label.role.publisher")
                : t("label.role.viewer")}
          </span>
          {members.length > 0 && (
            <>
              <span className="mx-statusbar__divider" />
              <span className="mx-statusbar__item">
                {t("room.stat.members", { count: members.length })}
              </span>
            </>
          )}
        </>
      }
    >
      <div className="mx-room">
        {!detail.isActive && (
          <Banner tone="warning" title={t("room.closedTitle")}>
            {t("room.closedBody")}
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
              toast.error(humanizeError(t, error));
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
              onGrant={(entry) => setGranting(entry)}
              syncPlayers={syncPlayers}
              onCloseSyncPlayer={(id) => void closeSyncPlayer(id)}
              onSyncSourceChange={patchSyncSource}
              activeRoom={activeRoom}
              onActiveRoomChange={setActiveRoom}
              onCreateRoom={() => setCreatingPlayer(true)}
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
        title={t("room.people.title")}
        onClose={() => setPeopleTab(null)}
      >
        <Tabs
          label={t("room.people.tabs")}
          value={peopleTab ?? "members"}
          onChange={setPeopleTab}
          items={[
            {
              value: "members",
              label: t("room.people.tabMembers"),
              icon: "users",
              count: members.length,
            },
            ...(detail.isOwner
              ? ([
                  { value: "invites", label: t("room.people.tabInvites"), icon: "link" },
                ] as const)
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
        title={t("room.settings.title")}
        onClose={() => setSettingsTab(null)}
      >
        <Tabs
          label={t("room.settings.tabs")}
          value={settingsTab ?? "publish"}
          onChange={setSettingsTab}
          items={[
            { value: "publish", label: t("room.settings.tabPublish"), icon: "broadcast" },
            ...(detail.isOwner
              ? ([
                  { value: "room", label: t("room.settings.tabRoom"), icon: "sliders" },
                  { value: "nodes", label: "线路", icon: "node" },
                  { value: "logs", label: t("room.settings.tabLogs"), icon: "logs" },
                  { value: "bans", label: t("room.settings.tabBans"), icon: "ban" },
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
        {settingsTab === "nodes" && <RoomNodesPanel code={code} isOwner={detail.isOwner} />}
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
          title={t("room.coach.title")}
          onDismiss={() => setCoachOpen(false)}
        >
          {t("room.coach.body")}
        </CoachMark>
      )}

      <ConfirmDialog
        open={kicking !== null}
        danger
        busy={kickBusy}
        title={kicking?.ban ? t("room.kick.titleBan") : t("room.kick.title")}
        confirmLabel={kicking?.ban ? t("room.kick.confirmBan") : t("room.kick.confirm")}
        body={
          <RichText
            text={
              kicking?.ban
                ? t("room.kick.bodyBan", { name: kicking.entry.displayName })
                : t("room.kick.body", { name: kicking?.entry.displayName ?? "" })
            }
          />
        }
        onConfirm={() => void confirmKick()}
        onClose={() => setKicking(null)}
      />
      <GrantNodeModal code={code} entry={granting} onClose={() => setGranting(null)} />
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
  onGrant,
  syncPlayers,
  onCloseSyncPlayer,
  onSyncSourceChange,
  activeRoom,
  onActiveRoomChange,
  onCreateRoom,
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
  onGrant: (entry: RailEntry) => void;
  syncPlayers: SyncPlayerRow[];
  onCloseSyncPlayer: (id: string) => void;
  onSyncSourceChange: (id: string, sourceUrl: string | null) => void;
  activeRoom: string | null;
  onActiveRoomChange: (id: string | null) => void;
  onCreateRoom: () => void;
}) {
  const participants = useParticipants();
  const t = useT();
  // 移除 stageMode，改用左侧房间列表选择

  /**
   * 只有房里不止一个人时才开始对时。
   *
   * 一个人看的时候没有对齐目标：观众端拿不到任何 state 广播，而放映端每两秒
   * 往空房间发一次心跳纯属浪费。等第二个人进来再启动，双方的 hello/ping 会
   * 立刻把进度对上，所以并不会因为「晚启动」而错过什么。
   */
  const syncActive = participants.length >= 2;

  // 当前激活的房间对象
  const currentRoom = activeRoom
    ? (syncPlayers.find((p) => p.id === activeRoom) ?? null)
    : null;

  return (
    <div className="mx-room__grid">
      {/* 左侧：同步播放器列表 + 成员栏 */}
      <div className="mx-room__side">
        {/* 成员栏 */}
        <ParticipantRail
          selected={selected}
          onSelect={onSelect}
          members={members}
          canManage={canManage}
          ownerId={ownerId}
          onChangeRole={onChangeRole}
          onKick={onKick}
          onGrant={onGrant}
        />

        {/* 同步播放器列表位于左栏底部 */}
        <aside className="mx-room__rooms mx-room__rooms--bottom">
          <div className="mx-room__rooms-header">
            <h3 className="mx-room__rooms-title">{t("channel.rooms.title")}</h3>
          </div>
          <div className="mx-room__rooms-list">
            {syncPlayers.map((player) => (
              <button key={player.id} type="button" className={`mx-room__rooms-item ${activeRoom === player.id ? "active" : ""}`} onClick={() => onActiveRoomChange(player.id)}>
                <Icon name="film" size={16} />
                <span className="mx-room__rooms-item-name">{player.name}</span>
              </button>
            ))}
          </div>
          {syncPlayers.length === 0 && <div className="mx-room__rooms-empty"><p>{t("channel.rooms.emptyTitle")}</p></div>}
        </aside>

      </div>

      {/* 右侧：大屏幕播放器 */}
      <Stage
        selected={selected}
        viewerCanPublish={detail.viewerCanPublish}
        code={code}
        canManage={canManage}
        currentRoom={currentRoom}
        syncActive={syncActive}
        onCloseSyncPlayer={onCloseSyncPlayer}
        onSyncSourceChange={onSyncSourceChange}
      />
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
  code,
  canManage,
  currentRoom,
  syncActive,
  onCloseSyncPlayer,
  onSyncSourceChange,
}: {
  selected: string | null;
  viewerCanPublish: boolean;
  code: string;
  canManage: boolean;
  currentRoom: SyncPlayerRow | null;
  syncActive: boolean;
  onCloseSyncPlayer: (id: string) => void;
  onSyncSourceChange: (id: string, sourceUrl: string | null) => void;
}) {
  const t = useT();
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

  // 根据是否选中房间自动切换模式
  const stageMode = currentRoom ? "player" : "screen";

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
    <div className="mx-stage" data-fill="true" data-mode={stageMode}>
      {/* 播放器模式下这条顶栏整个撤掉：信号灯在这里是误导（看的不是直播流），
          「房内 N 人」和地址栏都并进了同步播放器自己的顶栏。 */}
      {stageMode === "screen" && (
        <div className="mx-stage__bar">
          <span className="mx-stage__live" data-live={live}>
            <span className="mx-stage__live-dot" />
            {live ? t("room.stage.live") : t("room.stage.noSignal")}
          </span>
          <div className="mx-stage__presence">
            <span>{t("room.stage.inRoom", { count: participants.length })}</span>
          </div>
          {selected && <Badge tone="info">{t("room.stage.onlySelected")}</Badge>}
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
                ? t("room.stage.gettingPermission")
                : t("room.stage.viewerOnly")}
            </span>
          )}
        </div>
      )}

      {stageMode === "screen" && live ? (
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
                  ? t("room.stage.tagObs")
                  : ref.source === Track.Source.ScreenShare
                    ? t("room.stage.tagScreen")
                    : t("room.stage.tagCamera")}
              </span>
              <button
                type="button"
                className="mx-stage__fullscreen"
                aria-label={t("room.stage.fullscreen")}
                onClick={(event) => {
                  const tile = (event.currentTarget as HTMLElement).closest(".mx-stage__tile");
                  if (tile) {
                    if (document.fullscreenElement) {
                      void document.exitFullscreen();
                    } else {
                      void tile.requestFullscreen();
                    }
                  }
                }}
              >
                <Icon name="maximize" size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : stageMode === "screen" && !live ? (
        <div className="mx-stage__idle">
          <span className="mx-stage__idle-icon">
            <Icon name="broadcast" size={24} />
          </span>
          <span className="mx-stage__idle-title">
            {selected ? t("room.stage.idleSelectedTitle") : t("room.stage.idleTitle")}
          </span>
          <span className="mx-stage__idle-body">
            {selected ? t("room.stage.idleSelectedBody") : t("room.stage.idleBody")}
          </span>
        </div>
        ) : currentRoom ? (
          <SyncPlayerPanel
            key={currentRoom.id}
            code={code}
            player={currentRoom}
            canControl={currentRoom.isMine || canManage}
            syncActive={syncActive}
            onClose={() => onCloseSyncPlayer(currentRoom.id)}
            onSourceChange={(sourceUrl) => onSyncSourceChange(currentRoom.id, sourceUrl)}
          />
        ) : null}
    </div>
  );
}

/** 房间没连上时（已关闭 / 还在签 token）的占位画面。 */
function OfflineStage({ active }: { active: boolean }) {
  const t = useT();
  return (
    <div className="mx-stage">
      <div className="mx-stage__bar">
        <span className="mx-stage__live" data-live="false">
          <span className="mx-stage__live-dot" />
          {t("room.offline.notConnected")}
        </span>
        <span className="mx-stage__spacer" />
      </div>
      <div className="mx-stage__idle">
        <span className="mx-stage__idle-icon">
          <Icon name="share" size={24} />
        </span>
        <span className="mx-stage__idle-title">
          {active ? t("room.offline.connecting") : t("room.offline.closed")}
        </span>
        <span className="mx-stage__idle-body">
          {active ? t("room.offline.connectingBody") : t("room.offline.closedBody")}
        </span>
      </div>
    </div>
  );
}

/** 浏览器直接共享屏幕。不用 OBS 的那条路。 */
function ShareControls() {
  const t = useT();
  const room = useRoomContext();
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 共享参数状态
  const [resolution, setResolution] = useState(1080);
  const [frameRate, setFrameRate] = useState(30);
  const [bitrate, setBitrate] = useState(3000);
  const [codec, setCodec] = useState<"auto" | "vp8" | "vp9" | "h264" | "av1">("auto");

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

  const resolutionPresets = [
    { value: 720, label: "1280×720 (HD)" },
    { value: 1080, label: "1920×1080 (Full HD)" },
    { value: 1440, label: "2560×1440 (2K)" },
    { value: 2160, label: "3840×2160 (4K)" },
  ];

  const currentResolution = resolutionPresets.find((p) => p.value === resolution);
  const [width, height] =
    resolution === 720
      ? [1280, 720]
      : resolution === 1080
        ? [1920, 1080]
        : resolution === 1440
          ? [2560, 1440]
          : [3840, 2160];

  async function toggle() {
    setBusy(true);
    try {
      await room.localParticipant.setScreenShareEnabled(!sharing, {
        audio: true,
        resolution: { width, height, frameRate },
      });

      // 如果指定了编码器，尝试应用（需要浏览器支持）
      if (!sharing && codec !== "auto") {
        const tracks = room.localParticipant.videoTrackPublications;
        for (const [, pub] of tracks) {
          if (pub.source === Track.Source.ScreenShare && pub.track) {
            const sender = await (pub.track as any).sender;
            if (sender) {
              const params = sender.getParameters();
              if (params.codecs) {
                const preferredCodec = params.codecs.find(
                  (c: { mimeType: string }) =>
                    c.mimeType.toLowerCase().includes(codec)
                );
                if (preferredCodec) {
                  params.codecs = [preferredCodec, ...params.codecs.filter((c: any) => c !== preferredCodec)];
                  await sender.setParameters(params);
                }
              }
              // 应用码率设置
              if (params.encodings && params.encodings.length > 0) {
                params.encodings[0].maxBitrate = bitrate * 1000;
                await sender.setParameters(params);
              }
            }
          }
        }
      }
    } catch (error) {
      if (!isBenignError(error)) toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  function applyPreset(preset: "presentation" | "balanced" | "smooth" | "hq") {
    switch (preset) {
      case "presentation":
        setResolution(1080);
        setFrameRate(15);
        setBitrate(2500);
        setCodec("auto");
        break;
      case "balanced":
        setResolution(1080);
        setFrameRate(30);
        setBitrate(3000);
        setCodec("auto");
        break;
      case "smooth":
        setResolution(720);
        setFrameRate(60);
        setBitrate(4000);
        setCodec("auto");
        break;
      case "hq":
        setResolution(1440);
        setFrameRate(30);
        setBitrate(5000);
        setCodec("auto");
        break;
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant={sharing ? "danger" : "primary"}
        disabled={busy}
        onClick={() => void toggle()}
      >
        <Icon name={sharing ? "stop" : "play"} size={13} />
        {busy ? t("room.share.busy") : sharing ? t("room.share.stop") : t("room.share.start")}
      </Button>
      {!sharing && (
        <IconButton
          size="sm"
          label={t("room.share.settings")}
          onClick={() => setSettingsOpen(true)}
        >
          <Icon name="sliders" size={14} />
        </IconButton>
      )}

      <Modal
        open={settingsOpen}
        size="md"
        title={t("room.share.settings")}
        onClose={() => setSettingsOpen(false)}
      >
        <Card title={t("room.share.presets")}>
          <div className="mx-share-presets">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => applyPreset("presentation")}
            >
              {t("room.share.presetPresentation")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => applyPreset("balanced")}
            >
              {t("room.share.presetBalanced")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => applyPreset("smooth")}
            >
              {t("room.share.presetSmooth")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => applyPreset("hq")}
            >
              {t("room.share.presetHQ")}
            </Button>
          </div>
        </Card>

        <Card title={t("room.share.quality")}>
          <Slider
            label={t("room.share.resolution")}
            showValue
            formatValue={(v) => resolutionPresets.find((p) => p.value === v)?.label ?? `${v}p`}
            min={720}
            max={2160}
            step={360}
            value={resolution}
            onChange={(e) => setResolution(Number(e.target.value))}
          />

          <Slider
            label={t("room.share.frameRate")}
            showValue
            unit=" fps"
            min={15}
            max={60}
            step={15}
            value={frameRate}
            onChange={(e) => setFrameRate(Number(e.target.value))}
          />

          <Slider
            label={t("room.share.bitrate")}
            showValue
            unit=" Mbps"
            min={1}
            max={10}
            step={0.5}
            value={bitrate / 1000}
            onChange={(e) => setBitrate(Number(e.target.value) * 1000)}
          />

          <Select
            label={t("room.share.codec")}
            value={codec}
            onChange={(e) => setCodec(e.target.value as any)}
            options={[
              { value: "auto", label: t("room.share.codecAuto") },
              { value: "vp8", label: t("room.share.codecVP8") },
              { value: "vp9", label: t("room.share.codecVP9") },
              { value: "h264", label: t("room.share.codecH264") },
              { value: "av1", label: t("room.share.codecAV1") },
            ]}
          />
        </Card>
      </Modal>
    </>
  );
}

/* ============================================================
   Panels
   ============================================================ */

/** 生成/取回本人在本房间的 WHIP 推流地址。首次进房的引导弹窗也复用这段逻辑。 */
function useIngress(code: string, enabled: boolean) {
  const t = useT();
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
        toast.error(humanizeError(t, error));
      } finally {
        setBusy(false);
      }
    },
    [code, t],
  );

  const revoke = useCallback(async () => {
    setBusy(true);
    try {
      await api(`/api/rooms/${code}/ingress`, { method: "DELETE" });
      setIngress(null);
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }, [code, t]);

  return { ingress, busy, generate, revoke };
}

/** 推流信息面板：一人一房一个独立 WHIP 地址。房间级闸门在「房间」那一栏。 */
function ObsPanel({ code, detail }: { code: string; detail: RoomDetail }) {
  const t = useT();
  const obsEnabled = detail.obsEnabled;
  const { ingress, busy, generate, revoke } = useIngress(code, obsEnabled);
  const [revoking, setRevoking] = useState(false);

  if (detail.node.ingressAvailable === false) {
    return (
      <Card title={t("obs.title")}>
        <Banner tone="warning" title={t("obs.noIngressTitle")}>
          {t("obs.noIngressBody")}
        </Banner>
      </Card>
    );
  }

  if (!detail.canPublish) {
    return (
      <Card title={t("obs.title")}>
        <Banner tone="info" title={t("obs.viewerTitle")}>
          {t("obs.viewerBody")}
        </Banner>
      </Card>
    );
  }

  if (!obsEnabled) {
    return (
      <Card title={t("obs.title")}>
        <Banner tone="warning" title={t("obs.gateTitle")}>
          {t("obs.gateBody")}
        </Banner>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={t("obs.myUrl")}
        description={t("obs.myUrlDesc")}
        actions={
          ingress ? (
            <Badge tone="success" dot>
              {t("obs.generated")}
            </Badge>
          ) : (
            <Badge tone="neutral">{t("obs.notGenerated")}</Badge>
          )
        }
      >
        {!ingress ? (
          <div className="mx-card__actions">
            <Button variant="primary" disabled={busy} onClick={() => void generate(false)}>
              <Icon name="broadcast" size={15} />
              {busy ? t("obs.generating") : t("obs.generate")}
            </Button>
          </div>
        ) : (
          <>
            <ol className="mx-steps">
              <li>
                <RichText text={t("obs.step1")} />
              </li>
              <li>{t("obs.step2")}</li>
              <li>{t("obs.step3")}</li>
            </ol>

            <div className="mx-field">
              <span className="mx-field__label">{t("obs.serverLabel")}</span>
              <CopyRow value={ingress.server} label={t("obs.serverShort")} />
            </div>

            <div className="mx-field">
              <span className="mx-field__label">{t("obs.tokenLabel")}</span>
              <CopyRow value={ingress.bearerToken} secret label={t("obs.tokenShort")} />
            </div>

            <div className="mx-card__actions">
              <Button variant="secondary" disabled={busy} onClick={() => void generate(true)}>
                <Icon name="refresh" size={15} />
                {busy ? t("common.working") : t("obs.regenerate")}
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => setRevoking(true)}>
                <Icon name="trash" size={15} />
                {t("obs.revoke")}
              </Button>
            </div>
            <p className="mx-text-caption">{t("obs.regenNote")}</p>
          </>
        )}

        <ConfirmDialog
          open={revoking}
          danger
          busy={busy}
          title={t("obs.revokeTitle")}
          confirmLabel={t("obs.revoke")}
          body={t("obs.revokeBody")}
          onConfirm={async () => {
            await revoke();
            setRevoking(false);
          }}
          onClose={() => setRevoking(false)}
        />
      </Card>

      {/* 房主也在这个标签里，但闸门开关放「房间」那一栏，避免和自己的地址混在一起 */}
      {detail.isOwner && (
        <p className="mx-text-caption mx-text-muted">{t("obs.ownerHint")}</p>
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
  const t = useT();
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
      toast.success(
        next ? t("rset.gate.onToast") : t("rset.gate.offToast", { count: res.revoked }),
      );
    } catch (error) {
      toast.error(humanizeError(t, error));
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
      toast.success(next ? t("rset.share.onToast") : t("rset.share.offToast"));
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setShareBusy(false);
    }
  }

  return (
    <>
      <Card
        title={t("rset.share.title")}
        description={t("rset.share.desc")}
        actions={
          detail.viewerCanPublish ? (
            <Badge tone="success" dot>
              {t("rset.share.everyone")}
            </Badge>
          ) : (
            <Badge tone="neutral">{t("rset.share.restricted")}</Badge>
          )
        }
      >
        <Switch
          checked={detail.viewerCanPublish}
          disabled={shareBusy || !detail.isActive}
          label={t("rset.share.label")}
          hint={t("rset.share.hint")}
          onChange={(event) => void setViewerPublish(event.target.checked)}
        />
      </Card>

      <Card
        title={t("rset.gate.title")}
        description={t("rset.gate.desc")}
        actions={
          obsEnabled ? (
            <Badge tone="success" dot>
              {t("rset.gate.on")}
            </Badge>
          ) : (
            <Badge tone="neutral">{t("rset.gate.off")}</Badge>
          )
        }
      >
        <Switch
          checked={obsEnabled}
          disabled={gateBusy || !detail.isActive}
          label={t("rset.gate.label")}
          hint={t("rset.gate.hint")}
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
        title={t("rset.gate.closeTitle")}
        confirmLabel={t("rset.gate.closeConfirm")}
        body={t("rset.gate.closeBody")}
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
  const t = useT();
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
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title={t("members.title")}
      description={undefined}
      actions={<Badge tone="neutral">{t("members.count", { count: members.length })}</Badge>}
    >
      <div className="mx-table-wrap">
        <table className="mx-table">
          <thead>
            <tr>
              <th>{t("members.col.member")}</th>
              <th data-shrink="true">{t("members.col.permission")}</th>
              <th data-shrink="true">{t("members.col.status")}</th>
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
                  {isOwner && member.role !== "owner" ? (
                    <Select
                      label={t("members.col.permission")}
                      value={member.role}
                      options={[{ value: "viewer", label: t("label.role.viewer") }, { value: "publisher", label: t("label.role.publisher") }]}
                      onChange={async (event) => {
                        try {
                          await api(`/api/rooms/${code}/members`, { method: "PATCH", json: { userId: member.userId, role: event.target.value } });
                          await onChanged();
                        } catch (error) { toast.error(humanizeError(t, error)); }
                      }}
                    />
                  ) : <Badge tone={roleTone(member.role)}>{roleLabel(t, member.role)}</Badge>}
                </td>
                <td data-shrink="true">
                  {member.isOnline ? (
                    <Badge tone="success" dot>
                      {t("members.onlineTag")}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">{t("members.offlineTag")}</Badge>
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
                label={t("members.invite")}
                type="email"
                required
                placeholder="user@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div style={{ width: 150 }}>
              <Select
                label={t("members.permission")}
                value={role}
                onChange={(event) => setRole(event.target.value as "viewer" | "publisher")}
                options={[
                  { value: "viewer", label: t("label.role.viewer") },
                  { value: "publisher", label: t("label.role.publisher") },
                ]}
              />
            </div>
            <Button type="submit" variant="primary" disabled={busy}>
              <Icon name="plus" size={15} />
              {t("members.add")}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

/** 邀请链接：房主不必知道对方邮箱就能拉人。 */
function InvitePanel({ code }: { code: string }) {
  const { locale, t } = useI18n();
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
    load().catch((error) => toast.error(humanizeError(t, error)));
  }, [load, t]);

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
      toast.error(humanizeError(t, error));
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
      toast.error(humanizeError(t, error));
      setRevoking(null);
    } finally {
      setBusy(false);
    }
  }

  const active = invites.filter((invite) => !invite.revokedAt);

  return (
    <Card
      title={t("invite.title")}
      description={t("invite.desc")}
      actions={
        <Badge tone="neutral">{t("invite.activeCount", { count: active.length })}</Badge>
      }
    >
      {fresh && (
        <Banner tone="success" title={t("invite.freshTitle")}>
          <span className="mx-text-caption">{t("invite.freshBody")}</span>
          <div style={{ marginTop: "var(--mx-space-sm)" }}>
            <CopyRow value={fresh} label={t("invite.linkLabel")} />
          </div>
        </Banner>
      )}

      <form className="mx-field-row" onSubmit={create}>
        <div style={{ width: 150 }}>
          <Select
            label={t("members.permission")}
            value={role}
            onChange={(event) => setRole(event.target.value as "viewer" | "publisher")}
            options={[
              { value: "viewer", label: t("label.role.viewer") },
              { value: "publisher", label: t("label.role.publisher") },
            ]}
          />
        </div>
        <div style={{ width: 170 }}>
          <TextField
            label={t("invite.hours")}
            type="number"
            min={1}
            placeholder={t("invite.hoursPlaceholder")}
            value={expires}
            onChange={(event) => setExpires(event.target.value)}
          />
        </div>
        <div style={{ width: 170 }}>
          <TextField
            label={t("invite.uses")}
            type="number"
            min={1}
            placeholder={t("invite.usesPlaceholder")}
            value={maxUses}
            onChange={(event) => setMaxUses(event.target.value)}
          />
        </div>
        <Button type="submit" variant="primary" disabled={busy}>
          <Icon name="link" size={15} />
          {busy ? t("invite.creating") : t("invite.create")}
        </Button>
      </form>

      {active.length > 0 && (
        <div className="mx-table-wrap">
          <table className="mx-table">
            <thead>
              <tr>
                <th data-shrink="true">{t("invite.col.permission")}</th>
                <th data-shrink="true">{t("invite.col.used")}</th>
                <th>{t("invite.col.expires")}</th>
                <th data-shrink="true" data-align="right" />
              </tr>
            </thead>
            <tbody>
              {active.map((invite) => (
                <tr key={invite.id}>
                  <td data-shrink="true">
                    <Badge tone={roleTone(invite.role)}>{roleLabel(t, invite.role)}</Badge>
                  </td>
                  <td data-shrink="true">
                    {invite.useCount}
                    <span className="mx-text-muted">
                      {invite.maxUses === null
                        ? t("invite.unlimitedSuffix")
                        : ` / ${invite.maxUses}`}
                    </span>
                  </td>
                  <td>
                    {invite.expiresAt ? (
                      formatTime(locale, invite.expiresAt)
                    ) : (
                      <span className="mx-text-muted">{t("invite.forever")}</span>
                    )}
                  </td>
                  <td data-shrink="true" data-align="right">
                    <Button variant="secondary" size="sm" onClick={() => setRevoking(invite)}>
                      {t("invite.revoke")}
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
        title={t("invite.revokeTitle")}
        confirmLabel={t("invite.revoke")}
        body={t("invite.revokeBody")}
        onConfirm={() => void revoke()}
        onClose={() => setRevoking(null)}
      />
    </Card>
  );
}

/** 房间黑名单。被拉黑的人即使拿到邀请链接也进不来。 */
function BansPanel({ code }: { code: string }) {
  const { locale, t } = useI18n();
  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ bans: Ban[] }>(`/api/rooms/${code}/bans`);
      setBans(res.bans);
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setLoading(false);
    }
  }, [code, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function unban(userId: string) {
    setBusy(true);
    try {
      await api(`/api/rooms/${code}/bans?userId=${userId}`, { method: "DELETE" });
      await load();
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title={t("bans.title")}
      description={t("bans.desc")}
      actions={<Badge tone="neutral">{t("bans.count", { count: bans.length })}</Badge>}
    >
      {loading ? (
        <Loading />
      ) : bans.length === 0 ? (
        <EmptyState icon="ban" title={t("bans.emptyTitle")}>
          {t("bans.emptyBody")}
        </EmptyState>
      ) : (
        <div className="mx-table-wrap">
          <table className="mx-table">
            <thead>
              <tr>
                <th>{t("bans.col.user")}</th>
                <th>{t("bans.col.at")}</th>
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
                  <td>{formatTime(locale, ban.createdAt)}</td>
                  <td data-shrink="true" data-align="right">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void unban(ban.userId)}
                    >
                      {t("bans.unban")}
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
  const { locale, t } = useI18n();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ logs: LogRow[] }>(`/api/rooms/${code}/logs`);
      setLogs(res.logs);
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setLoading(false);
    }
  }, [code, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card
      title={t("logs.title")}
      description={t("logs.desc")}
      actions={
        <Button variant="secondary" size="sm" onClick={() => void load()}>
          <Icon name="refresh" size={14} />
          {t("common.refresh")}
        </Button>
      }
    >
      {loading ? (
        <Loading />
      ) : logs.length === 0 ? (
        <EmptyState icon="logs" title={t("logs.emptyTitle")}>
          {t("logs.emptyBody")}
        </EmptyState>
      ) : (
        <div className="mx-logs">
          {logs.map((log) => (
            <div key={log.id} className="mx-log">
              <span className="mx-log__time">{formatTime(locale, log.createdAt)}</span>
              <span className="mx-log__action">{log.action}</span>
              <span className="mx-log__actor">{log.actor ?? t("logs.system")}</span>
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
  const t = useT();
  const [name, setName] = useState("");
  const [access, setAccess] = useState<"members" | "publishers" | "owner">("members");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ player: SyncPlayerRow }>(`/api/rooms/${code}/sync-players`, {
        method: "POST",
        json: { name: name.trim(), access },
      });
      setName("");
      onCreated(res.player);
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={t("sync.new.title")} onClose={onClose}>
      <form className="mx-form" onSubmit={submit}>
        <p className="mx-text-caption">
          <RichText text={t("sync.new.intro")} />
        </p>

        <TextField
          label={t("sync.new.name")}
          required
          maxLength={60}
          placeholder={t("sync.new.namePlaceholder")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Select
          label={t("sync.new.accessLabel")}
          value={access}
          onChange={(event) => setAccess(event.target.value as typeof access)}
          options={[
            { value: "members", label: t("sync.accessMembers") },
            { value: "publishers", label: t("sync.accessPublishers") },
            { value: "owner", label: t("sync.accessOwner") }
          ]}
        />

        <Button type="submit" variant="primary" full disabled={busy || name.trim() === ""}>
          <Icon name="film" size={15} />
          {busy ? t("sync.new.creating") : t("sync.new.create")}
        </Button>
      </form>
    </Modal>
  );
}

function RoomNodesPanel({ code, isOwner }: { code: string; isOwner: boolean }) {
  const t = useT();
  const [nodes, setNodes] = useState<RoomNodeRow[]>([]);
  const [available, setAvailable] = useState<{ id: string; name: string }[]>([]);
  const [nodeId, setNodeId] = useState("");
  const load = useCallback(async () => {
    const [room, mine] = await Promise.all([
      api<{ nodes: RoomNodeRow[] }>(`/api/rooms/${code}/nodes`),
      api<{ nodes: { id: string; name: string; isMine: boolean }[] }>("/api/nodes"),
    ]);
    setNodes(room.nodes);
    setAvailable(mine.nodes.filter((n) => n.isMine));
  }, [code]);
  useEffect(() => { void load(); }, [load]);
  async function add() {
    if (!nodeId) return;
    try {
      await api(`/api/rooms/${code}/nodes`, { method: "POST", json: { nodeId } });
      setNodeId("");
      await load();
      toast.success(t("room.nodes.added"));
    } catch (error) {
      toast.error(humanizeError(t, error));
    }
  }
  async function primary(id: string) {
    try {
      await api(`/api/rooms/${code}/nodes`, { method: "PATCH", json: { nodeId: id } });
      await load();
      toast.success(t("room.nodes.primarySet"));
    } catch (error) {
      toast.error(humanizeError(t, error));
    }
  }
  return (
    <Card title={t("room.nodes.title")} description={t("room.nodes.desc")}>
      <div className="mx-field-row">
        <div style={{ flex: 1 }}>
          <Select
            label={t("room.nodes.selectLabel")}
            options={available.map((n) => ({ value: n.id, label: n.name }))}
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => void add()} disabled={!nodeId}>
          <Icon name="plus" size={15} />
          {t("room.nodes.add")}
        </Button>
      </div>
      {nodes.length > 0 && (
        <div className="mx-table-wrap">
          <table className="mx-table">
            <thead>
              <tr>
                <th>{t("room.nodes.col.name")}</th>
                <th data-shrink="true">{t("room.nodes.col.status")}</th>
                <th data-shrink="true" data-align="right" />
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n.id}>
                  <td>{n.name}</td>
                  <td data-shrink="true">
                    {n.isPrimary ? (
                      <Badge tone="accent">{t("room.nodes.primary")}</Badge>
                    ) : (
                      <Badge tone="neutral">{t("room.nodes.secondary")}</Badge>
                    )}
                  </td>
                  <td data-shrink="true" data-align="right">
                    {!n.isPrimary && isOwner && (
                      <Button size="sm" variant="secondary" onClick={() => void primary(n.id)}>
                        {t("room.nodes.setPrimary")}
                      </Button>
                    )}
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

function GrantNodeModal({ code, entry, onClose }: { code: string; entry: RailEntry | null; onClose: () => void }) {
  const t = useT();
  const [nodes, setNodes] = useState<RoomNodeRow[]>([]);
  const [nodeId, setNodeId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (entry) {
      void api<{ nodes: RoomNodeRow[] }>(`/api/rooms/${code}/nodes`).then((r) => setNodes(r.nodes));
    }
  }, [code, entry]);

  async function grant() {
    if (!entry || !nodeId) return;
    setBusy(true);
    try {
      await api(`/api/rooms/${code}/node-access`, { method: "POST", json: { nodeId, userId: entry.userId } });
      toast.success(t("room.nodes.granted", { name: entry.displayName }));
      onClose();
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={entry !== null}
      title={t("room.nodes.grantTitle")}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={() => void grant()} disabled={!nodeId || busy}>
            {busy ? t("common.working") : t("room.nodes.grant")}
          </Button>
        </>
      }
    >
      <p className="mx-text-caption">{t("room.nodes.grantDesc", { name: entry?.displayName ?? "" })}</p>
      <Select
        label={t("room.nodes.selectLabel")}
        options={nodes.map((n) => ({ value: n.id, label: n.name }))}
        value={nodeId}
        onChange={(e) => setNodeId(e.target.value)}
      />
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
  const t = useT();
  const publishable =
    detail.canPublish && detail.obsEnabled && detail.node.ingressAvailable !== false;
  const { ingress, busy, generate } = useIngress(code, open && publishable);

  return (
    <Modal
      open={open}
      title={t("room.tip.title")}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t("common.gotIt")}
        </Button>
      }
    >
      <p>
        <RichText text={t("room.tip.intro")} />
      </p>

      {!publishable ? (
        <Banner tone="info" title={t("room.tip.noneTitle")}>
          {!detail.canPublish
            ? t("room.tip.noneViewer")
            : !detail.obsEnabled
              ? t("room.tip.noneGate")
              : t("room.tip.noneIngress")}
          <br />
          {t("room.tip.noneFoot")}
        </Banner>
      ) : ingress ? (
        <>
          <div className="mx-field">
            <span className="mx-field__label">{t("room.tip.serverLabel")}</span>
            <CopyRow value={ingress.server} label={t("obs.serverShort")} />
          </div>
          <div className="mx-field">
            <span className="mx-field__label">{t("obs.tokenLabel")}</span>
            <CopyRow value={ingress.bearerToken} secret label={t("obs.tokenShort")} />
          </div>
        </>
      ) : (
        <>
          <p className="mx-text-caption">{t("room.tip.notGenerated")}</p>
          <Button variant="secondary" disabled={busy} onClick={() => void generate(false)}>
            <Icon name="broadcast" size={15} />
            {busy ? t("obs.generating") : t("room.tip.generateNow")}
          </Button>
        </>
      )}
    </Modal>
  );
}
