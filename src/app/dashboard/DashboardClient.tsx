"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api-client";
import type { NodeSummary, RoomRow } from "@/lib/api-types";
import { humanizeError } from "@/lib/error-text";
import { roleLabel, roleTone } from "@/lib/labels";
import { toast } from "@/lib/toast";
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
  Modal,
  Select,
  TextField,
} from "@/ui";

/**
 * 完整房间码的形状：10 位，字母表去掉了容易看错的 0/1/o/i/l（见 lib/room-code.ts）。
 * 用来判断「用户敲的是一个可以直接进的房间码」还是「只是在搜自己的房间」。
 */
const FULL_CODE = /^[2-9a-hjkmnp-z]{10}$/;

export function DashboardClient({ user }: { user: ShellUser }) {
  const router = useRouter();
  const [nodes, setNodes] = useState<NodeSummary[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async (silent = false) => {
    try {
      const [nodeRes, roomRes] = await Promise.all([
        api<{ nodes: NodeSummary[] }>("/api/nodes"),
        api<{ rooms: RoomRow[] }>("/api/rooms"),
      ]);
      setNodes(nodeRes.nodes);
      setRooms(roomRes.rooms);
      if (silent) toast.success("已刷新");
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const usableNodes = useMemo(() => nodes.filter((node) => node.isEnabled), [nodes]);
  const activeRooms = rooms.filter((room) => room.isActive).length;
  const totalOnline = rooms.reduce((sum, room) => sum + room.onlineCount, 0);

  return (
    <AppShell
      user={user}
      loading={loading}
      loadingLabel="正在加载房间…"
      heading={<span>房间</span>}
      status={
        <>
          <span className="mx-statusbar__item">房间 {rooms.length}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">活跃 {activeRooms}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">在线 {totalOnline}</span>
          <span className="mx-statusbar__divider" />
          <span className="mx-statusbar__item">可用节点 {usableNodes.length}</span>
        </>
      }
    >
      <section className="mx-section">
        {/* 搜索区：居中，输入房间码直接进；也能搜自己已加入的房间 */}
        <RoomFinder rooms={rooms} onEnter={(code) => router.push(`/room/${code}`)} />

        <header className="mx-section__header">
          <div className="mx-section__heading">
            <h2 className="mx-section__title">我加入的房间</h2>
            <p className="mx-section__subtitle">
              点卡片直接进入。每个房间绑定一个 LiveKit 节点，媒体流量只走那个节点。
            </p>
          </div>
          <span className="mx-section__spacer" />
          <div className="mx-section__actions">
            <Button variant="secondary" size="sm" onClick={() => void refresh(true)}>
              <Icon name="refresh" size={14} />
              刷新
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
              <Icon name="plus" size={14} />
              创建房间
            </Button>
          </div>
        </header>

        {rooms.length === 0 ? (
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
            别人给你房间码的话，用上面的搜索框进去。
          </EmptyState>
        ) : (
          <div className="mx-roomgrid">
            {rooms.map((room) => (
              <RoomCard key={room.code} room={room} onEnter={() => router.push(`/room/${room.code}`)} />
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
          toast.success("房间已创建");
          await refresh();
          router.push(`/room/${code}`);
        }}
      />
    </AppShell>
  );
}

/* ============================================================
   搜索 / 输入房间码
   ============================================================ */

function RoomFinder({
  rooms,
  onEnter,
}: {
  rooms: RoomRow[];
  onEnter: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  /** 键盘上下选中的那一项 */
  const [cursor, setCursor] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (trimmed === "") return [];
    return rooms
      .filter(
        (room) =>
          room.code.toLowerCase().includes(trimmed) ||
          room.name.toLowerCase().includes(trimmed),
      )
      .slice(0, 8);
  }, [rooms, trimmed]);

  /**
   * 敲了一个完整房间码、但它不在「我加入的房间」里。
   *
   * 这时候仍然给一条「直接进入」的入口，让服务端去判断能不能进 ——
   * 前端这边不做任何存在性提示：`/api/rooms/[code]` 对非成员一律回 404，
   * 就是为了不让人拿房间码逐个探测。所以这里不能显示「这个房间不存在」之类的话，
   * 那等于把探测能力还回去了。
   */
  const directCode =
    FULL_CODE.test(trimmed) && !rooms.some((room) => room.code.toLowerCase() === trimmed)
      ? trimmed
      : null;

  const options = useMemo(
    () => [
      ...matches.map((room) => ({ kind: "room" as const, room })),
      ...(directCode ? [{ kind: "direct" as const, code: directCode }] : []),
    ],
    [matches, directCode],
  );

  useEffect(() => {
    setCursor(0);
  }, [trimmed]);

  // 点外面收起下拉
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    setOpen(false);
    onEnter(option.kind === "room" ? option.room.code : option.code);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (options.length === 0) {
      // 没有候选项时回车也让它走一遭：完整房间码会在 directCode 里，其余情况什么都不做
      if (event.key === "Enter" && FULL_CODE.test(trimmed)) {
        event.preventDefault();
        onEnter(trimmed);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => (value + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => (value - 1 + options.length) % options.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(cursor);
    }
  }

  const showList = open && trimmed !== "";

  return (
    <div className="mx-finder">
      <div className="mx-finder__box" ref={wrapRef}>
        <label className="mx-finder__field">
          <Icon name="rooms" size={17} />
          <input
            type="text"
            className="mx-finder__input"
            placeholder="输入房间码进入，或搜索我的房间"
            aria-label="输入房间码或搜索房间"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
          {query !== "" && (
            <button
              type="button"
              className="mx-finder__clear"
              aria-label="清空"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
            >
              <Icon name="x" size={15} />
            </button>
          )}
        </label>

        {showList && (
          <div className="mx-finder__menu" role="listbox">
            {options.length === 0 ? (
              <div className="mx-finder__hint">
                没有匹配的房间。房间码是 10 位小写字母和数字，检查一下有没有敲错。
              </div>
            ) : (
              options.map((option, index) =>
                option.kind === "room" ? (
                  <button
                    key={option.room.code}
                    type="button"
                    role="option"
                    aria-selected={index === cursor}
                    className="mx-finder__item"
                    data-cursor={index === cursor}
                    onPointerEnter={() => setCursor(index)}
                    onClick={() => choose(index)}
                  >
                    <span className="mx-finder__item-icon">
                      <Icon name="rooms" size={16} />
                    </span>
                    <span className="mx-finder__item-main">
                      <span className="mx-finder__item-name">{option.room.name}</span>
                      <span className="mx-finder__item-meta">
                        <code>{option.room.code}</code> · 节点 {option.room.nodeName}
                      </span>
                    </span>
                    <span className="mx-finder__item-side">
                      {option.room.isActive ? (
                        <Badge tone="success" dot>
                          {option.room.onlineCount}/{option.room.memberCount} 人
                        </Badge>
                      ) : (
                        <Badge tone="neutral">已关闭</Badge>
                      )}
                      <Icon name="chevronRight" size={15} />
                    </span>
                  </button>
                ) : (
                  <button
                    key="direct"
                    type="button"
                    role="option"
                    aria-selected={index === cursor}
                    className="mx-finder__item"
                    data-cursor={index === cursor}
                    onPointerEnter={() => setCursor(index)}
                    onClick={() => choose(index)}
                  >
                    <span className="mx-finder__item-icon" data-tone="accent">
                      <Icon name="link" size={16} />
                    </span>
                    <span className="mx-finder__item-main">
                      <span className="mx-finder__item-name">
                        直接进入 <code>{option.code}</code>
                      </span>
                      <span className="mx-finder__item-meta">
                        这不是你已加入的房间 —— 只有被邀请过才进得去。
                      </span>
                    </span>
                    <span className="mx-finder__item-side">
                      <Icon name="chevronRight" size={15} />
                    </span>
                  </button>
                ),
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   房间卡片
   ============================================================ */

function RoomCard({ room, onEnter }: { room: RoomRow; onEnter: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyCode(event: React.MouseEvent) {
    // 卡片整体是「进入房间」的按钮，复制按钮不能连带触发它
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      toast.success("房间码已复制");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("浏览器不允许写剪贴板，手动选中复制吧。");
    }
  }

  return (
    <button type="button" className="mx-roomcard" data-active={room.isActive} onClick={onEnter}>
      <span className="mx-roomcard__top">
        <span className="mx-roomcard__icon">
          <Icon name="rooms" size={20} />
        </span>
        <span className="mx-roomcard__badges">
          {room.isActive ? (
            <Badge tone="success" dot>
              活跃
            </Badge>
          ) : (
            <Badge tone="neutral">已关闭</Badge>
          )}
          <Badge tone={roleTone(room.role)}>{roleLabel(room.role)}</Badge>
        </span>
      </span>

      <span className="mx-roomcard__name">{room.name}</span>

      <span className="mx-roomcard__code">
        <code>{room.code}</code>
        <span
          className="mx-roomcard__copy"
          role="button"
          tabIndex={-1}
          aria-label="复制房间码"
          title="复制房间码"
          onClick={(event) => void copyCode(event)}
        >
          <Icon name={copied ? "check" : "copy"} size={14} />
        </span>
      </span>

      <span className="mx-roomcard__foot">
        <span className="mx-roomcard__people" data-live={room.onlineCount > 0}>
          <Icon name="users" size={14} />
          {room.onlineCount}/{room.memberCount} 人在线
        </span>
        <span className="mx-roomcard__node">
          节点 {room.nodeName}
          {room.nodeKind === "builtin" ? "（内置）" : ""}
        </span>
      </span>

      <span className="mx-roomcard__enter">
        进入
        <Icon name="chevronRight" size={14} />
      </span>
    </button>
  );
}

/* ============================================================
   创建房间
   ============================================================ */

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
      toast.error(humanizeError(error));
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
      </form>
    </Modal>
  );
}
