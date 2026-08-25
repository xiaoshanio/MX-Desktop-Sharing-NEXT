"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api-client";
import type { NodeSummary, RoomRow } from "@/lib/api-types";
import { roleLabel, roleTone } from "@/lib/labels";
import { AppShell, type ShellUser } from "@/components/AppShell";
import {
  NodeCredentialFields,
  emptyNodeDraft,
  type NodeDraft,
} from "@/components/NodeCredentialFields";
import {
  Badge,
  Banner,
  Button,
  EmptyState,
  Icon,
  IconButton,
  LinkButton,
  Loading,
  Modal,
  Select,
  TextField,
} from "@/ui";

export function DashboardClient({ user }: { user: ShellUser }) {
  const router = useRouter();
  const [nodes, setNodes] = useState<NodeSummary[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [nodeRes, roomRes] = await Promise.all([
        api<{ nodes: NodeSummary[] }>("/api/nodes"),
        api<{ rooms: RoomRow[] }>("/api/rooms"),
      ]);
      setNodes(nodeRes.nodes);
      setRooms(roomRes.rooms);
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

  const usableNodes = useMemo(() => nodes.filter((node) => node.isEnabled), [nodes]);
  const activeRooms = rooms.filter((room) => room.isActive).length;

  return (
    <AppShell
      user={user}
      heading={<span>房间</span>}
      status={
        <>
          <span className="mx-statusbar__item">房间 {rooms.length}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">活跃 {activeRooms}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">可用节点 {usableNodes.length}</span>
        </>
      }
    >
      <section className="mx-section">
        <header className="mx-section__header">
          <div className="mx-section__heading">
            <h1 className="mx-section__title">房间</h1>
            <p className="mx-section__subtitle">
              每个房间绑定一个 LiveKit 节点，媒体流量只走那个节点、只烧那个节点的额度。
            </p>
          </div>
          <span className="mx-section__spacer" />
          <div className="mx-section__actions">
            <Button variant="secondary" size="sm" onClick={() => void refresh()}>
              <Icon name="refresh" size={14} />
              刷新
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
              <Icon name="plus" size={14} />
              创建房间
            </Button>
          </div>
        </header>

        {err && <Banner tone="error">{err}</Banner>}

        <div className="mx-stats">
          <Stat icon="rooms" tone="accent" value={rooms.length} label="我的房间" />
          <Stat icon="broadcast" tone="success" value={activeRooms} label="活跃房间" />
          <Stat icon="node" tone="info" value={usableNodes.length} label="可用节点" />
        </div>

        {loading ? (
          <Loading />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon="rooms"
            title="还没有房间"
            actions={
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Icon name="plus" size={16} />
                创建第一个房间
              </Button>
            }
          >
            建一个房间，就能拿到属于你自己的 OBS 推流地址，或者直接从浏览器共享屏幕。
          </EmptyState>
        ) : (
          <div className="mx-list">
            {rooms.map((room) => (
              <RoomListRow key={room.code} room={room} />
            ))}
          </div>
        )}
      </section>

      <CreateRoomDialog
        open={creating}
        nodes={usableNodes}
        onClose={() => setCreating(false)}
        onCreated={async (code) => {
          setCreating(false);
          await refresh();
          router.push(`/room/${code}`);
        }}
      />
    </AppShell>
  );
}

function Stat({
  icon,
  tone,
  value,
  label,
}: {
  icon: "rooms" | "broadcast" | "node";
  tone: "accent" | "success" | "info";
  value: number;
  label: string;
}) {
  return (
    <div className="mx-stat">
      <span className="mx-stat__icon" data-tone={tone}>
        <Icon name={icon} size={19} />
      </span>
      <span className="mx-stat__body">
        <span className="mx-stat__value">{value}</span>
        <span className="mx-stat__label">{label}</span>
      </span>
    </div>
  );
}

function RoomListRow({ room }: { room: RoomRow }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-row">
      <span className="mx-row__lead" data-tone={room.isActive ? "accent" : undefined}>
        <Icon name="rooms" size={19} />
      </span>

      <div className="mx-row__main">
        <div className="mx-row__title">
          <span className="mx-row__name">{room.name}</span>
          {room.isActive ? (
            <Badge tone="success" dot>
              活跃
            </Badge>
          ) : (
            <Badge tone="neutral">已关闭</Badge>
          )}
          <Badge tone={roleTone(room.role)}>{roleLabel(room.role)}</Badge>
        </div>
        <div className="mx-row__meta">
          <code>{room.code}</code>
          <span>·</span>
          <span>节点 {room.nodeName}</span>
          {room.nodeKind === "builtin" && <Badge tone="info">内置</Badge>}
        </div>
      </div>

      <div className="mx-row__actions">
        <IconButton
          size="sm"
          label={copied ? "房间码已复制" : "复制房间码"}
          onClick={() => void copyCode()}
        >
          <Icon name={copied ? "check" : "copy"} size={15} />
        </IconButton>
        <LinkButton href={`/room/${room.code}`} variant="primary" size="sm">
          进入
          <Icon name="chevronRight" size={14} />
        </LinkButton>
      </div>
    </div>
  );
}

