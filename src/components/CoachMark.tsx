"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useT } from "@/i18n";
import { Button, Icon } from "@/ui";

export interface CoachMarkProps {
  /** 要指向的元素。传 null 就不渲染。 */
  anchor: HTMLElement | null;
  title: ReactNode;
  children: ReactNode;
  confirmLabel?: ReactNode;
  onDismiss: () => void;
}

/**
 * 指向某个按钮的引导气泡。
 *
 * 用途只有一个：首次进房时告诉用户「推流地址以后在这个齿轮里看」。所以刻意做得很简单 ——
 * 一个箭头 + 一段话 + 一个「知道了」，没有多步流程。
 *
 * 位置每帧都跟着锚点算，而不是一次算完就固定：顶栏里的按钮会因为房间名长度、
 * 窗口宽度、侧栏收放而移动，算死了就会指向空气。
 */
export function CoachMark({
  anchor,
  title,
  children,
  confirmLabel,
  onDismiss,
}: CoachMarkProps): ReactNode {
  const t = useT();
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  /**
   * 用 useLayoutEffect 而不是 useEffect：气泡要在浏览器绘制之前就位，
   * 否则会先在左上角闪一下再跳到按钮下面。
   */
  useLayoutEffect(() => {
    if (!anchor) {
      setBox(null);
      return;
    }

    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      setBox({ top: rect.bottom, left: rect.left + rect.width / 2, width: rect.width });
    };

    measure();

    // 顶栏按钮的位置会随窗口和侧栏变化，跟着重算
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    observer.observe(anchor);
    window.addEventListener("scroll", measure, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure, true);
    };
  }, [anchor]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  if (!anchor || !box || typeof document === "undefined") return null;

  // 贴着右边缘时把气泡往左拉，避免出屏
  const bubbleWidth = 300;
  const margin = 12;
  const left = Math.min(
    Math.max(margin + bubbleWidth / 2, box.left),
    window.innerWidth - margin - bubbleWidth / 2,
  );

  return createPortal(
    <div className="mx-coach" role="dialog" aria-live="polite">
      {/* 脉冲光环套在按钮上，把视线先拉过去 */}
      <span
        className="mx-coach__halo"
        style={{ top: box.top - box.width - 6, left: box.left, width: box.width + 14, height: box.width + 14 }}
      />
      <div className="mx-coach__bubble" style={{ top: box.top + 12, left, width: bubbleWidth }}>
        <span
          className="mx-coach__arrow"
          // 气泡被边缘推开时，箭头仍要指着按钮中心
          style={{ left: `calc(50% + ${Math.round(box.left - left)}px)` }}
        />
        <div className="mx-coach__head">
          <Icon name="sparkle" size={15} />
          <strong>{title}</strong>
        </div>
        <div className="mx-coach__body">{children}</div>
        <div className="mx-coach__foot">
          <Button size="sm" variant="primary" onClick={onDismiss}>
            {confirmLabel ?? t("common.gotIt")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
