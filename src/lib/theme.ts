export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "mxds.theme";
export const SIDEBAR_STORAGE_KEY = "mxds.sidebar";

/** Default when nothing is stored — this is a media app, dark reads better. */
export const DEFAULT_THEME: Theme = "dark";

/**
 * 进了房间就自动收起侧栏（画面要宽），离开房间恢复成用户自己的偏好。
 *
 * 判定规则同时被三处使用，所以抽成一份：
 *   1. <head> 里的引导脚本（首帧之前）
 *   2. AppShell 的客户端路由切换 effect
 *   3. 「手动切换要不要写进 localStorage」的判断
 * 三处对不齐的话就会出现「刷新后和点进来时不一样」这类幽灵行为。
 */
export function isImmersivePath(pathname: string): boolean {
  return pathname.startsWith("/room/");
}

export type SidebarState = "collapsed" | "expanded";

export function readStoredSidebar(): SidebarState {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "collapsed" ? "collapsed" : "expanded";
  } catch {
    return "expanded";
  }
}

/**
 * 首帧之前把 `data-theme` 和 `data-sidebar` 一起盖到 <html> 上。
 *
 * 侧栏状态为什么必须在这里定：原来它是在 AppShell 挂载后的 useEffect 里读的，
 * 于是每次刷新都先按「展开」画一帧，再动画收起 —— 也就是「刷新页面会再次收起」
 * 那个 bug。属性提前盖好之后，React 首次渲染拿到的就已经是终态，没有任何过渡。
 *
 * 放在 <html> 而不是 AppShell 的根 div 上是为了避开 hydration 不匹配：
 * <html> 已经带了 suppressHydrationWarning，而服务端渲染时读不到 localStorage。
 *
 * 保持零依赖、ES5 语法 —— 它是内联进 <head> 的裸脚本。
 */
export const themeBootstrapScript = `(function(){
try{
var v=localStorage.getItem("${THEME_STORAGE_KEY}");
var t=(v==="light"||v==="dark")?v:"${DEFAULT_THEME}";
document.documentElement.setAttribute("data-theme",t);
}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}");}
try{
var immersive=location.pathname.indexOf("/room/")===0;
var s=immersive?"collapsed":(localStorage.getItem("${SIDEBAR_STORAGE_KEY}")==="collapsed"?"collapsed":"expanded");
document.documentElement.setAttribute("data-sidebar",s);
}catch(e){document.documentElement.setAttribute("data-sidebar","expanded");}
})();`;

export function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

let crossfadeTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Applies a theme to <html> and persists it. Enables a brief color crossfade so the switch
 * doesn't snap, then removes it — otherwise every hover would animate too.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const previous = root.getAttribute("data-theme");
  if (previous && previous !== theme) {
    root.classList.add("mx-theme-switching");
    if (crossfadeTimer !== undefined) clearTimeout(crossfadeTimer);
    crossfadeTimer = setTimeout(() => {
      root.classList.remove("mx-theme-switching");
      crossfadeTimer = undefined;
    }, 260);
  }
  root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode — the theme still applies for this page view */
  }
}

/**
 * 把侧栏状态盖到 <html> 上。
 *
 * `persist` 决定要不要写进 localStorage：在房间里手动展开侧栏属于「就这一次」，
 * 不该改掉用户在列表页的长期偏好 —— 否则退出房间后侧栏会保持展开／收起的错位状态。
 */
export function applySidebar(state: SidebarState, persist: boolean): void {
  document.documentElement.setAttribute("data-sidebar", state);
  if (!persist) return;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, state);
  } catch {
    /* private mode — 本次会话内仍然生效 */
  }
}
