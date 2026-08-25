"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { Invite, LogRow, Member, RoomDetail } from "@/lib/api-types";
import { formatTime, roleLabel, roleTone } from "@/lib/labels";
import { AppShell, type ShellUser } from "@/components/AppShell";
import { CopyRow } from "@/components/CopyRow";
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
  Select,
  Tabs,
  TextField,
} from "@/ui";

type Grant = { token: string; wsUrl: string; expiresAt: string };
type Panel = "publish" | "members" | "invites" | "logs";

export function RoomClient({ code, user }: { code: string; user: ShellUser }) {
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [grant, setGrant] = useState<Grant | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("members");
  const [memberCount, setMemberCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ room: RoomDetail }>(`/api/rooms/${code}`);
      setDetail(res.room);
      setPanel(res.room.canPublish ? "publish" : "members");
      if (res.room.isActive) {
        // token 只在这里向服务端要；服务端会先确认我是房间成员
        setGrant(await api<Grant>(`/api/rooms/${code}/token`, { method: "POST" }));
      }
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const tabs = useMemo(() => {
    const items: Array<{ value: Panel; label: string; icon: "broadcast" | "users" | "link" | "logs" }> =
      [];
    if (detail?.canPublish) items.push({ value: "publish", label: "推流", icon: "broadcast" });
    items.push({ value: "members", label: "成员", icon: "users" });
    if (detail?.isOwner) items.push({ value: "invites", label: "邀请", icon: "link" });
    items.push({ value: "logs", label: "操作日志", icon: "logs" });
    return items;
  }, [detail?.canPublish, detail?.isOwner]);

  if (err && !detail) {
    return (
      <AppShell user={user} heading={<span>房间 {code}</span>}>
        <section className="mx-section">
          <header className="mx-section__header">
            <div className="mx-section__heading">
              <h1 className="mx-section__title">打不开这个房间</h1>
            </div>
          </header>
          <Banner tone="error">{err}</Banner>
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

  if (!detail) {
    return (
      <AppShell user={user} heading={<span>房间 {code}</span>}>
        <section className="mx-section">
          <Loading>正在打开房间…</Loading>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      heading={
        <>
          <Icon name="chevronRight" size={13} />
          <span>{detail.name}</span>
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
          {memberCount !== null && (
            <>
              <span className="mx-statusbar__divider" />
              <span className="mx-statusbar__item">成员 {memberCount}</span>
            </>
          )}
        </>
      }
    >
      <section className="mx-section">
        <header className="mx-section__header">
          <div className="mx-section__heading">
            <h1 className="mx-section__title">{detail.name}</h1>
            <p className="mx-section__subtitle">
              房间码 {detail.code} · 节点 {detail.node.name}
            </p>
          </div>
          <span className="mx-section__spacer" />
          <div className="mx-section__actions">
            {detail.isActive ? (
              <Badge tone="success" dot>
                活跃
              </Badge>
            ) : (
              <Badge tone="neutral">已关闭</Badge>
            )}
            <Badge tone={roleTone(detail.isOwner ? "owner" : detail.canPublish ? "publisher" : "viewer")}>
              {detail.isOwner ? "房主" : detail.canPublish ? "可推流" : "仅观看"}
            </Badge>
            <LinkButton href="/dashboard" variant="secondary" size="sm">
              返回列表
            </LinkButton>
          </div>
        </header>

        {!detail.isActive && (
          <Banner tone="warning" title="房间已关闭">
            无法再签发 token，画面和推流都不可用。
          </Banner>
        )}

        {err && detail && <Banner tone="error">{err}</Banner>}

        {grant ? (
          <LiveKitRoom
            serverUrl={grant.wsUrl}
            token={grant.token}
            connect
            // 观众默认不开麦不开摄像头，只订阅
            audio={false}
            video={false}
            onError={(error) => setErr(error.message)}
          >
            <Stage canPublish={detail.canPublish} />
            <RoomAudioRenderer />
          </LiveKitRoom>
        ) : (
          <OfflineStage active={detail.isActive} />
        )}

        <Tabs label="房间面板" value={panel} onChange={setPanel} items={tabs} />

        {panel === "publish" && detail.canPublish && <ObsPanel code={code} detail={detail} />}
        {panel === "members" && (
          <MembersPanel code={code} isOwner={detail.isOwner} onCount={setMemberCount} />
        )}
        {panel === "invites" && detail.isOwner && <InvitePanel code={code} />}
        {panel === "logs" && <LogsPanel code={code} />}
      </section>
    </AppShell>
  );
}

/* ============================================================
   Stage — the video area. Lives inside LiveKitRoom so it can read room state.
   ============================================================ */

/** 画面区：优先显示屏幕共享，其次摄像头。上线检测靠 SDK 事件，不轮询后端。 */
function Stage({ canPublish }: { canPublish: boolean }) {
  const allTracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );
  // withPlaceholder: false 时不会有占位项，但类型上仍是联合，收窄一下
  const tracks = allTracks.filter(isTrackReference);
  const participants = useParticipants();
  const live = tracks.length > 0;

  return (
    <div className="mx-stage">
      <div className="mx-stage__bar">
        <span className="mx-stage__live" data-live={live}>
          <span className="mx-stage__live-dot" />
          {live ? "直播中" : "无信号"}
        </span>
        <span>房内 {participants.length} 人</span>
        <span className="mx-stage__spacer" />
        {canPublish && <ShareControls />}
      </div>

      {live ? (
        <div className="mx-stage__grid">
          {tracks.map((ref) => (
            <div
              key={`${ref.participant.identity}:${ref.publication.trackSid}`}
              className="mx-stage__tile"
            >
              <VideoTrack trackRef={ref} />
              <span className="mx-stage__tag">
                {ref.participant.name || ref.participant.identity}
                {" · "}
                {ref.source === Track.Source.ScreenShare ? "屏幕共享" : "摄像头"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-stage__idle">
          <span className="mx-stage__idle-icon">
            <Icon name="broadcast" size={24} />
          </span>
          <span className="mx-stage__idle-title">还没有人在推流</span>
          <span className="mx-stage__idle-body">
            推流端一连上，这里会自动出现画面 —— 不需要刷新页面。
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
  const [err, setErr] = useState<string | null>(null);
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
    setErr(null);
    try {
      await room.localParticipant.setScreenShareEnabled(!sharing, {
        audio: true,
        // 桌面共享要清晰的文字，优先分辨率而非帧率
        resolution: { width: 1920, height: 1080, frameRate: 15 },
      });
    } catch (error) {
      // 用户点了「取消」选择窗口也会走到这里，不当成错误刷屏
      const message = error instanceof Error ? error.message : String(error);
      if (!/permission|denied|cancel/i.test(message)) setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {err && <span className="mx-text-caption mx-text-error">{err}</span>}
      <Button
        size="sm"
        variant={sharing ? "danger" : "primary"}
        disabled={busy}
        onClick={() => void toggle()}
      >
        <Icon name={sharing ? "stop" : "play"} size={13} />
        {busy ? "处理中…" : sharing ? "停止共享" : "共享我的屏幕"}
      </Button>
    </>
  );
}

/* ============================================================
   Panels
   ============================================================ */

/** OBS 推流面板：一人一房一个独立 WHIP 地址。 */
function ObsPanel({ code, detail }: { code: string; detail: RoomDetail }) {
  const [ingress, setIngress] = useState<{ server: string; bearerToken: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    api<{ ingress: { server: string; bearerToken: string } }>(`/api/rooms/${code}/ingress`)
      .then((res) => setIngress(res.ingress))
      .catch(() => setIngress(null)); // 404 = 还没生成，正常
  }, [code]);

  async function generate(rotate = false) {
    setBusy(true);
    setErr(null);
    try {
      const res = await api<{ ingress: { server: string; bearerToken: string } }>(
        `/api/rooms/${code}/ingress${rotate ? "?rotate=1" : ""}`,
        { method: "POST" },
      );
      setIngress(res.ingress);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/rooms/${code}/ingress`, { method: "DELETE" });
      setIngress(null);
      setRevoking(false);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  if (detail.node.ingressAvailable === false) {
    return (
      <Card title="OBS 推流">
        <Banner tone="warning" title="这个节点的 Ingress 不可用">
          拿不到 OBS 推流地址。你仍然可以用上面的「共享我的屏幕」直接从浏览器推。
        </Banner>
      </Card>
    );
  }

  return (
    <Card
      title="OBS 推流地址"
      description="绑定到「你 + 这个房间」，别人拿不到也用不了。走 WHIP 直通，不消耗 transcode 额度。"
      actions={ingress ? <Badge tone="success" dot>已生成</Badge> : <Badge tone="neutral">未生成</Badge>}
    >
      {err && <Banner tone="error">{err}</Banner>}

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
        onConfirm={() => void revoke()}
        onClose={() => setRevoking(false)}
      />
    </Card>
  );
}

function MembersPanel({
  code,
  isOwner,
  onCount,
}: {
  code: string;
  isOwner: boolean;
  onCount: (count: number) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "publisher">("viewer");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [kicking, setKicking] = useState<Member | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ members: Member[] }>(`/api/rooms/${code}/members`);
      setMembers(res.members);
      onCount(res.members.length);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [code, onCount]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/rooms/${code}/members`, { method: "POST", json: { email, role } });
      setEmail("");
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function kick() {
    if (!kicking) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/rooms/${code}/members?userId=${kicking.userId}`, { method: "DELETE" });
      setKicking(null);
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
      setKicking(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="成员"
      description="不在这张表里的人签不出 token，也就订阅不到任何画面 —— 这是协议层的限制，不是前端过滤。"
      actions={<Badge tone="neutral">{members.length} 人</Badge>}
    >
      {err && <Banner tone="error">{err}</Banner>}

      {loading ? (
        <Loading />
      ) : (
        <div className="mx-table-wrap">
          <table className="mx-table">
            <thead>
              <tr>
                <th>成员</th>
                <th data-shrink="true">权限</th>
                <th data-shrink="true">状态</th>
                {isOwner && <th data-shrink="true" data-align="right" />}
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
                  {isOwner && (
                    <td data-shrink="true" data-align="right">
                      {member.role !== "owner" && (
                        <IconButton
                          size="sm"
                          tone="danger"
                          label={`移出 ${member.displayName}`}
                          onClick={() => setKicking(member)}
                        >
                          <Icon name="x" size={15} />
                        </IconButton>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      <ConfirmDialog
        open={kicking !== null}
        danger
        busy={busy}
        title="移出成员"
        confirmLabel="移出"
        body={
          <>
            移出「{kicking?.displayName}」？会同时断开他的连接并删掉他的推流地址。
          </>
        }
        onConfirm={() => void kick()}
        onClose={() => setKicking(null)}
      />
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
  const [err, setErr] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<Invite | null>(null);

  const load = useCallback(async () => {
    const res = await api<{ invites: Invite[] }>(`/api/rooms/${code}/invites`);
    setInvites(res.invites);
  }, [code]);

  useEffect(() => {
    load().catch((error) => setErr(error instanceof Error ? error.message : String(error)));
  }, [load]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErr(null);
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
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!revoking) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/rooms/${code}/invites?id=${revoking.id}`, { method: "DELETE" });
      setRevoking(null);
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
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
      {err && <Banner tone="error">{err}</Banner>}

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

/** 房间操作日志 —— 排查用。 */
function LogsPanel({ code }: { code: string }) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ logs: LogRow[] }>(`/api/rooms/${code}/logs`);
      setLogs(res.logs);
      setErr(null);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
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
      {err && <Banner tone="error">{err}</Banner>}
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
