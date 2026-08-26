"use client";

import { useMemo, useState } from "react";
import { useParticipants, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

import { decodeParticipantMeta, initialOf, userImageUrl } from "@/lib/identity";
import { roleLabel } from "@/lib/labels";
import type { Member } from "@/lib/api-types";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  Icon,
  type ContextMenuOrigin,
} from "@/ui";

/** 一个在线参与者，已经把 LiveKit 侧和数据库侧的信息合到一起。 */
export type RailEntry = {
  /** LiveKit 的 participant identity。OBS 推流的是 `obs:<userId>` */
  identity: string;
  /** 对应的本站用户 id（OBS 那条也指回同一个人） */
  userId: string;
  displayName: string;
  isLocal: boolean;
  isObs: boolean;
  hasVideo: boolean;
  accent: string;
  avatarAt: string | null;
  bannerAt: string | null;
  /** 数据库里的房间角色，成员列表加载好之后才有 */
  role: string | null;
};

export interface ParticipantRailProps {
  /** 当前选中的 identity，null = 平铺全部 */
  selected: string | null;
  onSelect: (identity: string | null) => void;
  /** 成员表（拿角色和邮箱用）。在线状态**不**取它，取 LiveKit 的实时参与者列表。 */
  members: Member[];
  /** 我是不是房主/管理员 —— 决定右键菜单里有没有管理项 */
  canManage: boolean;
  ownerId: string | null;
  onChangeRole: (entry: RailEntry, role: "publisher" | "viewer") => void;
  onKick: (entry: RailEntry, ban: boolean) => void;
}

/**
 * 画面左侧的成员栏。**只显示在线的人**。
 *
 * 在线与否用 LiveKit 客户端 SDK 的参与者列表判断，而不是查 room_presence 表：
 * 前者是实时推送的（人一进一出立刻变），后者依赖 webhook 落库再被前端轮询到 ——
 * README 里那条「不要轮询这张表」的约定就是为这个。
 */
export function ParticipantRail({
  selected,
  onSelect,
  members,
  canManage,
  ownerId,
  onChangeRole,
  onKick,
}: ParticipantRailProps) {
  const participants = useParticipants();
  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.Unknown, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );

  const [menu, setMenu] = useState<{ origin: ContextMenuOrigin; entry: RailEntry } | null>(null);

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.userId, member])),
    [members],
  );

  /** 有画面的 identity 集合 —— 卡片上那个「有画面」标记用它。 */
  const publishing = useMemo(() => {
    const set = new Set<string>();
    for (const ref of tracks) {
      if ("participant" in ref) set.add(ref.participant.identity);
    }
    return set;
  }, [tracks]);

  const entries = useMemo<RailEntry[]>(() => {
    return participants
      .map((participant) => {
        const identity = participant.identity;
        const isObs = identity.startsWith("obs:");
        const userId = isObs ? identity.slice("obs:".length) : identity;
        const meta = decodeParticipantMeta(participant.metadata, userId);
        const member = memberById.get(userId);

        return {
          identity,
          userId,
          displayName: participant.name || member?.displayName || identity,
          isLocal: participant.isLocal,
          isObs,
          hasVideo: publishing.has(identity),
          accent: meta.accent,
          avatarAt: meta.avatarAt,
          bannerAt: meta.bannerAt,
          role: member?.role ?? null,
        };
      })
      .sort((a, b) => {
        // 有画面的排前面（那是你现在最可能想点的），然后自己，最后按名字
        if (a.hasVideo !== b.hasVideo) return a.hasVideo ? -1 : 1;
        if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
        return a.displayName.localeCompare(b.displayName, "zh-CN");
      });
  }, [participants, memberById, publishing]);

  return (
    <aside className="mx-rail" aria-label="在线成员">
      <header className="mx-rail__head">
        <Icon name="users" size={14} />
        <span>在线 {entries.length}</span>
        {selected && (
          <button type="button" className="mx-rail__clear" onClick={() => onSelect(null)}>
            显示全部
          </button>
        )}
      </header>

      <div className="mx-rail__list">
        {entries.length === 0 ? (
          <p className="mx-rail__empty">房间里还没有人。</p>
        ) : (
          entries.map((entry) => (
            <RailCard
              key={entry.identity}
              entry={entry}
              active={selected === entry.identity}
              onSelect={() => onSelect(selected === entry.identity ? null : entry.identity)}
              onContextMenu={(origin) => {
                // 不是管理员就不弹菜单，让浏览器自己的右键菜单出来
                if (!canManage) return false;
                setMenu({ origin, entry });
                return true;
              }}
            />
          ))
        )}
      </div>

      <ContextMenu
        origin={menu?.origin ?? null}
        onClose={() => setMenu(null)}
        title={menu?.entry.displayName}
      >
        {menu && <RailMenu entry={menu.entry} ownerId={ownerId} onChangeRole={onChangeRole} onKick={onKick} onDone={() => setMenu(null)} />}
      </ContextMenu>
    </aside>
  );
}

