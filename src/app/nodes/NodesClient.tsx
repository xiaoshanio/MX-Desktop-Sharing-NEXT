"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
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
  const [nodes, setNodes] = useState<NodeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [rotating, setRotating] = useState<NodeSummary | null>(null);
  const [deleting, setDeleting] = useState<NodeSummary | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api<{ nodes: NodeSummary[] }>("/api/nodes");
      setNodes(res.nodes);
      setErr(null);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function recheck(node: NodeSummary) {
    setCheckingId(node.id);
    setErr(null);
    setNotice(null);
    try {
      await api(`/api/nodes/${node.id}`, { method: "POST" });
      await refresh();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setCheckingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setErr(null);
    try {
      await api(`/api/nodes/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      await refresh();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
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
      heading={<span>LiveKit 节点</span>}
      status={
        <>
          <span className="mx-statusbar__item">节点 {nodes.length}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">我的 {mine}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">体检正常 {healthy}</span>
        </>
      }
    >
      <section className="mx-section">
        <header className="mx-section__header">
          <div className="mx-section__heading">
            <h1 className="mx-section__title">LiveKit 节点</h1>
            <p className="mx-section__subtitle">
              接入你自己的 LiveKit 凭据，房间就烧你自己的免费额度，不跟别人抢。
            </p>
          </div>
          <span className="mx-section__spacer" />
          <div className="mx-section__actions">
            <Button variant="secondary" size="sm" onClick={() => void refresh()}>
              <Icon name="refresh" size={14} />
              刷新
            </Button>
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              <Icon name="plus" size={14} />
              接入节点
            </Button>
          </div>
        </header>

        {err && <Banner tone="error">{err}</Banner>}
        {notice && <Banner tone="success">{notice}</Banner>}

        {loading ? (
          <Loading />
        ) : nodes.length === 0 ? (
          <EmptyState
            icon="node"
            title="还没有任何节点"
            actions={
              <Button variant="primary" onClick={() => setAdding(true)}>
                <Icon name="plus" size={16} />
                接入我的第一个节点
              </Button>
            }
          >
            LiveKit Cloud 的免费 Build 计划不用绑卡，三分钟就能开一个。添加时本站会实地打一次
            API 验证，凭据填错不会存进去。
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
          setNotice("节点已保存，凭据体检通过。");
          await refresh();
        }}
      />

      <RotateKeyDialog
        node={rotating}
        onClose={() => setRotating(null)}
        onSaved={async (name) => {
          setRotating(null);
          setNotice(`「${name}」的密钥已更新，新凭据体检通过。`);
          await refresh();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        danger
        busy={deleteBusy}
        title="删除节点"
        confirmLabel="删除"
        body={
          <>
            确定删除「{deleting?.name}」？它下面的活跃房间必须先关闭，否则删除会被拒绝。
          </>
        }
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
  const [showWebhook, setShowWebhook] = useState(false);
  const health = healthLabel(node.lastCheckOk);
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
              <Badge tone="accent">内置</Badge>
            ) : (
              <Badge tone="neutral">{node.isMine ? "我的" : "他人"}</Badge>
            )}
            <Badge tone={health.tone} dot={node.lastCheckOk !== null}>
              {health.text}
            </Badge>
            {!node.isEnabled && <Badge tone="warning">已停用</Badge>}
          </div>
          <div className="mx-row__meta">
            <code>{node.wsUrl}</code>
            <span>·</span>
            <span>Ingress {node.capabilities?.ingress ? "可用" : "不可用"}</span>
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
            {checking ? "检测中…" : "检测"}
          </Button>
          {editable && (
            <>
              <IconButton size="sm" label="换密钥" onClick={onRotate}>
                <Icon name="key" size={15} />
              </IconButton>
              <IconButton size="sm" tone="danger" label="删除节点" onClick={onDelete}>
                <Icon name="trash" size={15} />
              </IconButton>
            </>
          )}
        </div>
      </div>

      {showWebhook && node.isMine && (
        <div className="mx-row__extra">
          <span className="mx-text-caption">
            去 LiveKit 控制台 Settings → Webhooks，把下面这个地址填进去。房间成员的在线状态靠它更新。
          </span>
          <CopyRow value={node.webhookUrl} label="Webhook 地址" />
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
  const [draft, setDraft] = useState<NodeDraft>(emptyNodeDraft());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(emptyNodeDraft());
    setErr(null);
  }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api("/api/nodes", { method: "POST", json: draft });
      await onSaved();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="接入我的 LiveKit 节点"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button variant="primary" type="submit" form="mx-add-node" disabled={busy}>
            {busy ? "校验并保存…" : "保存节点"}
          </Button>
        </>
      }
    >
      <form id="mx-add-node" className="mx-form" onSubmit={submit}>
        <NodeCredentialFields value={draft} onChange={setDraft} />
        {err && <Banner tone="error">{err}</Banner>}
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
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!node) return;
    setApiKey("");
    setApiSecret("");
    setErr(null);
  }, [node]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!node) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/nodes/${node.id}`, {
        method: "PATCH",
        json: { apiKey: apiKey.trim(), apiSecret: apiSecret.trim() },
      });
      await onSaved(node.name);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={node !== null}
      title={`更新「${node?.name ?? ""}」的密钥`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button variant="primary" type="submit" form="mx-rotate-key" disabled={busy}>
            {busy ? "校验并更新…" : "更新密钥"}
          </Button>
        </>
      }
    >
      <form id="mx-rotate-key" className="mx-form" onSubmit={submit}>
        <p className="mx-text-caption">
          写入前会先拿新凭据打一次 LiveKit API。校验不过就不改动，旧密钥继续有效。
        </p>
        <TextField
          label="新 API Key"
          required
          mono
          autoFocus
          placeholder="APIxxxxxxxx"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
        <TextField
          label="新 API Secret"
          required
          type="password"
          autoComplete="new-password"
          value={apiSecret}
          onChange={(event) => setApiSecret(event.target.value)}
        />
        {err && <Banner tone="error">{err}</Banner>}
      </form>
    </Modal>
  );
}
