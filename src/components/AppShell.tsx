"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { api } from "@/lib/api-client";
import {
  applySidebar,
  applyTheme,
  isImmersivePath,
  readStoredSidebar,
  readStoredTheme,
  type SidebarState,
  type Theme,
} from "@/lib/theme";
import type { ShellUser } from "@/lib/shell-user";
import { BrandMark } from "@/components/BrandMark";
import { Avatar } from "@/components/Avatar";
import { Icon, IconButton, type IconName } from "@/ui";

export type { ShellUser };

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Extra path prefixes that should keep this item highlighted. */
  alsoMatch?: string[];
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "房间", icon: "rooms", alsoMatch: ["/room"] },
  { href: "/nodes", label: "LiveKit 节点", icon: "node" },
  { href: "/me", label: "个人中心", icon: "user" },
  { href: "/admin", label: "管理后台", icon: "shield", adminOnly: true },
];

export interface AppShellProps {
  user: ShellUser;
  /** Secondary line in the top bar — usually the current page or room name. */
  heading?: ReactNode;
  /**
   * Turns the heading into a back button. The reversed chevron sits left of the label and the
   * whole thing navigates here — that's how you leave a room now (there's no separate button).
   */
  backHref?: string;
  backLabel?: string;
  /** Buttons that sit right of the heading — the room's share / members / settings controls. */
  actions?: ReactNode;
  /** Status-bar items, rendered left of the spacer. */
  status?: ReactNode;
  /** Lets a page (the room view) use the full width instead of the 1180px measure. */
  wide?: boolean;
  /** Drops the main scroller's padding — the room workspace manages its own gutters. */
  flush?: boolean;
  children: ReactNode;
}

/**
 * Application chrome: top bar, collapsible sidebar, scrolling main area, status bar.
 * Below 1024px the sidebar turns into an overlay drawer toggled from the top bar.
 *
 * 侧栏状态存在 <html data-sidebar> 上，首帧之前由 lib/theme.ts 的引导脚本盖好。
 * 这里的 React state 只是「让折叠按钮的图标跟上」，不是真相来源 —— 反过来会把
 * 「刷新后先展开再收起」那个闪烁又请回来。
 */
