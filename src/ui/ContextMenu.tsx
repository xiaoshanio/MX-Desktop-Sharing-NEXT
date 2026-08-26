"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ContextMenuOrigin = { x: number; y: number };

export interface ContextMenuProps {
  /** null = 关闭。非 null 时是触发点的视口坐标。 */
  origin: ContextMenuOrigin | null;
  onClose: () => void;
  /** 菜单标题，通常是被操作对象的名字。 */
  title?: ReactNode;
  children: ReactNode;
}

/**
 * 右键菜单。渲染到 body 上的 portal，位置会自动避开视口边缘。
 *
 * 为什么不复用 .mx-menu（用户菜单那个）：那个是相对触发按钮定位的，
 * 而右键菜单要落在鼠标点上，且成员卡片可能贴着侧栏底部 —— 不做翻转的话
 * 菜单会有一半在屏幕外。
 */
export function ContextMenu({ origin, onClose, title, children }: ContextMenuProps): ReactNode {
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ left: number; top: number } | null>(null);

  /**
   * 量完尺寸再定位，必须用 useLayoutEffect：放在 useEffect 里会先按 (0,0)
   * 画一帧再跳到正确位置，肉眼能看到菜单从左上角闪一下。
   */
  useLayoutEffect(() => {
    if (!origin) {
      setPlacement(null);
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;

    const { offsetWidth: width, offsetHeight: height } = panel;
    const margin = 8;
    // 默认朝右下展开；贴边时翻到另一侧，而不是简单地夹住（夹住会盖住光标）
    const left =
      origin.x + width + margin > window.innerWidth
        ? Math.max(margin, origin.x - width)
        : origin.x;
    const top =
      origin.y + height + margin > window.innerHeight
        ? Math.max(margin, origin.y - height)
        : origin.y;

    setPlacement({ left, top });
  }, [origin]);

  useEffect(() => {
    if (!origin) return;

    function onPointerDown(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    // 滚动时关掉：菜单是绝对定位在视口上的，跟不住底下那张卡片
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [origin, onClose]);

  if (!origin || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className="mx-context"
      role="menu"
      style={{
        left: placement?.left ?? origin.x,
        top: placement?.top ?? origin.y,
        // 位置算出来之前不显示，避免闪一下
        visibility: placement ? "visible" : "hidden",
      }}
    >
      {title ? <div className="mx-context__head">{title}</div> : null}
      {children}
    </div>,
    document.body,
  );
}

export interface ContextMenuItemProps {
  icon?: ReactNode;
  tone?: "neutral" | "danger";
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
}

export function ContextMenuItem({
  icon,
  tone = "neutral",
  disabled = false,
  onSelect,
  children,
}: ContextMenuItemProps): ReactNode {
  return (
    <button
      type="button"
      role="menuitem"
      className="mx-context__item"
      data-tone={tone === "danger" ? "danger" : undefined}
      disabled={disabled}
      onClick={onSelect}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function ContextMenuLabel({ children }: { children: ReactNode }): ReactNode {
  return <div className="mx-context__label">{children}</div>;
}

export function ContextMenuSeparator(): ReactNode {
  return <div className="mx-context__sep" role="separator" />;
}
