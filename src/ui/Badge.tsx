import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "error" | "info" | "accent";

export interface BadgeProps {
  tone?: BadgeTone;
  /** Leading status dot. */
  dot?: boolean;
  /** Softly pulses the dot to signal a transient state (e.g. "connecting"). */
  pulse?: boolean;
  children: ReactNode;
}

export function Badge({
  tone = "neutral",
  dot = false,
  pulse = false,
  children,
}: BadgeProps): ReactNode {
  return (
    <span className="mx-badge" data-tone={tone} data-pulse={pulse ? "true" : undefined}>
      {dot ? <span className="mx-badge__dot" /> : null}
      {children}
    </span>
  );
}
