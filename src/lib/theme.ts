/**
 * 主题与外壳状态的持久化。
 *
 * 主题有**三档**：跟随系统 / 浅色 / 深色，默认跟随系统。
 * 存储里放的是「偏好」（preference），页面上生效的是「解析后的主题」（theme）——
 * 两者必须分开，否则「跟随系统」这一档没法表示：它本身不是一个颜色，而是「去问系统」。
 *
 * <html> 上因此有两个属性：
 *   data-theme      = light | dark  ← CSS 只看这一个
 *   data-theme-pref = system | light | dark  ← 只给切换按钮读，用来知道现在是哪一档
 */

export type Theme = "light" | "dark";
export type ThemePreference = "system" | Theme;

export const THEME_STORAGE_KEY = "mxds.theme";
export const SIDEBAR_STORAGE_KEY = "mxds.sidebar";

/**
 * 默认跟随系统。
 *
 * 以前写死深色（「这是个媒体应用，深色更好看」），但那会跟操作系统的深浅色设置打架 ——
 * 白天把系统调成浅色的人打开本站还是一片黑。跟随系统之后仍然可以手动锁定某一档。
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

/** 三档循环的顺序：跟随系统 → 浅色 → 深色 → 跟随系统。 */
export const THEME_CYCLE: readonly ThemePreference[] = ["system", "light", "dark"];

export function nextThemePreference(current: ThemePreference): ThemePreference {
  const index = THEME_CYCLE.indexOf(current);
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length] ?? "system";
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** 动效总开关的判据。引导脚本和 lib/motion.ts 读的是同一条查询。 */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";


/** 系统当前是深色还是浅色。读不到（老浏览器 / 服务端）时按浅色算。 */
export function systemTheme(): Theme {
  try {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function resolveTheme(preference: ThemePreference): Theme {
  return preference === "system" ? systemTheme() : preference;
}

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
 * 首帧之前把 `data-theme` / `data-theme-pref` / `data-sidebar` / `data-motion`
 * 一起盖到 <html> 上。
 *
 * 侧栏状态为什么必须在这里定：原来它是在 AppShell 挂载后的 useEffect 里读的，
 * 于是每次刷新都先按「展开」画一帧，再动画收起 —— 也就是「刷新页面会再次收起」
 * 那个 bug。属性提前盖好之后，React 首次渲染拿到的就已经是终态，没有任何过渡。
 *
 * `data-motion="js"` 是给 GSAP 动效层用的开关：盖上它，base.css 就会把「等着被动画
 * 带进来」的元素先藏起来，免得服务端渲染的内容先闪一下完成态。三条约束：
 *   - 用户要求减少动效时不盖 —— 那样一条预隐藏规则都不生效，页面是静态的；
 *   - MotionProvider 挂载后会盖上 data-motion-ready，表示 GSAP 真的接上了；
 *   - 兜底定时器：2.5 秒还没等到 ready（分包挂了、脚本被拦），自己把 data-motion
 *     摘掉，让内容无条件可见。动效可以没有，内容不能看不见。
 *
 * 放在 <html> 而不是 AppShell 的根 div 上是为了避开 hydration 不匹配：
 * <html> 已经带了 suppressHydrationWarning，而服务端渲染时读不到 localStorage。
 *
 * 保持零依赖、ES5 语法 —— 它是内联进 <head> 的裸脚本。
 */
export const themeBootstrapScript = `(function(){
var d=document.documentElement;
function sys(){try{return window.matchMedia("${DARK_QUERY}").matches?"dark":"light"}catch(e){return "light"}}
try{
var v=localStorage.getItem("${THEME_STORAGE_KEY}");
var p=(v==="light"||v==="dark"||v==="system")?v:"${DEFAULT_THEME_PREFERENCE}";
d.setAttribute("data-theme-pref",p);
d.setAttribute("data-theme",p==="system"?sys():p);
}catch(e){d.setAttribute("data-theme-pref","system");d.setAttribute("data-theme",sys());}
try{
var immersive=location.pathname.indexOf("/room/")===0;
var s=immersive?"collapsed":(localStorage.getItem("${SIDEBAR_STORAGE_KEY}")==="collapsed"?"collapsed":"expanded");
d.setAttribute("data-sidebar",s);
}catch(e){d.setAttribute("data-sidebar","expanded");}
try{
if(!window.matchMedia("${REDUCED_MOTION_QUERY}").matches){
d.setAttribute("data-motion","js");
setTimeout(function(){if(!d.hasAttribute("data-motion-ready"))d.removeAttribute("data-motion")},2500);
}
}catch(e){}
})();`;

export function readStoredThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* 隐私模式 */
  }
  return DEFAULT_THEME_PREFERENCE;
}

let crossfadeTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * 把偏好写进 <html> 并持久化。切换时开一小段颜色过渡，免得硬跳；
 * 过渡类随后移除 —— 留着的话每次 hover 都会跟着动画。
 */
export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  const theme = resolveTheme(preference);
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
  root.setAttribute("data-theme-pref", preference);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* private mode — the theme still applies for this page view */
  }
}

/**
 * 「跟随系统」这一档下，系统深浅色变了要当场跟上。
 *
 * 返回取消订阅函数。只在 preference === "system" 时需要挂 —— 锁定了某一档的人
 * 不该因为系统换了主题而被改掉。
 */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  let media: MediaQueryList;
  try {
    media = window.matchMedia(DARK_QUERY);
  } catch {
    return () => {};
  }

  const handler = (event: MediaQueryListEvent) => onChange(event.matches ? "dark" : "light");
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
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
