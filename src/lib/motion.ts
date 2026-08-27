"use client";

/**
 * 全站动效层 —— GSAP 是唯一的动画引擎。
 *
 * 以前每个进场动画都是一条 CSS @keyframes，散在五个样式表里：同一个「淡入上移」
 * 被写了六遍，时长和曲线各写一次，没法编排（第二段要等第一段结束只能靠手写 delay）。
 * 现在只留一份「谁该怎么进场」的表（下面的 REVEALS），由 GSAP 统一执行。
 *
 * 三条约定：
 *   1. 曲线和时长仍然来自 tokens.css 的 --mx-ease-* / --mx-duration-*，用 CustomEase
 *      把同样的 cubic-bezier 搬进 GSAP —— 动效语言只有一套，不允许出现第二种手感。
 *   2. 没有 JS 也要能看：元素默认是可见的，只有在引导脚本盖上 html[data-motion="js"]
 *      之后才预先藏起来（base.css 里那条规则），而这个属性带着一个兜底定时器 ——
 *      JS 挂了 2.5 秒内自己摘掉，页面照样能读。见 lib/theme.ts。
 *   3. 接手过的元素打上 data-mx-shown，一是让预隐藏规则失效（后面交给 GSAP 的行内
 *      样式），二是路由切换重新扫描时不会把同一个元素再动一遍。
 *
 * `prefers-reduced-motion: reduce` 下这一层整体不工作：引导脚本不盖属性，
 * 于是没有预隐藏，这里也直接返回，页面就是一张静态页。
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

export { gsap, ScrollTrigger };

/** 和 tokens.css 的 --mx-ease-* 一一对应，名字注册进 GSAP 后用字符串引用。 */
export const EASE = {
  standard: "mxStandard",
  decelerate: "mxDecelerate",
  accelerate: "mxAccelerate",
  emphasized: "mxEmphasized",
} as const;

/** cubic-bezier(x1,y1,x2,y2) 直接就是一条从 0,0 到 1,1 的三次贝塞尔路径。 */
const EASE_CURVES: Array<[string, string]> = [
  [EASE.standard, "M0,0 C0.33,0 0.1,1 1,1"],
  [EASE.decelerate, "M0,0 C0.1,0.9 0.2,1 1,1"],
  [EASE.accelerate, "M0,0 C0.7,0 1,0.5 1,1"],
  [EASE.emphasized, "M0,0 C0.16,1 0.3,1 1,1"],
];

/** --mx-duration-* 换成秒。 */
export const DUR = { fast: 0.1, normal: 0.16, slow: 0.24, slower: 0.36 } as const;

/** 已经接手的标记：dataset 的 mxShown ↔ 属性 data-mx-shown。 */
const SHOWN = "mxShown";

let started = false;

/**
 * 惰性初始化。
 *
 * 客户端组件的模块在服务端渲染时也会被执行一遍，所以注册插件、注册缓动这些事
 * 不能放在模块顶层 —— 放在这里，服务端直接返回 false，什么都不碰。
 */
export function startMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (started) return true;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  for (const [name, curve] of EASE_CURVES) CustomEase.create(name, curve);
  gsap.defaults({ ease: EASE.decelerate, duration: DUR.slow });
  started = true;
  return true;
}

export function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

interface Reveal {
  /** 匹配「宿主」。 */
  selector: string;
  /** 有这一项时动的是宿主里的这些孩子，宿主自己只负责当触发器。 */
  child?: string;
  /** 起始状态，交给 gsap.from()。 */
  from: gsap.TweenVars;
  /** 多个目标之间的间隔（秒）。 */
  stagger?: number;
  /** 滚动到视口里才播；否则挂载即播。 */
  scroll?: boolean;
  /** 把同一个父元素下的兄弟合成一批做 stagger —— 列表就是这样一条条淌进来的。 */
  group?: boolean;
}

/**
 * 「谁该怎么进场」的唯一一份表。
 *
 * 前三条是显式声明的（页面自己在标签上写 data-mx-reveal / data-mx-stagger），
 * 后面几条按类名兜住通用组件 —— 那些类名以前各自带着一条 @keyframes，
 * 现在删掉了，改到这里来。加一种进场方式请改这张表，不要在组件里另起一套。
 */
