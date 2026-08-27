"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { api } from "@/lib/api-client";
import { useT } from "@/i18n";
import { APP_NAME, POWERED_BY } from "@/lib/brand";
import {
  animateDrawer,
  animateSidebar,
  introSidebar,
  moveIndicator,
} from "@/lib/shell-motion";
import {
  applySidebar,
  isImmersivePath,
  readStoredSidebar,
  type SidebarState,
} from "@/lib/theme";
import type { ShellUser } from "@/lib/shell-user";
import { BrandMark } from "@/components/BrandMark";
import { Avatar } from "@/components/Avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon, IconButton, PageLoader, type IconName } from "@/ui";
import type { MessageKey } from "@/i18n";

export type { ShellUser };

interface NavItem {
  href: string;
  labelKey: MessageKey;
  icon: IconName;
  /** Extra path prefixes that should keep this item highlighted. */
  alsoMatch?: string[];
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "shell.nav.rooms", icon: "rooms", alsoMatch: ["/room"] },
  { href: "/nodes", labelKey: "shell.nav.nodes", icon: "node" },
  { href: "/me", labelKey: "shell.nav.me", icon: "user" },
  { href: "/admin", labelKey: "shell.nav.admin", icon: "shield", adminOnly: true },
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
  /**
   * Replaces `children` with a centred spinner until the page's first load resolves.
   *
   * Deliberately swaps the whole content area rather than rendering empty shells: the chrome
   * (top bar + sidebar) stays usable and navigable while the data is in flight, but nothing
   * half-populated is ever shown.
   */
  loading?: boolean;
  /** Text under the spinner while `loading`. */
  loadingLabel?: string;
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
  loading = false,
  loadingLabel,
  children,
}: AppShellProps): ReactNode {
  const t = useT();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [online, setOnline] = useState(true);

  /** 动效要摸的四个节点。宽度动画写在 .mx-app 上，因为 CSS 变量声明在那里。 */
  const appRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  const immersive = isImmersivePath(pathname);

  // Hydrate persisted chrome state after mount — the attribute is already on <html>
  // from the bootstrap script, so this only syncs the toggle's icon.
  useEffect(() => {
    setCollapsed(document.documentElement.getAttribute("data-sidebar") === "collapsed");
  }, []);

  // 侧栏自己的进场，只跑一次
  useEffect(() => {
    introSidebar(sidebarRef.current);
  }, []);

  /**
   * 选中指示条跟着当前页走。
   *
   * 除了路由变化，还有两件事会让它错位，都得重新对齐（而且是直接对齐，不补间 ——
   * 那时候侧栏本身正在变形，再滑一次只会显得拖沓）：
   *   - 收起 / 展开：「工作区」那行标题会被收掉，下面的条目整体上移；
   *   - 改窗口大小：宽屏 ↔ 抽屉两套布局的条目位置不一样。
   */
  useEffect(() => {
    const nav = sidebarRef.current;
    const bar = indicatorRef.current;
    if (!nav || !bar) return;

    moveIndicator(nav, bar);

    const align = () => moveIndicator(nav, bar, true);
    const sidebarAttr = new MutationObserver(align);
    sidebarAttr.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-sidebar"],
    });
    window.addEventListener("resize", align);
    return () => {
      sidebarAttr.disconnect();
      window.removeEventListener("resize", align);
    };
  }, [pathname, user.role]);

  // 窄屏抽屉的推入 / 收回
  useEffect(() => {
    animateDrawer(sidebarRef.current, scrimRef.current, drawerOpen);
  }, [drawerOpen]);

  /**
   * 客户端路由切换时套用「进房收起、出房恢复」。
   *
   * 引导脚本只在整页加载时跑，从列表页点进房间是软导航，所以这一条 effect 是必需的。
   * 只有目标状态和当前不一样时才走动画那条路 —— 刷新时两者一致，于是没有任何过渡
   * （那正是「刷新后不该再收起一次」的要求），而软导航进出房间时侧栏会平滑收起 / 展开。
   */
  useEffect(() => {
    const next: SidebarState = immersive ? "collapsed" : readStoredSidebar();
    setCollapsed(next === "collapsed");
    if (document.documentElement.getAttribute("data-sidebar") === next) return;
    // 房间里的收起是临时的，不写 localStorage：退出房间要能回到用户自己的偏好
    animateSidebar(appRef.current, next === "collapsed", () => applySidebar(next, false));
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
    // 刻意不在 setState 的更新函数里做这件事：那个函数在开发模式下会被调用两遍，
    // 动画因此会起两次（旧代码在里面改 <html> 属性也是同样的问题，只是看不出来）。
    const next: SidebarState = collapsed ? "expanded" : "collapsed";
    setCollapsed(next === "collapsed");
    // 在房间里手动展开只对当次有效，不覆盖列表页的长期偏好
    animateSidebar(appRef.current, next === "collapsed", () => applySidebar(next, !immersive));
  }, [collapsed, immersive]);

  const items = NAV.filter((item) => !item.adminOnly || user.role === "admin");

  return (
    <div className="mx-app" ref={appRef} data-drawer={drawerOpen ? "open" : "closed"}>
      <header className="mx-topbar">
        <IconButton
          className="mx-topbar__menu"
          label={drawerOpen ? t("shell.closeNav") : t("shell.openNav")}
          onClick={() => setDrawerOpen((open) => !open)}
        >
          <Icon name={drawerOpen ? "x" : "menu"} size={18} />
        </IconButton>

        <Link href="/dashboard" className="mx-brand">
          <BrandMark size={32} className="mx-brand__mark" />
          <span className="mx-brand__text">
            <span className="mx-brand__name">{APP_NAME}</span>
            <span className="mx-brand__sub">{t("brand.subtitle")}</span>
          </span>
        </Link>

        {heading ? (
          <div className="mx-topbar__heading">
            {backHref ? (
              <Link
                href={backHref}
                className="mx-topbar__back"
                title={backLabel ?? t("shell.back")}
              >
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
          {/* 语言下拉在主题开关左边 —— 两个都是「整站偏好」，放一起才好找 */}
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </header>

      <div className="mx-body">
        <nav className="mx-sidebar" ref={sidebarRef} aria-label={t("shell.mainNav")}>
          {/* 整栏共用一根选中指示条，由 GSAP 在条目之间滑动（lib/shell-motion.ts）。
              没有 JS 时它不会出现，选中项仍然靠底色和图标颜色区分。 */}
          <span className="mx-sidebar__indicator" ref={indicatorRef} aria-hidden="true" />
          <div className="mx-sidebar__group-label">{t("shell.workspace")}</div>
          {items.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.alsoMatch ?? []).some((prefix) => pathname.startsWith(prefix));
            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="mx-sidebar__item"
                data-active={active}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
              >
                <span className="mx-sidebar__item-icon">
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="mx-sidebar__item-label">{label}</span>
              </Link>
            );
          })}
          <span className="mx-sidebar__spacer" />
          <div className="mx-sidebar__footer">
            <IconButton
              size="sm"
              label={collapsed ? t("shell.expandSidebar") : t("shell.collapseSidebar")}
              onClick={toggleSidebar}
            >
              <Icon name={collapsed ? "panelLeft" : "panelLeftClose"} size={16} />
            </IconButton>
          </div>
        </nav>

        <div
          className="mx-scrim"
          ref={scrimRef}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        />


        <main
          className="mx-main"
          data-wide={wide ? "true" : undefined}
          data-flush={flush ? "true" : undefined}
          data-loading={loading ? "true" : undefined}
        >
          <div className="mx-main__inner">
            {loading ? <PageLoader>{loadingLabel}</PageLoader> : children}
          </div>
        </main>
      </div>

      <footer className="mx-statusbar" role="status">
        {status}
        <span className="mx-statusbar__spacer" />
        {/* Sits left of the connection light. First thing dropped on a narrow viewport —
            the status bar clips its overflow, and knowing you're online matters more. */}
        <span className="mx-statusbar__item mx-statusbar__powered">{POWERED_BY}</span>
        <span className="mx-statusbar__divider mx-statusbar__powered" />
        <span className="mx-statusbar__item" data-tone={online ? "success" : "error"}>
          <span className="mx-statusbar__dot" />
          {online ? t("shell.online") : t("shell.offline")}
        </span>
      </footer>
    </div>
  );
}

/** Avatar chip with a small menu: identity, profile, admin shortcut, sign out. */
function UserMenu({ user }: { user: ShellUser }): ReactNode {
  const t = useT();
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
          <span className="mx-user__role">
            {user.role === "admin" ? t("shell.role.admin") : t("shell.role.user")}
          </span>
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
            {t("shell.menu.profile")}
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className="mx-menu__item" role="menuitem">
              <Icon name="shield" size={15} />
              {t("shell.menu.admin")}
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
            {busy ? t("shell.menu.loggingOut") : t("shell.menu.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
