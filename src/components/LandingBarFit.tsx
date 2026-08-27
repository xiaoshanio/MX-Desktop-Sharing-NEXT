"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 首页顶栏的「装不下就砍次要项」逻辑。
 *
 * 优先级（窄屏时）：
 *   1. LOGO + 项目名        ← 必须完整显示，不许被省略号切掉
 *   2. GitHub 图标          ← 必须显示
 *   3. 主题切换 + 登录/注册  ← 装不下就**一起**隐藏（包在 .mx-land__secondary 里）
 *   语言下拉在手机端一律不显示（纯 CSS，见 landing.css 的 767px 断点）
 *
 * 为什么要用 JS 量而不是写死一个断点：项目名是固定的 23 个字符，但
 * 「登录 / 注册」在七种语言里宽度差近一倍（zh「登录 / 注册」vs fr「Se connecter / S'inscrire」）。
 * 写死断点必然在某几种语言上过早或过晚地砍。
 */

/** 元素的内容宽度：不受父容器压缩、也不受自身 overflow:hidden 截断影响。 */
function intrinsicWidth(el: HTMLElement): number {
  return Math.max(el.scrollWidth, el.offsetWidth);
}

function columnGap(el: HTMLElement): number {
  const value = Number.parseFloat(getComputedStyle(el).columnGap);
  return Number.isFinite(value) ? value : 0;
}

export function LandingBarFit({ children }: { children: ReactNode }): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  /**
   * 次要项**展开时**有多宽。
   *
   * 必须记住，不能每次现测：砍掉之后它们的 offsetWidth 就是 0，判据会跟着结论走，
   * 于是「砍掉 → 装得下了 → 放回来 → 又装不下 → 再砍」来回抖动。
   *
   * 放在 ref 而不是 effect 的局部变量里：开发环境 React 会把 effect 跑两遍
   * （挂载 → 清理 → 再挂载），第二遍时 DOM 可能已经是紧凑态了，局部变量会在那时
   * 量出一个偏小的值并永久记住它。ref 跨 effect 存活，只记第一次（一定是展开态，
   * 因为服务端渲染出来的 HTML 不带 data-compact）。
   */
  const secondaryWidth = useRef<number | null>(null);

  useEffect(() => {
    const inner = ref.current;
    if (!inner) return;

    const brand = inner.querySelector<HTMLElement>(".mx-land__brand");
    const name = inner.querySelector<HTMLElement>(".mx-land__brand-name");
    const nav = inner.querySelector<HTMLElement>(".mx-land__nav");
    const actions = inner.querySelector<HTMLElement>(".mx-land__bar-actions");
    const secondaries = [...inner.querySelectorAll<HTMLElement>(".mx-land__secondary")];
    /**
     * 量的是 .mx-land__secondary 的**子元素**，不是它自己。
     *
     * 那几个 span 是 `display: contents`（好让按钮直接参与顶栏的 flex 布局），
     * 而 display:contents 的元素不生成盒子，offsetWidth 恒为 0 —— 量它等于量到 0，
     * 于是永远得出「还装得下」的结论。
     */
    const secondaryItems = secondaries.flatMap(
      (wrapper) => [...wrapper.children] as HTMLElement[],
    );
    if (!brand || !name || !actions) return;

    const measure = () => {
      // clientWidth 含左右内边距，而下面算的都是内容宽度 —— 必须先把内边距扣掉，
      // 否则在手机上会以为还多出一个 gutter 的余量，结果项目名被切掉却不砍次要项
      const style = getComputedStyle(inner);
      const available =
        inner.clientWidth -
        Number.parseFloat(style.paddingInlineStart || "0") -
        Number.parseFloat(style.paddingInlineEnd || "0");
      // 面板还没有尺寸（首帧之前、或者被藏起来了）：什么都不判断，免得留下错的结论
      if (available <= 0) return;

      const gap = columnGap(inner);
      const actionsGap = columnGap(actions);

      // 首次测量一定发生在展开态（服务端 HTML 不带 data-compact），趁这时记住宽度
      if (secondaryWidth.current === null && !inner.hasAttribute("data-compact")) {
        secondaryWidth.current = secondaryItems.reduce(
          (sum, el) => sum + el.offsetWidth + actionsGap,
          0,
        );
      }

      // 右侧那一组：始终可见的部分现测（语言下拉在窄屏是 display:none，现测正好为 0），
      // 会被砍掉的部分用记住的宽度
      const alwaysVisible = [...actions.children]
        .filter((el) => !el.classList.contains("mx-land__secondary"))
        .reduce((sum, el) => {
          const width = (el as HTMLElement).offsetWidth;
          return width > 0 ? sum + width + actionsGap : sum;
        }, 0);

      const mark = brand.firstElementChild as HTMLElement | null;
      const brandNeed = (mark?.offsetWidth ?? 0) + columnGap(brand) + intrinsicWidth(name);
      const navNeed = nav && nav.offsetWidth > 0 ? nav.offsetWidth + gap : 0;
      const actionsNeed = alwaysVisible + (secondaryWidth.current ?? 0);

      const compact = brandNeed + navNeed + gap + actionsNeed > available;

      // 只在和 DOM 真的不一致时才写：改属性会引起重排，重排又会触发 ResizeObserver，
      // 无条件写就成了永不停止的循环
      if (compact === inner.hasAttribute("data-compact")) return;
      if (compact) inner.setAttribute("data-compact", "true");
      else inner.removeAttribute("data-compact");
    };

    measure();

    // resize 事件盯窗口宽度；ResizeObserver 盯「右侧那一组因为换了语言而变宽」
    // —— 两者覆盖的情况不同，都需要。
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    observer.observe(actions);

    // 字体换成正式的那一套之后文字宽度会变，再量一次
    void document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="mx-land__measure mx-land__bar-inner">
      {children}
    </div>
  );
}
