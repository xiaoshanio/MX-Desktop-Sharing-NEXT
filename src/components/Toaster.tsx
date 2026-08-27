"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { dismissToast, subscribeToasts, type ToastItem, type ToastTone } from "@/lib/toast";
import { useT } from "@/i18n";
import { Icon, type IconName } from "@/ui";

const ICONS: Record<ToastTone, IconName> = {
  error: "alert",
  warning: "alert",
  success: "check",
  info: "info",
};

/**
 * 右上角的提示栈。挂在根 layout 上，全站共用一份。
 *
 * 取代了原先散落在各个页面里的 Banner：那些内联横幅会把页面内容往下挤，
 * 而且在弹窗里报的错常常被挡住看不见。
 */
export function Toaster(): ReactNode {
  const t = useT();
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return subscribeToasts(setItems);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="mx-toasts" role="region" aria-label={t("common.notifications")}>
      {items.map((item) => (
        <Toast key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  );
}

function Toast({ item }: { item: ToastItem }): ReactNode {
  const t = useT();
  /** 关闭前先播退场动画，不然卡片是硬消失的。 */
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (item.duration <= 0) return;

    // count 变化时（同一条消息又来了一次）重新计时，让它多留一会儿
    const timer = setTimeout(() => setLeaving(true), item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, item.count]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => dismissToast(item.id), 180);
    return () => clearTimeout(timer);
  }, [leaving, item.id]);

  return (
    <div
      className="mx-toast"
      data-tone={item.tone}
      data-state={leaving ? "leaving" : "entering"}
      // 错误是需要被读到的，用 assertive 打断读屏；其余不抢话
      role={item.tone === "error" ? "alert" : "status"}
      aria-live={item.tone === "error" ? "assertive" : "polite"}
    >
      <span className="mx-toast__icon">
        <Icon name={ICONS[item.tone]} size={16} />
      </span>

      <div className="mx-toast__body">
        {item.title ? <strong className="mx-toast__title">{item.title}</strong> : null}
        <span className="mx-toast__message">{item.message}</span>
      </div>

      {item.count > 1 && <span className="mx-toast__count">×{item.count}</span>}

      <button
        type="button"
        className="mx-toast__close"
        aria-label={t("common.dismissNotification")}
        onClick={() => setLeaving(true)}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
