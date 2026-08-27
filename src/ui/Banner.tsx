import type { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";
import { cx } from "./cx";

export type BannerTone = "info" | "warning" | "error" | "success";

export interface BannerProps {
  tone?: BannerTone;
  title?: ReactNode;
  children?: ReactNode;
  /** Right-aligned action slot, typically a Button. */
  action?: ReactNode;
  className?: string;
}

const TONE_ICON: Record<BannerTone, IconName> = {
  info: "info",
  warning: "alert",
  error: "alert",
  success: "check",
};

/**
 * Inline notification strip — non-blocking, no dismiss. Sits at the top of a section to
 * surface conditional state ("this node has no Ingress", "room closed").
 */
export function Banner({
  tone = "info",
  title,
  children,
  action,
  className,
}: BannerProps): ReactNode {
  return (
    <div className={cx("mx-banner", className)} data-tone={tone} role="status">
      <span className="mx-banner__icon">
        <Icon name={TONE_ICON[tone]} size={17} />
      </span>
      <div className="mx-banner__body">
        {title ? <div className="mx-banner__title">{title}</div> : null}
        {children ? <div className="mx-banner__text">{children}</div> : null}
      </div>
      {action ? <div className="mx-banner__action">{action}</div> : null}
    </div>
  );
}
