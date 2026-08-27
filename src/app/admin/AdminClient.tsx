"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
import { useT, type TFunction } from "@/i18n";
import { humanizeError } from "@/lib/error-text";
import { toast } from "@/lib/toast";
import type { AdminNode, AdminUser } from "@/lib/api-types";
import { healthLabel } from "@/lib/labels";
import { AppShell, type ShellUser } from "@/components/AppShell";
import { ServicesPanel } from "./ServicesPanel";
import { SitePanel } from "./SitePanel";
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

type Panel = "nodes" | "users" | "services" | "site";

export function AdminClient({ user, selfId }: { user: ShellUser; selfId: string }) {
  const t = useT();
  const [panel, setPanel] = useState<Panel>("nodes");
  const [nodes, setNodes] = useState<AdminNode[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<AdminNode | null>(null);
  const [promoteBusy, setPromoteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ nodes: AdminNode[]; users: AdminUser[] }>("/api/admin");
      setNodes(res.nodes);
      setUsers(res.users);
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchNode(nodeId: string, body: Record<string, unknown>) {
    try {
      await api(`/api/admin?nodeId=${nodeId}`, { method: "PATCH", json: body });
      await load();
    } catch (error) {
      toast.error(humanizeError(t, error));
    }
  }

  async function patchUser(id: string, body: Record<string, unknown>) {
    try {
      await api(`/api/admin/users/${id}`, { method: "PATCH", json: body });
      await load();
    } catch (error) {
      toast.error(humanizeError(t, error));
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
      loading={loading}
      loadingLabel={t("admin.loading")}
      heading={<span>{t("admin.heading")}</span>}
      status={
        <>
          <span className="mx-statusbar__item">
            {t("admin.stat.nodes", { count: nodes.length })}
          </span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">
            {t("admin.stat.users", { count: users.length })}
          </span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">
            {t("admin.stat.admins", { count: admins })}
          </span>
        </>
      }
    >
      <section className="mx-section">
        <header className="mx-section__header">
          <div className="mx-section__heading">
            <h1 className="mx-section__title">{t("admin.heading")}</h1>
            <p className="mx-section__subtitle">{t("admin.subtitle")}</p>
          </div>
          <span className="mx-section__spacer" />
          <div className="mx-section__actions">
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              <Icon name="refresh" size={14} />
              {t("common.refresh")}
            </Button>
          </div>
        </header>

        <Tabs
          label={t("admin.tabs")}
          value={panel}
          onChange={setPanel}
          items={[
            { value: "nodes", label: t("admin.tab.nodes"), icon: "node", count: nodes.length },
            { value: "users", label: t("admin.tab.users"), icon: "users", count: users.length },
            { value: "services", label: t("admin.tab.services"), icon: "key" },
            { value: "site", label: t("admin.tab.site"), icon: "sliders" },
          ]}
        />

        {panel === "nodes" ? (
          <NodesPanel
            nodes={nodes}
            onPatch={(id, body) => void patchNode(id, body)}
            onPromote={setPromoting}
          />
        ) : panel === "users" ? (
          <UsersPanel
            users={users}
            selfId={selfId}
            onPatch={(id, body) => void patchUser(id, body)}
          />
        ) : panel === "services" ? (
          <ServicesPanel />
        ) : (
          <SitePanel />
        )}
      </section>

      <ConfirmDialog
        open={promoting !== null}
        busy={promoteBusy}
        title={t("admin.promote.title")}
        confirmLabel={t("admin.promote.confirm")}
        body={t("admin.promote.body", { name: promoting?.name ?? "" })}
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
  const t = useT();
  if (nodes.length === 0) {
    return (
      <EmptyState icon="node" title={t("admin.nodes.emptyTitle")}>
        {t("admin.nodes.emptyBody")}
      </EmptyState>
    );
  }

  return (
    <Card title={t("admin.nodes.title")} description={t("admin.nodes.desc")}>
      <div className="mx-table-wrap">
        <table className="mx-table">
          <thead>
            <tr>
              <th>{t("admin.nodes.col.node")}</th>
              <th data-shrink="true">{t("admin.nodes.col.kind")}</th>
              <th data-shrink="true">{t("admin.nodes.col.activeRooms")}</th>
              <th data-shrink="true" data-align="center">
                {t("admin.nodes.col.enabled")}
              </th>
              <th data-shrink="true" data-align="center">
                {t("admin.nodes.col.public")}
              </th>
              <th data-shrink="true">{t("admin.nodes.col.maxRooms")}</th>
              <th data-shrink="true" data-align="right" />
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => {
              const health = healthLabel(t, node.lastCheckOk);
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
                          {node.lastCheckError ?? t("admin.nodes.checkFailed")}
                        </span>
                      )}
                    </span>
                  </td>
                  <td data-shrink="true">
                    <span className="mx-inline">
                      {builtin ? (
                        <Badge tone="accent">{t("admin.nodes.kindBuiltin")}</Badge>
                      ) : (
                        <Badge tone="neutral">{t("admin.nodes.kindUser")}</Badge>
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
                      aria-label={t("admin.nodes.enableAria", { name: node.name })}
                      onChange={(event) => onPatch(node.id, { isEnabled: event.target.checked })}
                    />
                  </td>
                  <td data-shrink="true" data-align="center">
                    {builtin ? (
                      <Checkbox
                        checked={node.allowPublic}
                        aria-label={t("admin.nodes.publicAria", { name: node.name })}
                        onChange={(event) =>
                          onPatch(node.id, { allowPublic: event.target.checked })
                        }
                      />
                    ) : (
                      <span className="mx-text-muted">{t("common.dash")}</span>
                    )}
                  </td>
                  <td data-shrink="true">
                    {builtin ? (
                      <input
                        type="number"
                        min={1}
                        className="mx-input"
                        aria-label={t("admin.nodes.maxRoomsAria", { name: node.name })}
                        defaultValue={node.maxRooms ?? ""}
                        placeholder={t("admin.nodes.maxRoomsPlaceholder")}
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
                      <span className="mx-text-muted">{t("common.dash")}</span>
                    )}
                  </td>
                  <td data-shrink="true" data-align="right">
                    {!builtin && (
                      <Button variant="secondary" size="sm" onClick={() => onPromote(node)}>
                        {t("admin.nodes.makeBuiltin")}
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
  const t = useT();
  return (
    <Card title={t("admin.users.title")} description={t("admin.users.desc")}>
      <div className="mx-table-wrap">
        <table className="mx-table">
          <thead>
            <tr>
              <th>{t("admin.users.col.user")}</th>
              <th data-shrink="true">{t("admin.users.col.role")}</th>
              <th data-shrink="true">{t("admin.users.col.status")}</th>
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
                            <Badge tone="info">{t("admin.users.me")}</Badge>
                          </span>
                        )}
                      </span>
                      <span className="mx-cell__hint">{row.email}</span>
                    </span>
                  </td>
                  <td data-shrink="true">
                    {row.role === "admin" ? (
                      <Badge tone="accent">{t("admin.users.admin")}</Badge>
                    ) : (
                      <Badge tone="neutral">{t("admin.users.user")}</Badge>
                    )}
                  </td>
                  <td data-shrink="true">
                    {row.isDisabled ? (
                      <Badge tone="error" dot>
                        {t("admin.users.disabled")}
                      </Badge>
                    ) : (
                      <Badge tone="success" dot>
                        {t("admin.users.ok")}
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
                          {row.role === "admin"
                            ? t("admin.users.demote")
                            : t("admin.users.promote")}
                        </Button>
                        <Button
                          variant={row.isDisabled ? "secondary" : "danger"}
                          size="sm"
                          onClick={() => onPatch(row.id, { isDisabled: !row.isDisabled })}
                        >
                          {row.isDisabled ? t("admin.users.enable") : t("admin.users.disable")}
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
