import type { ReactNode } from "react";

export interface SpinnerProps {
  /** Diameter in pixels. */
  size?: number;
  label?: string;
}

export function Spinner({ size = 16, label }: SpinnerProps): ReactNode {
  return (
    <span
      className="mx-spinner"
      role="status"
      aria-label={label ?? "加载中"}
      style={{ width: size, height: size }}
    />
  );
}

/** Spinner + text, for "loading…" placeholders inside cards and tables. */
export function Loading({ children = "加载中…" }: { children?: ReactNode }): ReactNode {
  return (
    <span className="mx-loading">
      <Spinner size={14} />
      {children}
    </span>
  );
}
