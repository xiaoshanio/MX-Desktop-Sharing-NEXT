"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { startMosaic } from "@/lib/mosaic-shader";
import { EASE, gsap, reducedMotion, startMotion } from "@/lib/motion";

/**
 * 首页最后那张「建个房间，把屏幕推过去」的卡：一块 WebGL 马赛克背景 + 盖在上面的文案。
 *
 * 分四层，从下到上：
 *   canvas      着色器算出来的马赛克波纹（lib/mosaic-shader.ts）
 *   fallback    纯 CSS 条纹，只在 WebGL 不可用 / 用户要求减少动效时露出来
 *   wash        一层从左下往右上淡出的暗色渐变 —— 白字的可读性靠它，不靠运气
 *   grain       极轻的噪点，压掉大色块的塑料感
 *
 * 文案层挂了 data-mx-stagger，所以它的进场由全站那套 GSAP 动效层统一安排
 * （lib/motion.ts 的表），这里只管背景自己的淡入和滚动视差。
 */
export function ClosingStage({ children }: { children: ReactNode }): ReactNode {
  const stageRef = useRef<HTMLDivElement>(null);
  const shaderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = shaderRef.current;
    const fallback = fallbackRef.current;
    if (!canvas || !host || !fallback) return;

    const giveUp = () => {
      canvas.style.display = "none";
      fallback.setAttribute("data-on", "true");
    };

    // 尊重系统「减少动态效果」：连上下文都不开
    if (reducedMotion()) {
      giveUp();
      return;
    }

    const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";
    const mosaic = startMosaic(canvas, host, isDark());
    if (!mosaic) {
      giveUp();
      return;
    }

    // 主题开关改的是 <html data-theme>，着色器跟着换一个 uniform 就行
    const themeWatcher = new MutationObserver(() => mosaic.setDark(isDark()));
    themeWatcher.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      themeWatcher.disconnect();
      mosaic.destroy();
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !startMotion() || reducedMotion()) return;

    const ctx = gsap.context(() => {
      // 背景自己淡进来，比文案慢一点，读起来像「先亮灯，再上字」
      gsap.from(".mx-land__stage-shader", {
        opacity: 0,
        scale: 1.08,
        duration: 1.1,
        ease: EASE.standard,
        scrollTrigger: { trigger: stage, start: "top 88%", once: true },
      });

      // 视差：着色器层比卡片高一截（见 landing.css），所以能上下推而不露边
      gsap.fromTo(
        ".mx-land__stage-shader",
        { yPercent: -3 },
        {
          yPercent: 3,
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
    }, stageRef);

    return () => ctx.revert();
  }, []);


  return (
    <div className="mx-land__stage" ref={stageRef}>
      <div className="mx-land__stage-shader" ref={shaderRef} aria-hidden="true">
        <canvas ref={canvasRef} />
        <div className="mx-land__stage-fallback" ref={fallbackRef} />
      </div>

      {/* 这两层留在视差之外：背景可以动，压在文字底下的暗色不能跟着晃 */}
      <div className="mx-land__stage-wash" aria-hidden="true" />
      <div className="mx-land__stage-grain" aria-hidden="true" />

      <div className="mx-land__stage-content" data-mx-stagger>
        {children}
      </div>
    </div>
  );
}
