"use client";

import { DUR, EASE, gsap, reducedMotion, startMotion } from "@/lib/motion";

/**
 * 左侧栏的动效。全部 GSAP —— 以前这些是 CSS transition，问题有两个：
 *
 *   1. 收起时标签是 `display: none` 掉的，过渡不了，所以文字总是「啪」一下消失，
 *      而侧栏宽度还在慢慢缩 —— 两段动作对不上。现在排成一条时间线：
 *      先把标签收走（100ms），再翻属性，然后才动宽度。
 *   2. 选中项那道竖线原来是每个条目自己的 ::before，切换页面时是「旧的淡出、
 *      新的淡入」。改成整栏共用一根，由 GSAP 在条目之间滑过去。
 *
 * 侧栏宽度的真相仍然在 CSS 变量 --mx-current-sidebar-width 上（由 <html data-sidebar>
 * 决定），这里只是在两个值之间补上中间帧：动画结束就把行内值摘掉，交还给样式表。
 */

/** 抽屉态（窄屏）下侧栏根本不在网格里，宽度恒为 0 —— 那时不做宽度动画。 */
function currentWidth(app: HTMLElement): number {
  const raw = getComputedStyle(app).getPropertyValue("--mx-current-sidebar-width");
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

function labelsOf(app: HTMLElement): HTMLElement[] {
  return [
    ...app.querySelectorAll<HTMLElement>(".mx-sidebar__group-label, .mx-sidebar__item-label"),
  ];
}

/** 属性已经翻过了，把宽度从 `from` 补到样式表现在要求的值。 */
function tweenWidth(app: HTMLElement, from: number): void {
  const to = currentWidth(app);
  if (Math.abs(to - from) < 0.5) return;
  app.style.setProperty("--mx-current-sidebar-width", `${from}px`);
  gsap.to(app, {
    "--mx-current-sidebar-width": `${to}px`,
    duration: 0.34,
    ease: EASE.emphasized,
    onComplete: () => app.style.removeProperty("--mx-current-sidebar-width"),
  });
}

/**
 * 收起 / 展开。
 *
 * `flip` 负责真正改 <html data-sidebar>（以及要不要写进 localStorage）——
 * 什么时候翻由这里决定，收起是「标签先走」，展开是「先翻再一起进来」。
 */
export function animateSidebar(
  app: HTMLElement | null,
  collapsing: boolean,
  flip: () => void,
): void {
  if (!app || !startMotion() || reducedMotion()) {
    flip();
    return;
  }

  const from = currentWidth(app);
  // 宽度是 0 说明现在是抽屉态：侧栏浮在页面上，收不收起没有可动的东西
  if (from === 0) {
    flip();
    return;
  }

  const labels = labelsOf(app);
  gsap.killTweensOf([app, ...labels]);

  if (collapsing) {
    gsap.to(labels, {
      opacity: 0,
      x: -6,
      duration: 0.11,
      ease: EASE.accelerate,
      onComplete: () => {
        flip();
        // 翻完属性标签就是 display:none 了，趁它不可见把行内值清掉，下次展开才干净
        gsap.set(labels, { clearProps: "opacity,transform" });
        tweenWidth(app, from);
      },
    });
    return;
  }

  flip();
  tweenWidth(app, from);
  // fromTo 会立刻写下起始值，和上面翻属性在同一帧里，所以标签不会先闪一下再淡入
  gsap.fromTo(
    labels,
    { opacity: 0, x: -6 },
    { opacity: 1, x: 0, duration: 0.24, ease: EASE.decelerate, clearProps: "opacity,transform" },
  );
}

/**
 * 把选中指示条挪到当前页对应的那一项上。
 *
 * 第一次是直接落位（`gsap.set`）—— 刷新页面时它不该从最上面滑下来，那是「刚才在别的页」
 * 的错觉。之后每次路由变化才滑。找不到选中项（比如进了房间，侧栏里没有对应条目）就淡出。
 *
 * `snap` 是「别补间，立刻对齐」：侧栏收起 / 展开或窗口变形时条目会整体位移，
 * 那种场合滑过去只会显得拖沓。
 */
export function moveIndicator(
  nav: HTMLElement | null,
  bar: HTMLElement | null,
  snap = false,
): void {
  if (!nav || !bar || !startMotion()) return;

  const active = nav.querySelector<HTMLElement>('.mx-sidebar__item[data-active="true"]');
  if (!active) {
    gsap.to(bar, { opacity: 0, duration: DUR.fast });
    return;
  }

  // 上下各留 9px，和条目 38px 高时的视觉重心对齐（原来 ::before 的 top/bottom 就是 9px）
  const inset = 9;
  const vars = {
    y: active.offsetTop + inset,
    height: Math.max(4, active.offsetHeight - inset * 2),
    opacity: 1,
  };

  const settled = bar.dataset.placed !== undefined;
  bar.dataset.placed = "";
  if (snap || !settled || reducedMotion()) {
    gsap.set(bar, vars);
    return;
  }
  gsap.to(bar, { ...vars, duration: 0.34, ease: EASE.emphasized });
}

/**
 * 首次挂载时标记侧栏可见。
 *
 * 给 .mx-sidebar 打上 data-mx-shown，让 shell.css 里的预隐藏规则失效。
 * 以前这里有一段 stagger 进场动画（一项项落进来），已移除。
 */
export function introSidebar(nav: HTMLElement | null): void {
  if (!nav) return;
  nav.dataset.mxShown = "";
}

/**
 * 窄屏抽屉的推入 / 收回，连着遮罩一起。
 *
 * 判断「现在是不是抽屉态」不看断点，看侧栏自己 —— CSS 在窄屏把它变成 position: fixed，
 * 那是唯一的判据，断点数字因此只存在于样式表里一处。
 *
 * 位移用像素 x，不用 xPercent：CSS 里的 translateX(-100%) 被浏览器解析成 matrix
 * 之后 GSAP 只能读到像素值，百分比那条通道从头就不存在 —— 原来用 xPercent 动画
 * 等于在另一个坐标上滑，抽屉因此永远进不来（叠加样式表里那条 [data-drawer=open]
 * 兜底还会被行内残值压住，表现就是「点了没反应」）。
 *
 * 遮罩在 CSS 里平时是 display:none，打开期间由行内样式顶着，收回淡完再摘掉。
 */
export function animateDrawer(
  sidebar: HTMLElement | null,
  scrim: HTMLElement | null,
  open: boolean,
): void {
  if (!sidebar || !startMotion() || reducedMotion()) return;

  if (getComputedStyle(sidebar).position !== "fixed") {
    // 回到宽屏了：把抽屉留下的行内位移清掉，否则整条侧栏会卡在画面外
    gsap.set(sidebar, { clearProps: "transform" });
    if (scrim) gsap.set(scrim, { clearProps: "opacity,display" });
    return;
  }

  // 从没开过就别播「收回」：挂载时 drawerOpen 本来就是 false，这一遍 close
  // 动画会让遮罩凭空闪一下，还顺带把整页的点击都挡掉。
  if (!open && sidebar.dataset.mxDrawerOpened === undefined) return;
  sidebar.dataset.mxDrawerOpened = "";

  const target = open ? 0 : -sidebar.offsetWidth;
  gsap.killTweensOf(sidebar);
  gsap.to(sidebar, {
    x: target,
    duration: open ? 0.34 : 0.26,
    ease: open ? EASE.emphasized : EASE.accelerate,
  });

  if (!scrim) return;
  gsap.killTweensOf(scrim);
  if (open) {
    scrim.style.setProperty("display", "block");
    gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: DUR.normal, ease: EASE.standard });
  } else {
    gsap.to(scrim, {
      opacity: 0,
      duration: DUR.normal,
      ease: EASE.accelerate,
      // data-drawer 已经翻成 closed，样式表不再给 display，淡出期间自己撑住
      onStart: () => scrim.style.setProperty("display", "block"),
      onComplete: () => scrim.style.removeProperty("display"),
    });
  }
}



