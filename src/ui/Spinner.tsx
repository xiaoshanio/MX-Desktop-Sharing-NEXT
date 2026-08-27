"use client";

import type { ReactNode } from "react";

import { useT } from "@/i18n";

export interface SpinnerProps {
  /** Diameter in pixels. */
  size?: number;
  label?: string;
}

export function Spinner({ size = 16, label }: SpinnerProps): ReactNode {
  const t = useT();
  return (
    <span
      className="mx-spinner"
      role="status"
      aria-label={label ?? t("common.loading")}
      style={{ width: size, height: size }}
    />
  );
}

/** Spinner + text, for "loading…" placeholders inside cards and tables. */
export function Loading({ children }: { children?: ReactNode }): ReactNode {
  const t = useT();
  return (
    <span className="mx-loading">
      <Spinner size={14} />
      {children ?? t("common.loadingEllipsis")}
    </span>
  );
}

/**
 * 占满整个内容区、垂直水平居中的加载指示。
 *
 * 页面首屏一律用这个，而不是先把空表格空卡片画出来再填数据：
 * 那种「骨架先出现、内容随后跳进来」的过程在慢连接上比转圈更难受，
 * 而这个应用的每次页面加载都要过一次 Neon（HTTP 驱动，有实打实的往返延迟）。
 */
export function PageLoader({ children }: { children?: ReactNode }): ReactNode {
  const t = useT();
  return (
    <div className="mx-pageloader" role="status" aria-live="polite">
      <Spinner size={30} />
      <span className="mx-pageloader__label">{children ?? t("common.loadingEllipsis")}</span>
    </div>
  );
}
