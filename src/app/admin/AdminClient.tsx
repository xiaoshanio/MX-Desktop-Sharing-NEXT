"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";

type AdminNode = {
  id: string;
  name: string;
  kind: "builtin" | "user";
  wsUrl: string;
  isEnabled: boolean;
  allowPublic: boolean;
  maxRooms: number | null;
  activeRooms: number;
  lastCheckOk: boolean | null;
  lastCheckError: string | null;
};

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
  isDisabled: boolean;
  createdAt: string;
};

export function AdminClient({ selfId }: { selfId: string }) {
  const [nodes, setNodes] = useState<AdminNode[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ nodes: AdminNode[]; users: AdminUser[] }>("/api/admin");
      setNodes(r.nodes);
      setUsers(r.users);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchNode(nodeId: string, body: Record<string, unknown>) {
    try {
      await api(`/api/admin?nodeId=${nodeId}`, { method: "PATCH", json: body });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  async function patchUser(id: string, body: Record<string, unknown>) {
    try {
      await api(`/api/admin/users/${id}`, { method: "PATCH", json: body });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <h1>管理后台</h1>
        <a href="/dashboard">← 控制台</a>
      </div>

      {err && (
        <div className="panel">
          <div className="err">{err}</div>
        </div>
      )}

      <div className="panel">
        <h2>节点</h2>
        <p className="muted">
          内置节点是全站共享的那一个，普通用户不接自己的凭据也能建房 —— 额度烧的是它。
          任何节点都可以被提升为内置节点，同时只能有一个。
        </p>
        {nodes.length === 0 && (
          <p className="muted">
            还没有任何节点。先到 <a href="/dashboard">控制台</a> 用「+ 接入我的节点」加一个，
            再回来把它设为内置。
          </p>
        )}
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>活跃房间</th>
              <th>启用</th>
              <th>开放</th>
              <th>房间上限</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => (
              <tr key={n.id}>
                <td>
                  {n.name}
                  <br />
                  <code className="muted">{n.wsUrl}</code>
                  {n.lastCheckOk === false && (
                    <>
                      <br />
                      <span className="err">{n.lastCheckError ?? "体检失败"}</span>
                    </>
                  )}
                </td>
                <td>
                  {n.kind === "builtin" ? (
                    <span className="badge builtin">内置</span>
                  ) : (
                    <span className="badge">用户</span>
                  )}
                </td>
                <td>
                  {n.activeRooms}
                  {n.maxRooms !== null && ` / ${n.maxRooms}`}
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={n.isEnabled}
                    onChange={(e) => patchNode(n.id, { isEnabled: e.target.checked })}
                  />
                </td>
                <td>
                  {n.kind === "builtin" ? (
                    <input
                      type="checkbox"
                      checked={n.allowPublic}
                      onChange={(e) => patchNode(n.id, { allowPublic: e.target.checked })}
                    />
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {n.kind === "builtin" ? (
                    <input
                      type="number"
                      min={1}
                      defaultValue={n.maxRooms ?? ""}
                      placeholder="不限"
                      style={{ width: 90 }}
                      onBlur={(e) =>
                        patchNode(n.id, {
                          maxRooms: e.target.value.trim() === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {n.kind !== "builtin" && (
                    <button
                      className="ghost"
                      onClick={() => {
                        if (!confirm(`把「${n.name}」设为全站内置节点？现有的内置节点会降为普通节点。`)) return;
                        void patchNode(n.id, { makeBuiltin: true });
                      }}
                    >
                      设为内置
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>用户</h2>
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.displayName}
                  {u.id === selfId && <span className="badge" style={{ marginLeft: 6 }}>我</span>}
                  <br />
                  <span className="muted">{u.email}</span>
                </td>
                <td>{u.role === "admin" ? "管理员" : "用户"}</td>
                <td>{u.isDisabled ? "已停用" : "正常"}</td>
                <td>
                  {u.id !== selfId && (
                    <div className="row">
                      <button
                        className="ghost"
                        onClick={() =>
                          patchUser(u.id, { role: u.role === "admin" ? "user" : "admin" })
                        }
                      >
                        {u.role === "admin" ? "降为用户" : "设为管理员"}
                      </button>
                      <button
                        className={u.isDisabled ? "ghost" : "danger"}
                        onClick={() => patchUser(u.id, { isDisabled: !u.isDisabled })}
                      >
                        {u.isDisabled ? "启用" : "停用"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
