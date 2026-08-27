"use client";

import { useEffect } from "react";

import { EASE, ScrollTrigger, gsap, reducedMotion, startMotion } from "@/lib/motion";

/**
 * 首页专属的那条编排。
 *
 * 通用的「滚到就淌进来」由全站动效层管（lib/motion.ts + MotionProvider），这里只放
 * 三件它管不了的事：
 *   1. 首屏的进场顺序 —— 标签 → 标题 → 说明 → 按钮 → 事实条，然后拓扑图跟上、
 *      节点卡再一张张落。这是一条有先后的时间线，不是「每个元素各自淡入」。
 *   2. 在线房间那颗绿点的呼吸（原 landing.css 的 mx-land-pulse）。每颗错开起拍，
 *      不然三颗点齐刷刷一起闪，像坏了。
 *   3. 顶栏离开页顶后加一道投影 —— 滚动位置驱动，交给 ScrollTrigger。
 *
 * 首屏那几个元素是服务端渲染出来的，会在 JS 之前就被画上，所以 landing.css 里有一条
 * 预隐藏规则等着它们；这里接手时打上 data-mx-shown 让那条规则失效。
 */
export function LandingMotion(): null {
  useEffect(() => {
    if (!startMotion() || reducedMotion()) return;

    const copy = document.querySelector<HTMLElement>(".mx-land__hero-copy");
    const topo = document.querySelector<HTMLElement>(".mx-land__topo");
    const bar = document.querySelector<HTMLElement>(".mx-land__bar");

    const ctx = gsap.context(() => {
      if (copy) copy.dataset.mxShown = "";
      if (topo) topo.dataset.mxShown = "";

      const intro = gsap.timeline({ defaults: { ease: EASE.emphasized } });
      if (copy) {
        intro.from(copy.children, { y: 20, opacity: 0, duration: 0.62, stagger: 0.075 });
      }
      if (topo) {
        intro
          .from(topo, { y: 28, scale: 0.985, opacity: 0, duration: 0.8 }, 0.08)
          .from(
            topo.querySelectorAll(".mx-land__node"),
            { y: 14, opacity: 0, duration: 0.5, stagger: 0.07 },
            0.32,
          );
      }

      const dots = document.querySelectorAll<HTMLElement>(
        '.mx-land__room[data-live="true"] .mx-land__room-dot',
      );
      if (dots.length > 0) {
        gsap.to(dots, {
          scale: 0.82,
          opacity: 0.45,
          duration: 1.2,
          ease: EASE.standard,
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.4, from: "random" },
        });
      }

      if (bar) {
        // 没给 trigger 时 start/end 就是绝对滚动位置：过了 12px 就算「离开页顶」
        ScrollTrigger.create({
          start: 12,
          end: () => ScrollTrigger.maxScroll(window),
          onToggle: (self) => {
            if (self.isActive) bar.setAttribute("data-scrolled", "true");
            else bar.removeAttribute("data-scrolled");
          },
        });
      }

    });

    return () => ctx.revert();
  }, []);

  return null;
}
