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
          内置节点的额度是全站共享的。把「开放」关掉，普通用户就必须接自己的 LiveKit 项目。
        </p>
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>活跃房间</th>
              <th>启用</th>
              <th>开放</th>
              <th>房间上限</th>
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