function RailMenu({
  entry,
  ownerId,
  onChangeRole,
  onKick,
  onDone,
}: {
  entry: RailEntry;
  ownerId: string | null;
  onChangeRole: (entry: RailEntry, role: "publisher" | "viewer") => void;
  onKick: (entry: RailEntry, ban: boolean) => void;
  onDone: () => void;
}) {
  const isOwner = entry.userId === ownerId;
  const wrap = (run: () => void) => () => {
    run();
    onDone();
  };

  // 房主不能被自己的房间踢掉，也不该被改权限 —— 那会把房间锁死
  if (isOwner) {
    return <ContextMenuLabel>房主，不能修改或移出</ContextMenuLabel>;
  }

  // OBS 那条推流不是「一个人」，只能掐掉它对应的用户，改权限没有意义
  return (
    <>
      <ContextMenuLabel>权限</ContextMenuLabel>
      <ContextMenuItem
        icon={<Icon name="broadcast" size={14} />}
        disabled={entry.role === "publisher"}
        onSelect={wrap(() => onChangeRole(entry, "publisher"))}
      >
        可推流{entry.role === "publisher" ? "（当前）" : ""}
      </ContextMenuItem>
      <ContextMenuItem
        icon={<Icon name="eye" size={14} />}
        disabled={entry.role === "viewer"}
        onSelect={wrap(() => onChangeRole(entry, "viewer"))}
      >
        仅观看{entry.role === "viewer" ? "（当前）" : ""}
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        tone="danger"
        icon={<Icon name="x" size={14} />}
        onSelect={wrap(() => onKick(entry, false))}
      >
        移出房间
      </ContextMenuItem>
      <ContextMenuItem
        tone="danger"
        icon={<Icon name="ban" size={14} />}
        onSelect={wrap(() => onKick(entry, true))}
      >
        移出并加入黑名单
      </ContextMenuItem>
    </>
  );
}

function RailCard({
  entry,
  active,
  onSelect,
  onContextMenu,
}: {
  entry: RailEntry;
  active: boolean;
  onSelect: () => void;
  /** 返回 true 表示自己处理了，会阻止浏览器默认菜单 */
  onContextMenu: (origin: ContextMenuOrigin) => boolean;
}) {
  const banner = userImageUrl(entry.userId, "banner", entry.bannerAt);
  const avatar = userImageUrl(entry.userId, "avatar", entry.avatarAt);

  return (
    <button
      type="button"
      className="mx-pcard"
      data-active={active}
      data-accent={entry.accent}
      aria-pressed={active}
      onClick={onSelect}
      onContextMenu={(event) => {
        if (onContextMenu({ x: event.clientX, y: event.clientY })) event.preventDefault();
      }}
      title={`${entry.displayName}${entry.hasVideo ? " · 有画面" : ""}`}
    >
      {/* 背景：上传过就用那张图，否则用按 id 分配的底色渐变 */}
      <span
        className="mx-pcard__bg"
        style={banner ? { backgroundImage: `url(${banner})` } : undefined}
        data-custom={banner ? "true" : undefined}
      />

      <span className="mx-pcard__body">
        <span className="mx-pcard__avatar">
          {avatar ? (
            <img src={avatar} alt="" width={34} height={34} />
          ) : (
            <span aria-hidden="true">{initialOf(entry.displayName)}</span>
          )}
        </span>

        <span className="mx-pcard__text">
          <span className="mx-pcard__name">{entry.displayName}</span>
          <span className="mx-pcard__meta">
            {entry.isObs
              ? "OBS 推流"
              : entry.isLocal
                ? "你"
                : entry.role
                  ? roleLabel(entry.role)
                  : "在线"}
          </span>
        </span>
      </span>

      {entry.hasVideo && (
        <span className="mx-pcard__live" title="正在共享画面">
          <span className="mx-pcard__live-dot" />
        </span>
      )}
    </button>
  );
}
