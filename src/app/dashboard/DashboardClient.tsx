"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api-client";
import { CopyRow } from "@/components/CopyRow";
import {
  NodeCredentialFields,
  emptyNodeDraft,
  type NodeDraft,
} from "@/components/NodeCredentialFields";

type NodeSummary = {
  id: string;
  name: string;
  kind: "builtin" | "user";
  wsUrl: string;
  isMine: boolean;
  isEnabled: boolean;
  lastCheckOk: boolean | null;
  capabilities: { listRooms: boolean; ingress: boolean } | null;
  webhookUrl: string;
};

type RoomRow = {
  code: string;
  name: string;
  isActive: boolean;
  role: string;
  nodeName: string;
  nodeKind: string;
};

export function DashboardClient({
  user,
}: {
  user: { email: string; displayName: string; role: string };
}) {
  const router = useRouter();
  const [nodes, setNodes] = useState<NodeSummary[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [n, r] = await Promise.all([
      api<{ nodes: NodeSummary[] }>("/api/nodes"),
      api<{ rooms: RoomRow[] }>("/api/rooms"),
    ]);
    setNodes(n.nodes);
    setRooms(r.rooms);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1>控制台</h1>
          <span className="muted">
            {user.displayName}（{user.email}）· {user.role === "admin" ? "管理员" : "用户"}
          </span>
        </div>
        <div className="row">
          {user.role === "admin" && (
            <a href="/admin" className="badge builtin" style={{ padding: "8px 14px" }}>
              管理后台
            </a>
          )}
          <button className="ghost" onClick={logout}>
            退出登录
          </button>
        </div>
      </div>

      <CreateRoom nodes={nodes} onCreated={refresh} />
      <MyNodes nodes={nodes} onChanged={refresh} />

      <div className="panel">
        <h2>我的房间</h2>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : rooms.length === 0 ? (
          <p className="muted">还没有房间。用上面的表单建一个。</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>房间</th>
                <th>节点</th>
                <th>身份</th>
                <th>状态</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.code}>
                  <td>
                    {r.name}
                    <br />
                    <code className="muted">{r.code}</code>
                  </td>
                  <td>
                    {r.nodeName}{" "}
                    {r.nodeKind === "builtin" && <span className="badge builtin">内置</span>}
                  </td>
                  <td>{r.role}</td>
                  <td>{r.isActive ? "活跃" : "已关闭"}</td>
                  <td>
                    <button className="ghost" onClick={() => router.push(`/room/${r.code}`)}>
                      进入
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CreateRoom({
  nodes,
  onCreated,
}: {
  nodes: NodeSummary[];
  onCreated: () => Promise<void>;
}) {
  const usable = nodes.filter((n) => n.isEnabled);
  const [name, setName] = useState("");
  // "new" = 建房时现场接一套新凭据
  const [nodeId, setNodeId] = useState<string>("");
  const [draft, setDraft] = useState<NodeDraft>(emptyNodeDraft());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (nodeId === "" && usable.length > 0) setNodeId(usable[0]!.id);
  }, [usable, nodeId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = { name };
      if (nodeId === "new") body.newNode = draft;
      else body.nodeId = nodeId;

      const { room } = await api<{ room: { code: string } }>("/api/rooms", {
        method: "POST",
        json: body,
      });
      setName("");
      await onCreated();
      window.location.href = `/room/${room.code}`;
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>创建房间</h2>
      <p className="muted">
        每个房间绑定一个 LiveKit 节点 —— 这个房间的媒体流量就走那个节点、烧那个节点的额度。
      </p>

      <label>房间名</label>
      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />

      <label>使用哪个节点</label>
      <select value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
        {usable.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
            {n.kind === "builtin" ? "（内置·共享额度）" : "（我的）"}
            {n.capabilities?.ingress === false ? " · 无 OBS 推流" : ""}
          </option>
        ))}
        <option value="new">+ 接入一套新的 LiveKit 凭据…</option>
      </select>

      {nodeId === "new" && (
        <div style={{ marginTop: 12 }}>
          <NodeCredentialFields value={draft} onChange={setDraft} />
        </div>
      )}

      {usable.length === 0 && nodeId !== "new" && (
        <p className="muted" style={{ marginTop: 8 }}>
          你还没有可用节点。选上面的「接入一套新的 LiveKit 凭据」，或到下方节点区添加。
        </p>
      )}

      {err && <div className="err">{err}</div>}
      <div className="row" style={{ marginTop: 16 }}>
        <button type="submit" disabled={busy || (usable.length === 0 && nodeId !== "new")}>
          {busy ? "创建中…" : "创建房间"}
        </button>
      </div>
    </form>
  );
}

