"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { ScrollTrigger, revealWithin, startMotion, watchNewNodes } from "@/lib/motion";

/**
 * 全站动效的启动器。挂在 layout 最外层，自己不渲染任何东西。
 *
 * 职责只有三件：
 *   1. 初始化 GSAP，并在 <html> 上盖 data-motion-ready —— 引导脚本里的兜底定时器
 *      看到这个属性就不会把预隐藏摘掉（摘掉是「JS 没起来」的应急路径）。
 *   2. 首屏扫一遍、之后每次路由切换再扫一遍（软导航不重新挂载这个组件）。
 *   3. 盯住之后新出现的元素 —— 菜单、新行、进房后的画面分片都走这条路。
 *
 * 具体每种元素怎么动，全在 lib/motion.ts 的那张表里，这里不做任何动画决策。
 */
export function MotionProvider(): null {
  const pathname = usePathname();

  useEffect(() => {
    if (!startMotion()) return;
    document.documentElement.setAttribute("data-motion-ready", "");
    return watchNewNodes();
  }, []);

  useEffect(() => {
    revealWithin(document);

    // 换页之后旧的触发器指向的元素已经不在文档里了，清掉再重算，否则滚动位置会算错
    for (const trigger of ScrollTrigger.getAll()) {
      const el = trigger.trigger;
      if (el instanceof Element && !el.isConnected) trigger.kill();
    }
    ScrollTrigger.refresh();

    // 字体换成正式那一套之后行高会变，元素位置跟着变 —— 触发点要重算
    void document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
  }, [pathname]);

  return null;
}
