"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
import type { AdminNode, AdminUser } from "@/lib/api-types";
import { healthLabel } from "@/lib/labels";
import { AppShell, type ShellUser } from "@/components/AppShell";
import {
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Icon,
  Loading,
  Tabs,
} from "@/ui";

type Panel = "nodes" | "users";

export function AdminClient({ user, selfId }: { user: ShellUser; selfId: string }) {
  const [panel, setPanel] = useState<Panel>("nodes");
  const [nodes, setNodes] = useState<AdminNode[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<AdminNode | null>(null);
  const [promoteBusy, setPromoteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ nodes: AdminNode[]; users: AdminUser[] }>("/api/admin");
      setNodes(res.nodes);
      setUsers(res.users);
      setErr(null);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchNode(nodeId: string, body: Record<string, unknown>) {
    setErr(null);
    try {
      await api(`/api/admin?nodeId=${nodeId}`, { method: "PATCH", json: body });
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    }
  }

  async function patchUser(id: string, body: Record<string, unknown>) {
    setErr(null);
    try {
      await api(`/api/admin/users/${id}`, { method: "PATCH", json: body });
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    }
  }

  async function confirmPromote() {
    if (!promoting) return;
    setPromoteBusy(true);
    const target = promoting;
    setPromoting(null);
    await patchNode(target.id, { makeBuiltin: true });
    setPromoteBusy(false);
  }

  const admins = users.filter((row) => row.role === "admin").length;

  return (
    <AppShell
      user={user}
      heading={<span>管理后台</span>}
      status={
        <>
          <span className="mx-statusbar__item">节点 {nodes.length}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">用户 {users.length}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">管理员 {admins}</span>
        </>
      }
    >
      <section className="mx-section">
        <header className="mx-section__header">
          <div className="mx-section__heading">
            <h1 className="mx-section__title">管理后台</h1>
            <p className="mx-section__subtitle">全站节点与用户。只有管理员能看到这一页。</p>
          </div>
          <span className="mx-section__spacer" />
          <div className="mx-section__actions">
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              <Icon name="refresh" size={14} />
              刷新
            </Button>
          </div>
        </header>

        {err && <Banner tone="error">{err}</Banner>}

        <Tabs
          label="管理分区"
          value={panel}
          onChange={setPanel}
          items={[
            { value: "nodes", label: "节点", icon: "node", count: nodes.length },
            { value: "users", label: "用户", icon: "users", count: users.length },
          ]}
        />

        {loading ? (
          <Loading />
        ) : panel === "nodes" ? (
          <NodesPanel
            nodes={nodes}
            onPatch={(id, body) => void patchNode(id, body)}
            onPromote={setPromoting}
          />
        ) : (
          <UsersPanel
            users={users}
            selfId={selfId}
            onPatch={(id, body) => void patchUser(id, body)}
          />
        )}
      </section>

      <ConfirmDialog
        open={promoting !== null}
        busy={promoteBusy}
        title="设为全站内置节点"
        confirmLabel="设为内置"
        body={
          <>
            把「{promoting?.name}」设为全站内置节点？现有的内置节点会降为普通节点，
            所有没接自己凭据的用户之后都会用这一个。
          </>
        }
        onConfirm={() => void confirmPromote()}
        onClose={() => setPromoting(null)}
      />
    </AppShell>
  );
}

function NodesPanel({
  nodes,
  onPatch,
  onPromote,
}: {
  nodes: AdminNode[];
  onPatch: (id: string, body: Record<string, unknown>) => void;
  onPromote: (node: AdminNode) => void;
}) {
  if (nodes.length === 0) {
    return (
      <EmptyState icon="node" title="还没有任何节点">
        先到「LiveKit 节点」页用「接入节点」加一个，再回来把它设为全站内置节点。
      </EmptyState>
    );
  }

  return (
    <Card
      title="节点"
      description="内置节点是全站共享的那一个 —— 用户不接自己的凭据也能建房，额度烧的是它。任何节点都可以被提升为内置，同时只能有一个。"
    >
      <div className="mx-table-wrap">
        <table className="mx-table">
          <thead>
            <tr>
              <th>节点</th>
              <th data-shrink="true">类型</th>
              <th data-shrink="true">活跃房间</th>
              <th data-shrink="true" data-align="center">
                启用
              </th>
              <th data-shrink="true" data-align="center">
                开放
              </th>
              <th data-shrink="true">房间上限</th>
              <th data-shrink="true" data-align="right" />
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => {
              const health = healthLabel(node.lastCheckOk);
              const builtin = node.kind === "builtin";
              return (
                <tr key={node.id}>
                  <td>
                    <span className="mx-cell">
                      <span className="mx-cell__label">{node.name}</span>
                      <span className="mx-cell__hint" data-mono="true">
                        {node.wsUrl}
                      </span>
                      {node.lastCheckOk === false && (
                        <span className="mx-cell__hint mx-text-error">
                          {node.lastCheckError ?? "体检失败"}
                        </span>
                      )}
                    </span>
                  </td>
                  <td data-shrink="true">
                    <span className="mx-inline">
                      {builtin ? (
                        <Badge tone="accent">内置</Badge>
                      ) : (
                        <Badge tone="neutral">用户</Badge>
                      )}
                      <Badge tone={health.tone} dot={node.lastCheckOk !== null}>
                        {health.text}
                      </Badge>
                    </span>
                  </td>
                  <td data-shrink="true">
                    {node.activeRooms}
                    {node.maxRooms !== null && (
                      <span className="mx-text-muted"> / {node.maxRooms}</span>
                    )}
                  </td>
                  <td data-shrink="true" data-align="center">
                    <Checkbox
                      checked={node.isEnabled}
                      aria-label={`启用 ${node.name}`}
                      onChange={(event) => onPatch(node.id, { isEnabled: event.target.checked })}
                    />
                  </td>
                  <td data-shrink="true" data-align="center">
                    {builtin ? (
                      <Checkbox
                        checked={node.allowPublic}
                        aria-label={`开放 ${node.name}`}
                        onChange={(event) =>
                          onPatch(node.id, { allowPublic: event.target.checked })
                        }
                      />
                    ) : (
                      <span className="mx-text-muted">—</span>
                    )}
                  </td>
                  <td data-shrink="true">
                    {builtin ? (
                      <input
                        type="number"
                        min={1}
                        className="mx-input"
                        aria-label={`${node.name} 房间上限`}
                        defaultValue={node.maxRooms ?? ""}
                        placeholder="不限"
                        style={{ width: 96 }}
                        onBlur={(event) =>
                          onPatch(node.id, {
                            maxRooms:
                              event.target.value.trim() === ""
                                ? null
                                : Number(event.target.value),
                          })
                        }
                      />
                    ) : (
                      <span className="mx-text-muted">—</span>
                    )}
                  </td>
                  <td data-shrink="true" data-align="right">
                    {!builtin && (
                      <Button variant="secondary" size="sm" onClick={() => onPromote(node)}>
                        设为内置
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function UsersPanel({
  users,
  selfId,
  onPatch,
}: {
  users: AdminUser[];
  selfId: string;
  onPatch: (id: string, body: Record<string, unknown>) => void;
}) {
  return (
    <Card title="用户" description="停用后该账号立刻签不出 token，也进不了任何房间。">
      <div className="mx-table-wrap">
        <table className="mx-table">
          <thead>
            <tr>
              <th>用户</th>
              <th data-shrink="true">角色</th>
              <th data-shrink="true">状态</th>
              <th data-shrink="true" data-align="right" />
            </tr>
          </thead>
          <tbody>
            {users.map((row) => {
              const isSelf = row.id === selfId;
              return (
                <tr key={row.id}>
                  <td>
                    <span className="mx-cell">
                      <span className="mx-cell__label">
                        {row.displayName}
                        {isSelf && (
                          <span style={{ marginLeft: "var(--mx-space-sm)" }}>
                            <Badge tone="info">我</Badge>
                          </span>
                        )}
                      </span>
                      <span className="mx-cell__hint">{row.email}</span>
                    </span>
                  </td>
                  <td data-shrink="true">
                    {row.role === "admin" ? (
                      <Badge tone="accent">管理员</Badge>
                    ) : (
                      <Badge tone="neutral">用户</Badge>
                    )}
                  </td>
                  <td data-shrink="true">
                    {row.isDisabled ? (
                      <Badge tone="error" dot>
                        已停用
                      </Badge>
                    ) : (
                      <Badge tone="success" dot>
                        正常
                      </Badge>
                    )}
                  </td>
                  <td data-shrink="true" data-align="right">
                    {!isSelf && (
                      <span className="mx-row-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            onPatch(row.id, { role: row.role === "admin" ? "user" : "admin" })
                          }
                        >
                          {row.role === "admin" ? "降为用户" : "设为管理员"}
                        </Button>
                        <Button
                          variant={row.isDisabled ? "secondary" : "danger"}
                          size="sm"
                          onClick={() => onPatch(row.id, { isDisabled: !row.isDisabled })}
                        >
                          {row.isDisabled ? "启用" : "停用"}
                        </Button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