export function AppShell({
  user,
  heading,
  backHref,
  backLabel,
  actions,
  status,
  wide = false,
  flush = false,
  children,
}: AppShellProps): ReactNode {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [online, setOnline] = useState(true);

  const immersive = isImmersivePath(pathname);

  // Hydrate persisted chrome state after mount — both attributes are already on <html>
  // from the bootstrap script, so this only syncs the toggles' icons.
  useEffect(() => {
    setTheme(readStoredTheme());
    setCollapsed(document.documentElement.getAttribute("data-sidebar") === "collapsed");
  }, []);

  /**
   * 客户端路由切换时套用「进房收起、出房恢复」。
   *
   * 引导脚本只在整页加载时跑，从列表页点进房间是软导航，所以这一条 effect 是必需的。
   * 它在首帧之后执行，于是这里**会**有一次过渡动画 —— 那正是想要的效果
   * （侧栏平滑收起）。刷新时不走这条路径，所以也不会有闪烁。
   */
  useEffect(() => {
    const next: SidebarState = immersive ? "collapsed" : readStoredSidebar();
    // 房间里的收起是临时的，不写 localStorage：退出房间要能回到用户自己的偏好
    applySidebar(next, false);
    setCollapsed(next === "collapsed");
  }, [immersive, pathname]);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  // Route change closes the drawer, otherwise it would cover the page you just opened.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setCollapsed((previous) => {
      const next: SidebarState = previous ? "expanded" : "collapsed";
      // 在房间里手动展开只对当次有效，不覆盖列表页的长期偏好
      applySidebar(next, !immersive);
      return next === "collapsed";
    });
  }, [immersive]);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => {
      const next: Theme = previous === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  const items = NAV.filter((item) => !item.adminOnly || user.role === "admin");

  return (
    <div className="mx-app" data-drawer={drawerOpen ? "open" : "closed"}>
      <header className="mx-topbar">
        <IconButton
          className="mx-topbar__menu"
          label={drawerOpen ? "关闭导航" : "打开导航"}
          onClick={() => setDrawerOpen((open) => !open)}
        >
          <Icon name={drawerOpen ? "x" : "menu"} size={18} />
        </IconButton>

        <Link href="/dashboard" className="mx-brand">
          <BrandMark size={32} className="mx-brand__mark" />
          <span className="mx-brand__text">
            <span className="mx-brand__name">MX 桌面共享</span>
            <span className="mx-brand__sub">LiveKit 多节点</span>
          </span>
        </Link>

        {heading ? (
          <div className="mx-topbar__heading">
            {backHref ? (
              <Link href={backHref} className="mx-topbar__back" title={backLabel ?? "返回"}>
                <Icon name="chevronLeft" size={15} />
                <span className="mx-topbar__back-label">{heading}</span>
              </Link>
            ) : (
              <>
                <Icon name="chevronRight" size={13} />
                {heading}
              </>
            )}
            {actions ? <div className="mx-topbar__tools">{actions}</div> : null}
          </div>
        ) : null}

        <div className="mx-topbar__actions">
          <IconButton
            label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
            onClick={toggleTheme}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </IconButton>
          <UserMenu user={user} />
        </div>
      </header>

      <div className="mx-body">
        <nav className="mx-sidebar" aria-label="主导航">
          <div className="mx-sidebar__group-label">工作区</div>
          {items.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.alsoMatch ?? []).some((prefix) => pathname.startsWith(prefix));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="mx-sidebar__item"
                data-active={active}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className="mx-sidebar__item-icon">
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="mx-sidebar__item-label">{item.label}</span>
              </Link>
            );
          })}
          <span className="mx-sidebar__spacer" />
          <div className="mx-sidebar__footer">
            <IconButton
              size="sm"
              label={collapsed ? "展开侧栏" : "收起侧栏"}
              onClick={toggleSidebar}
            >
              <Icon name={collapsed ? "panelLeft" : "panelLeftClose"} size={16} />
            </IconButton>
          </div>
        </nav>

        <div className="mx-scrim" role="presentation" onClick={() => setDrawerOpen(false)} />

        <main
          className="mx-main"
          data-wide={wide ? "true" : undefined}
          data-flush={flush ? "true" : undefined}
        >
          <div className="mx-main__inner">{children}</div>
        </main>
      </div>

      <footer className="mx-statusbar" role="status">
        {status}
        <span className="mx-statusbar__spacer" />
        <span className="mx-statusbar__item" data-tone={online ? "success" : "error"}>
          <span className="mx-statusbar__dot" />
          {online ? "已连接" : "网络离线"}
        </span>
      </footer>
    </div>
  );
}

/** Avatar chip with a small menu: identity, profile, admin shortcut, sign out. */
function UserMenu({ user }: { user: ShellUser }): ReactNode {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function logout() {
    setBusy(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-user" ref={wrapRef}>
      <button
        type="button"
        className="mx-user__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar
          userId={user.id}
          displayName={user.displayName}
          accent={user.cardAccent}
          avatarAt={user.avatarAt}
          size={26}
        />
        <span className="mx-user__label">
          <span className="mx-user__name">{user.displayName}</span>
          <span className="mx-user__role">{user.role === "admin" ? "管理员" : "用户"}</span>
        </span>
      </button>

      {open && (
        <div className="mx-menu" role="menu">
          <div className="mx-menu__head">
            <strong>{user.displayName}</strong>
            <span>{user.email}</span>
          </div>
          <Link href="/me" className="mx-menu__item" role="menuitem">
            <Icon name="user" size={15} />
            个人中心
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className="mx-menu__item" role="menuitem">
              <Icon name="shield" size={15} />
              管理后台
            </Link>
          )}
          <button
            type="button"
            className="mx-menu__item"
            data-tone="danger"
            role="menuitem"
            disabled={busy}
            onClick={() => void logout()}
          >
            <Icon name="logout" size={15} />
            {busy ? "退出中…" : "退出登录"}
          </button>
        </div>
      )}
    </div>
  );
}