const REVEALS: Reveal[] = [
  {
    selector: '[data-mx-reveal="rise"]',
    scroll: true,
    from: { y: 18, opacity: 0, duration: 0.62, ease: EASE.emphasized },
  },
  {
    selector: '[data-mx-reveal="panel"]',
    scroll: true,
    from: { y: 22, scale: 0.985, opacity: 0, duration: 0.72, ease: EASE.emphasized },
  },
  {
    selector: "[data-mx-stagger]",
    child: ":scope > *",
    scroll: true,
    stagger: 0.07,
    from: { y: 16, opacity: 0, duration: 0.56, ease: EASE.emphasized },
  },
  /* 应用外壳：页面容器和它的直接孩子（原 mx-section-enter / -child-enter）。 */
  {
    selector: ".mx-section",
    child: ":scope > *",
    stagger: 0.032,
    from: { y: 10, opacity: 0, duration: 0.28, ease: EASE.emphasized },
  },
  /* 列表行、房间卡：一批一起淌进来（原 mx-row-enter）。 */
  {
    selector: ".mx-row, .mx-roomcard",
    group: true,
    stagger: 0.028,
    from: { y: 8, opacity: 0, duration: 0.26 },
  },
  /* 提示条、引导块、画面分片（原 mx-motion-enter）。 */
  {
    selector: ".mx-banner, .mx-guide, .mx-stage__tile",
    from: { y: 6, opacity: 0, duration: DUR.slow },
  },
  /* 浮层菜单：从锚点往下弹（原 mx-menu-in）。 */
  {
    selector: ".mx-menu, .mx-context, .mx-finder__menu",
    from: {
      y: -6,
      scale: 0.97,
      opacity: 0,
      duration: 0.2,
      ease: EASE.emphasized,
      transformOrigin: "top center",
    },
  },
  /* 表单和弹窗正文里的一行行字段（原 mx-field-enter）。 */
  {
    selector: ".mx-form, .mx-modal__body",
    child: ":scope > *",
    stagger: 0.032,
    from: { y: -3, opacity: 0, duration: 0.16 },
  },
  /* 登录页：整块升起，品牌标记再弹一下（原 mx-auth-rise / mx-auth-pop）。 */
  {
    selector: ".mx-auth__inner",
    from: { y: 16, opacity: 0, duration: DUR.slow, ease: EASE.emphasized },
  },
  {
    selector: ".mx-auth__mark",
    from: { scale: 0.86, opacity: 0, duration: 0.3, ease: EASE.emphasized },
  },
  /* 房间里的新手引导气泡（原 mx-coach-in）。 */
  {
    selector: ".mx-coach__bubble",
    from: { y: -8, opacity: 0, duration: DUR.slow, ease: EASE.emphasized },
  },
];

function fresh(el: HTMLElement): boolean {
  return el.dataset[SHOWN] === undefined;
}

/** 打上标记，同时让 base.css 的预隐藏规则失效 —— 之后可见性由 GSAP 的行内样式说话。 */
function claim(el: HTMLElement): void {
  el.dataset[SHOWN] = "";
}

function play(preset: Reveal, host: HTMLElement, targets: HTMLElement[]): void {
  if (targets.length === 0) return;
  gsap.from(targets, {
    // 动完把行内值摘掉，元素回到样式表描述的样子 —— 不留 opacity: 1 这类残渣
    clearProps: "opacity,transform",
    ...preset.from,
    stagger: preset.stagger,
    scrollTrigger: preset.scroll ? { trigger: host, start: "top 88%", once: true } : undefined,
  });
}

function runPreset(preset: Reveal, hosts: HTMLElement[]): void {
  if (preset.child) {
    for (const host of hosts) {
      claim(host);
      play(preset, host, [...host.querySelectorAll<HTMLElement>(preset.child)]);
    }
    return;
  }

  if (!preset.group) {
    for (const host of hosts) {
      claim(host);
      play(preset, host, [host]);
    }
    return;
  }

  // 同父的兄弟合成一批：触发器挂在父元素上，于是整段列表是一起开始淌的
  const batches = new Map<HTMLElement, HTMLElement[]>();
  for (const host of hosts) {
    const parent = host.parentElement;
    if (!parent) continue;
    claim(host);
    const batch = batches.get(parent);
    if (batch) batch.push(host);
    else batches.set(parent, [host]);
  }
  for (const [parent, batch] of batches) play(preset, parent, batch);
}

/**
 * 扫一遍 `root` 里还没被接手的元素，按表安排进场。
 *
 * 幂等：接手过的带着 data-mx-shown，重复调用不会把同一个元素再动一遍，
 * 所以路由切换后直接再扫一次就行。
 */
export function revealWithin(root: ParentNode): void {
  if (!startMotion() || reducedMotion()) return;
  for (const preset of REVEALS) {
    const hosts = [...root.querySelectorAll<HTMLElement>(preset.selector)].filter(fresh);
    if (hosts.length > 0) runPreset(preset, hosts);
  }
}

/** 同上，但把 `el` 自己也算进去 —— MutationObserver 给到的就是这种「新来的一棵子树」。 */
function revealTree(el: HTMLElement): void {
  for (const preset of REVEALS) {
    if (el.matches(preset.selector) && fresh(el)) runPreset(preset, [el]);
  }
  revealWithin(el);
}

/**
 * 之后才出现的元素（弹出的菜单、新加的一行、进房后的画面分片）也要有进场动画。
 *
 * MutationObserver 的回调在这一帧绘制之前跑，所以 GSAP 有机会在用户看到「已完成态」
 * 之前把起始值写上去 —— 这类元素因此不需要 CSS 预隐藏兜底。
 */
export function watchNewNodes(): () => void {
  if (!startMotion() || reducedMotion()) return () => {};

  const pending = new Set<HTMLElement>();
  let queued = false;

  const flush = () => {
    queued = false;
    const roots = [...pending];
    pending.clear();
    // 已经被别的祖先带着一起处理掉的就跳过
    for (const el of roots) if (el.isConnected) revealTree(el);
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        pending.add(node as HTMLElement);
      }
    }
    if (pending.size > 0 && !queued) {
      queued = true;
      queueMicrotask(flush);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}