function MyNodes({
  nodes,
  onChanged,
}: {
  nodes: NodeSummary[];
  onChanged: () => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<NodeDraft>(emptyNodeDraft());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api("/api/nodes", { method: "POST", json: draft });
      setDraft(emptyNodeDraft());
      setAdding(false);
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function recheck(id: string) {
    setCheckingId(id);
    try {
      await api(`/api/nodes/${id}`, { method: "POST" });
      await onChanged();
    } finally {
      setCheckingId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("确定删除这个节点？其下的活跃房间必须先关闭。")) return;
    try {
      await api(`/api/nodes/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  /** 换密钥：LiveKit 那边重建 key 之后用这个更新。会先体检新凭据再写入。 */
  async function rotate(id: string, name: string) {
    const apiKey = prompt(`「${name}」的新 API Key`)?.trim();
    if (!apiKey) return;
    const apiSecret = prompt(`「${name}」的新 API Secret`)?.trim();
    if (!apiSecret) return;

    setRotatingId(id);
    try {
      await api(`/api/nodes/${id}`, { method: "PATCH", json: { apiKey, apiSecret } });
      await onChanged();
      alert("已更新，新凭据体检通过。");
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setRotatingId(null);
    }
  }

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>LiveKit 节点</h2>
        <button className="ghost" onClick={() => setAdding((s) => !s)}>
          {adding ? "取消" : "+ 接入我的节点"}
        </button>
      </div>

      {adding && (
        <form onSubmit={add} style={{ marginTop: 12 }}>
          <NodeCredentialFields value={draft} onChange={setDraft} />
          {err && <div className="err">{err}</div>}
          <div className="row" style={{ marginTop: 12 }}>
            <button type="submit" disabled={busy}>
              {busy ? "校验并保存…" : "保存节点"}
            </button>
          </div>
        </form>
      )}

      <table style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>名称</th>
            <th>地址 / webhook</th>
            <th>类型</th>
            <th>Ingress</th>
            <th>体检</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((n) => (
            <tr key={n.id}>
              <td>{n.name}</td>
              <td>
                <code className="muted">{n.wsUrl}</code>
                {n.isMine && (
                  <>
                    <br />
                    <span className="muted" style={{ fontSize: 12 }}>
                      去 LiveKit 控制台把这个填进 Webhooks：
                    </span>
                    <CopyRow value={n.webhookUrl} />
                  </>
                )}
              </td>
              <td>
                {n.kind === "builtin" ? (
                  <span className="badge builtin">内置</span>
                ) : (
                  <span className="badge">我的</span>
                )}
              </td>
              <td>{n.capabilities?.ingress ? "可用" : "—"}</td>
              <td>
                {n.lastCheckOk === null ? "—" : n.lastCheckOk ? "正常" : "异常"}
              </td>
              <td>
                <div className="row">
                  <button
                    className="ghost"
                    disabled={checkingId === n.id}
                    onClick={() => recheck(n.id)}
                  >
                    {checkingId === n.id ? "检测中…" : "检测"}
                  </button>
                  {n.isMine && n.kind === "user" && (
                    <>
                      <button
                        className="ghost"
                        disabled={rotatingId === n.id}
                        onClick={() => rotate(n.id, n.name)}
                      >
                        {rotatingId === n.id ? "更新中…" : "换密钥"}
                      </button>
                      <button className="danger" onClick={() => remove(n.id)}>
                        删除
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
