"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
import { useT } from "@/i18n";
import { humanizeError } from "@/lib/error-text";
import { toast } from "@/lib/toast";
import type { NodeSummary } from "@/lib/api-types";
import { healthLabel } from "@/lib/labels";
import { AppShell, type ShellUser } from "@/components/AppShell";
import { CopyRow } from "@/components/CopyRow";
import {
  NodeCredentialFields,
  emptyNodeDraft,
  type NodeDraft,
} from "@/components/NodeCredentialFields";
import {
  Badge,
  Banner,
  Button,
  ConfirmDialog,
  EmptyState,
  Icon,
  IconButton,
  Loading,
  Modal,
  TextField,
} from "@/ui";

export function NodesClient({ user }: { user: ShellUser }) {
  const t = useT();
  const [nodes, setNodes] = useState<NodeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);
  const [rotating, setRotating] = useState<NodeSummary | null>(null);
  const [deleting, setDeleting] = useState<NodeSummary | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api<{ nodes: NodeSummary[] }>("/api/nodes");
      setNodes(res.nodes);
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function recheck(node: NodeSummary) {
    setCheckingId(node.id);
    try {
      await api(`/api/nodes/${node.id}`, { method: "POST" });
      await refresh();
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setCheckingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api(`/api/nodes/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      await refresh();
    } catch (error) {
      toast.error(humanizeError(t, error));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  const mine = nodes.filter((node) => node.isMine && node.kind === "user").length;
  const healthy = nodes.filter((node) => node.lastCheckOk === true).length;

  return (
    <AppShell
      user={user}
      loading={loading}
      loadingLabel={t("nodes.loading")}
      heading={<span>{t("nodes.heading")}</span>}
      status={
        <>
          <span className="mx-statusbar__item">
            {t("nodes.stat.total", { count: nodes.length })}
          </span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">{t("nodes.stat.mine", { count: mine })}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">
            {t("nodes.stat.healthy", { count: healthy })}
          </span>
        </>
      }
    >
      <section className="mx-section">
        <header className="mx-section__header">
          <div className="mx-section__heading">
            <h1 className="mx-section__title">{t("nodes.heading")}</h1>
            <p className="mx-section__subtitle">{t("nodes.subtitle")}</p>
          </div>
          <span className="mx-section__spacer" />
          <div className="mx-section__actions">
            <Button variant="secondary" size="sm" onClick={() => void refresh()}>
              <Icon name="refresh" size={14} />
              {t("common.refresh")}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              <Icon name="plus" size={14} />
              {t("nodes.add")}
            </Button>
          </div>
        </header>

        {nodes.length === 0 ? (
          <EmptyState
            icon="node"
            title={t("nodes.empty.title")}
            actions={
              <Button variant="primary" onClick={() => setAdding(true)}>
                <Icon name="plus" size={16} />
                {t("nodes.empty.action")}
              </Button>
            }
          >
            {t("nodes.empty.body")}
          </EmptyState>
        ) : (
          <div className="mx-list">
            {nodes.map((node) => (
              <NodeListRow
                key={node.id}
                node={node}
                checking={checkingId === node.id}
                onRecheck={() => void recheck(node)}
                onRotate={() => setRotating(node)}
                onDelete={() => setDeleting(node)}
              />
            ))}
          </div>
        )}
      </section>

      <AddNodeDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={async () => {
          setAdding(false);
          toast.success(t("nodes.saved"));
          await refresh();
        }}
      />

      <RotateKeyDialog
        node={rotating}
        onClose={() => setRotating(null)}
        onSaved={async (name) => {
          setRotating(null);
          toast.success(t("nodes.rotated", { name }));
          await refresh();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        danger
        busy={deleteBusy}
        title={t("nodes.deleteTitle")}
        confirmLabel={t("common.delete")}
        body={t("nodes.deleteBody", { name: deleting?.name ?? "" })}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleting(null)}
      />
    </AppShell>
  );
}

function NodeListRow({
  node,
  checking,
  onRecheck,
  onRotate,
  onDelete,
}: {
  node: NodeSummary;
  checking: boolean;
  onRecheck: () => void;
  onRotate: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [showWebhook, setShowWebhook] = useState(false);
  const health = healthLabel(t, node.lastCheckOk);
  const editable = node.isMine && node.kind === "user";

  return (
    <div className="mx-row" data-stacked={showWebhook ? "true" : undefined}>
      <div className="mx-inline" style={{ width: "100%", gap: "var(--mx-space-lg)" }}>
        <span className="mx-row__lead" data-tone={node.kind === "builtin" ? "accent" : undefined}>
          <Icon name="node" size={19} />
        </span>

        <div className="mx-row__main">
          <div className="mx-row__title">
            <span className="mx-row__name">{node.name}</span>
            {node.kind === "builtin" ? (
              <Badge tone="accent">{t("nodes.badge.builtin")}</Badge>
            ) : (
              <Badge tone="neutral">
                {node.isMine ? t("nodes.badge.mine") : t("nodes.badge.theirs")}
              </Badge>
            )}
            <Badge tone={health.tone} dot={node.lastCheckOk !== null}>
              {health.text}
            </Badge>
            {!node.isEnabled && <Badge tone="warning">{t("nodes.badge.disabled")}</Badge>}
          </div>
          <div className="mx-row__meta">
            <code>{node.wsUrl}</code>
            <span>·</span>
            <span>{node.capabilities?.ingress ? t("nodes.ingressOk") : t("nodes.ingressBad")}</span>
          </div>
        </div>

        <div className="mx-row__actions">
          {node.isMine && (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setShowWebhook((state) => !state)}
              aria-expanded={showWebhook}
            >
              <Icon name="link" size={14} />
              Webhook
            </Button>
          )}
          <Button variant="secondary" size="sm" disabled={checking} onClick={onRecheck}>
            {checking ? t("nodes.checking") : t("nodes.check")}
          </Button>
          {editable && (
            <>
              <IconButton size="sm" label={t("nodes.rotate")} onClick={onRotate}>
                <Icon name="key" size={15} />
              </IconButton>
              <IconButton size="sm" tone="danger" label={t("nodes.delete")} onClick={onDelete}>
                <Icon name="trash" size={15} />
              </IconButton>
            </>
          )}
        </div>
      </div>

      {showWebhook && node.isMine && (
        <div className="mx-row__extra">
          <span className="mx-text-caption">{t("nodes.webhookHint")}</span>
          <CopyRow value={node.webhookUrl} label={t("nodes.webhookLabel")} />
        </div>
      )}
    </div>
  );
}

function AddNodeDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const t = useT();
  const [draft, setDraft] = useState<NodeDraft>(emptyNodeDraft());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(emptyNodeDraft());
  }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/nodes", { method: "POST", json: draft });
      await onSaved();
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title={t("nodes.add.title")}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" type="submit" form="mx-add-node" disabled={busy}>
            {busy ? t("nodes.add.busy") : t("nodes.add.submit")}
          </Button>
        </>
      }
    >
      <form id="mx-add-node" className="mx-form" onSubmit={submit}>
        <NodeCredentialFields value={draft} onChange={setDraft} />
      </form>
    </Modal>
  );
}

/**
 * 换密钥：在 LiveKit 那边重建 key 之后用这个更新。服务端会先体检新凭据再写入，
 * 所以填错不会把节点弄坏。
 */
function RotateKeyDialog({
  node,
  onClose,
  onSaved,
}: {
  node: NodeSummary | null;
  onClose: () => void;
  onSaved: (name: string) => Promise<void>;
}) {
  const t = useT();
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!node) return;
    setApiKey("");
    setApiSecret("");
  }, [node]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!node) return;
    setBusy(true);
    try {
      await api(`/api/nodes/${node.id}`, {
        method: "PATCH",
        json: { apiKey: apiKey.trim(), apiSecret: apiSecret.trim() },
      });
      await onSaved(node.name);
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={node !== null}
      title={t("nodes.rotate.title", { name: node?.name ?? "" })}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" type="submit" form="mx-rotate-key" disabled={busy}>
            {busy ? t("nodes.rotate.busy") : t("nodes.rotate.submit")}
          </Button>
        </>
      }
    >
      <form id="mx-rotate-key" className="mx-form" onSubmit={submit}>
        <p className="mx-text-caption">{t("nodes.rotate.note")}</p>
        <TextField
          label={t("nodes.rotate.newKey")}
          required
          mono
          autoFocus
          placeholder="APIxxxxxxxx"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
        <TextField
          label={t("nodes.rotate.newSecret")}
          required
          type="password"
          autoComplete="new-password"
          value={apiSecret}
          onChange={(event) => setApiSecret(event.target.value)}
        />
      </form>
    </Modal>
  );
}
