"use client";

import { useCallback, useEffect, useState } from "react";
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
import "@livekit/components-styles";

import { api } from "@/lib/api-client";
import { CopyRow } from "@/components/CopyRow";

type RoomDetail = {
  code: string;
  name: string;
  isActive: boolean;
  isOwner: boolean;
  canPublish: boolean;
  node: { name: string; kind: string; ingressAvailable: boolean | null };
};

type Grant = { token: string; wsUrl: string; expiresAt: string };

export function RoomClient({ code }: { code: string }) {
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [grant, setGrant] = useState<Grant | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<{ room: RoomDetail }>(`/api/rooms/${code}`);
      setDetail(d.room);
      if (d.room.isActive) {
        // token 只在这里向服务端要；服务端会先确认我是房间成员
        setGrant(await api<Grant>(`/api/rooms/${code}/token`, { method: "POST" }));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
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

  if (err) {
    return (
      <div className="wrap">
        <div className="panel">
          <h1>打不开这个房间</h1>
          <div className="err">{err}</div>
          <p className="muted" style={{ marginTop: 12 }}>
            非成员看到的就是「房间不存在」—— 这是故意的，避免被人拿房间码探测。
          </p>
          <a href="/dashboard">← 回控制台</a>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="wrap">
        <p className="muted">加载中…</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1>{detail.name}</h1>
          <span className="muted">
            <code>{detail.code}</code> · 节点 {detail.node.name}
            {detail.node.kind === "builtin" && " (内置)"}
          </span>
        </div>
        <a href="/dashboard">← 控制台</a>
      </div>

      {!detail.isActive && (
        <div className="panel">
          <p className="err" style={{ margin: 0 }}>
            房间已关闭，无法再签发 token。
          </p>
        </div>
      )}

      {detail.canPublish && <ObsPanel code={code} detail={detail} />}

      {grant && (
        <LiveKitRoom
          serverUrl={grant.wsUrl}
          token={grant.token}
          connect
          // 观众默认不开麦不开摄像头，只订阅
          audio={false}
          video={false}
          onError={(e) => setErr(e.message)}
        >
          {detail.canPublish && <ShareControls />}
          <Stage />
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}

      <InvitePanel code={code} isOwner={detail.isOwner} />
      <MembersPanel code={code} isOwner={detail.isOwner} />
      <LogsPanel code={code} />
    </div>
  );
}

type LogRow = {
  id: number;
  action: string;
  actor: string | null;
  createdAt: string;
};

/** 房间操作日志。默认收起——它是排查用的，不是主界面。 */
function LogsPanel({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api<{ logs: LogRow[] }>(`/api/rooms/${code}/logs`)
      .then((r) => setLogs(r.logs))
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, [open, code]);

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>操作日志</h2>
        <button className="ghost" onClick={() => setOpen((s) => !s)}>
          {open ? "收起" : "展开"}
        </button>
      </div>

      {open && (
        <>
          {err && <div className="err">{err}</div>}
          {logs.length === 0 && !err ? (
            <p className="muted" style={{ marginTop: 12 }}>
              暂无记录。
            </p>
          ) : (
            <table style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作</th>
                  <th>操作人</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="muted">{new Date(l.createdAt).toLocaleString()}</td>
                    <td>
                      <code>{l.action}</code>
                    </td>
                    <td>{l.actor ?? <span className="muted">系统</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
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
    } catch (e) {
      // 用户点了「取消」选择窗口也会走到这里，不当成错误刷屏
      const msg = e instanceof Error ? e.message : String(e);
      if (!/permission|denied|cancel/i.test(msg)) setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h2>从浏览器共享</h2>
      <p className="muted">
        不想装 OBS 就用这个。想要更高画质/多档清晰度再走上面的 WHIP 推流。
      </p>
      {err && <div className="err">{err}</div>}
      <div className="row" style={{ marginTop: 12 }}>
        <button onClick={toggle} disabled={busy} className={sharing ? "danger" : undefined}>
          {busy ? "处理中…" : sharing ? "停止共享" : "共享我的屏幕"}
        </button>
      </div>
    </div>
  );
}

/** 画面区：优先显示屏幕共享，其次摄像头。上线检测靠 SDK 事件，不轮询后端。 */
function Stage() {
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

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>画面</h2>
        <span className="muted">房内 {participants.length} 人</span>
      </div>

      {tracks.length === 0 ? (
        <p className="muted">
          还没有人在推流。推流端一连上，这里会自动出现画面 —— 不需要刷新。
        </p>
      ) : (
        <div className="videos">
          {tracks.map((ref) => (
            <div key={`${ref.participant.identity}:${ref.publication.trackSid}`}>
              <VideoTrack trackRef={ref} style={{ width: "100%", height: "100%" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** OBS 推流面板：一人一房一个独立 WHIP 地址。 */
function ObsPanel({ code, detail }: { code: string; detail: RoomDetail }) {
  const [ingress, setIngress] = useState<{ server: string; bearerToken: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<{ ingress: { server: string; bearerToken: string } }>(`/api/rooms/${code}/ingress`)
      .then((r) => setIngress(r.ingress))
      .catch(() => setIngress(null)); // 404 = 还没生成，正常
  }, [code]);

  async function generate(rotate = false) {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ ingress: { server: string; bearerToken: string } }>(
        `/api/rooms/${code}/ingress${rotate ? "?rotate=1" : ""}`,
        { method: "POST" },
      );
      setIngress(r.ingress);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (detail.node.ingressAvailable === false) {
    return (
      <div className="panel">
        <h2>OBS 推流</h2>
        <p className="muted">
          这个房间所在节点的 Ingress 不可用，拿不到 OBS 推流地址。你仍然可以用浏览器直接共享屏幕。
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>OBS 推流地址（只属于你）</h2>

      {!ingress ? (
        <>
          <p className="muted">
            生成一个绑定到「你 + 这个房间」的 WHIP 地址。走 WHIP 直通，不消耗 transcode 额度。
          </p>
          {err && <div className="err">{err}</div>}
          <button onClick={() => generate(false)} disabled={busy}>
            {busy ? "生成中…" : "生成推流地址"}
          </button>
        </>
      ) : (
        <>
          <ol className="steps" style={{ marginBottom: 12 }}>
            <li>
              OBS → 设置 → 直播 → 服务 选 <b>WHIP</b>
            </li>
            <li>Server 和 Bearer Token 填下面两个值</li>
            <li>
              WHIP 直通没有服务端 simulcast。要多档清晰度得在 OBS 32.1.0+ 自己开（1–4 层）。
            </li>
          </ol>

          <label>Server</label>
          <CopyRow value={ingress.server} />

          <label>Bearer Token（就是 Stream Key）</label>
          <CopyRow value={ingress.bearerToken} secret />

          {err && <div className="err">{err}</div>}
          <div className="row" style={{ marginTop: 16 }}>
            <button className="ghost" onClick={() => generate(true)} disabled={busy}>
              {busy ? "处理中…" : "重新生成（旧地址立即失效）"}
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={async () => {
                if (!confirm("撤销后 OBS 会立刻推不上来，确定？")) return;
                setBusy(true);
                try {
                  await api(`/api/rooms/${code}/ingress`, { method: "DELETE" });
                  setIngress(null);
                } finally {
                  setBusy(false);
                }
              }}
            >
              撤销
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type Member = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  isOnline: boolean;
};

type Invite = {
  id: string;
  role: string;
  useCount: number;
  maxUses: number | null;
  expiresAt: string | null;
  revokedAt: string | null;
};

/** 邀请链接：房主不必知道对方邮箱就能拉人。 */
function InvitePanel({ code, isOwner }: { code: string; isOwner: boolean }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [role, setRole] = useState<"viewer" | "publisher">("viewer");
  const [expires, setExpires] = useState("24");
  const [maxUses, setMaxUses] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isOwner) return;
    const r = await api<{ invites: Invite[] }>(`/api/rooms/${code}/invites`);
    setInvites(r.invites);
  }, [code, isOwner]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isOwner) return null;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ joinUrl: string }>(`/api/rooms/${code}/invites`, {
        method: "POST",
        json: {
          role,
          expiresInHours: expires.trim() === "" ? null : Number(expires),
          maxUses: maxUses.trim() === "" ? null : Number(maxUses),
        },
      });
      setFresh(r.joinUrl);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    try {
      await api(`/api/rooms/${code}/invites?id=${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  const active = invites.filter((i) => !i.revokedAt);

  return (
    <div className="panel">
      <h2>邀请链接</h2>
      <p className="muted">
        对方打开链接、登录（或注册）后自动入房。链接只在创建时显示一次，之后库里只有哈希。
      </p>

      {fresh && (
        <div style={{ marginBottom: 12 }}>
          <label>新链接（只显示这一次，请立刻复制）</label>
          <CopyRow value={fresh} />
        </div>
      )}

      <form onSubmit={create}>
        <div className="row">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "viewer" | "publisher")}
            style={{ width: 130 }}
          >
            <option value="viewer">仅观看</option>
            <option value="publisher">可推流</option>
          </select>
          <input
            type="number"
            min={1}
            placeholder="有效小时数（空=永久）"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            style={{ width: 170 }}
          />
          <input
            type="number"
            min={1}
            placeholder="可用次数（空=不限）"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            style={{ width: 170 }}
          />
          <button type="submit" disabled={busy}>
            {busy ? "生成中…" : "生成链接"}
          </button>
        </div>
        {err && <div className="err">{err}</div>}
      </form>

      {active.length > 0 && (
        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>权限</th>
              <th>已用</th>
              <th>过期</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {active.map((i) => (
              <tr key={i.id}>
                <td>{i.role === "publisher" ? "可推流" : "仅观看"}</td>
                <td>
                  {i.useCount}
                  {i.maxUses === null ? " / 不限" : ` / ${i.maxUses}`}
                </td>
                <td>{i.expiresAt ? new Date(i.expiresAt).toLocaleString() : "永久"}</td>
                <td>
                  <button className="danger" onClick={() => revoke(i.id)}>
                    撤销
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MembersPanel({ code, isOwner }: { code: string; isOwner: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "publisher">("viewer");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api<{ members: Member[] }>(`/api/rooms/${code}/members`);
    setMembers(r.members);
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api(`/api/rooms/${code}/members`, { method: "POST", json: { email, role } });
      setEmail("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function kick(userId: string) {
    if (!confirm("移出该成员？会同时断开他的连接并删掉他的推流地址。")) return;
    try {
      await api(`/api/rooms/${code}/members?userId=${userId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="panel">
      <h2>成员</h2>
      <p className="muted">
        不在这张表里的人签不出 token，也就订阅不到任何画面 —— 这是协议层的限制，不是前端过滤。
      </p>

      <table>
        <thead>
          <tr>
            <th>成员</th>
            <th>权限</th>
            <th>状态</th>
            {isOwner && <th></th>}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.userId}>
              <td>
                {m.displayName}
                <br />
                <span className="muted">{m.email}</span>
              </td>
              <td>{m.role}</td>
              <td>
                {m.isOnline ? <span className="badge online">在线</span> : <span className="badge">离线</span>}
              </td>
              {isOwner && (
                <td>
                  {m.role !== "owner" && (
                    <button className="danger" onClick={() => kick(m.userId)}>
                      移出
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isOwner && (
        <form onSubmit={add} style={{ marginTop: 16 }}>
          <label>邀请成员（对方需先注册本站账号）</label>
          <div className="row">
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "viewer" | "publisher")}
              style={{ width: 130 }}
            >
              <option value="viewer">仅观看</option>
              <option value="publisher">可推流</option>
            </select>
            <button type="submit">添加</button>
          </div>
          {err && <div className="err">{err}</div>}
        </form>
      )}
    </div>
  );
}