const NEW_NODE = "__new__";

function CreateRoomDialog({
  open,
  nodes,
  onClose,
  onCreated,
}: {
  open: boolean;
  nodes: NodeSummary[];
  onClose: () => void;
  onCreated: (code: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [draft, setDraft] = useState<NodeDraft>(emptyNodeDraft());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Default to the first usable node, or straight to "bring your own" when there is none.
  useEffect(() => {
    if (!open) return;
    setNodeId(nodes[0]?.id ?? NEW_NODE);
  }, [open, nodes]);

  const bringingOwnNode = nodeId === NEW_NODE;
  const selected = nodes.find((node) => node.id === nodeId);

  const options = [
    ...nodes.map((node) => ({
      value: node.id,
      label: `${node.name}${node.kind === "builtin" ? "（内置 · 共享额度）" : "（我的）"}${
        node.capabilities?.ingress === false ? " · 无 OBS 推流" : ""
      }`,
    })),
    { value: NEW_NODE, label: "+ 接入一套新的 LiveKit 凭据…" },
  ];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = { name };
      if (bringingOwnNode) body.newNode = draft;
      else body.nodeId = nodeId;

      const { room } = await api<{ room: { code: string } }>("/api/rooms", {
        method: "POST",
        json: body,
      });
      setName("");
      setDraft(emptyNodeDraft());
      await onCreated(room.code);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="创建房间"
      onClose={onClose}
      size={bringingOwnNode ? "lg" : "md"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button variant="primary" form="mx-create-room" type="submit" disabled={busy}>
            {busy ? "创建中…" : "创建房间"}
          </Button>
        </>
      }
    >
      <form id="mx-create-room" className="mx-form" onSubmit={submit}>
        <TextField
          label="房间名"
          required
          autoFocus
          placeholder="周会演示"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <Select
          label="使用哪个节点"
          options={options}
          value={nodeId}
          onChange={(event) => setNodeId(event.target.value)}
          hint={
            selected?.capabilities?.ingress === false
              ? "这个节点的 Ingress 不可用，房间里拿不到 OBS 推流地址，但浏览器共享仍然可用。"
              : "房间建好后不能换节点。"
          }
        />

        {bringingOwnNode && <NodeCredentialFields value={draft} onChange={setDraft} />}

        {nodes.length === 0 && !bringingOwnNode && (
          <Banner tone="warning" title="没有可用节点">
            选上面的「接入一套新的 LiveKit 凭据」，或者先到「LiveKit 节点」页添加一个。
          </Banner>
        )}

        {err && <Banner tone="error">{err}</Banner>}
      </form>
    </Modal>
  );
}
