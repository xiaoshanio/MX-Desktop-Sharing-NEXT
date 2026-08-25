import type { ButtonHTMLAttributes, ReactNode } from "react";

import type { ButtonSize } from "./Button";
import { cx } from "./cx";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Accessible label, also used as the tooltip. Required — these buttons have no text. */
  label: string;
  size?: ButtonSize;
  /** `danger` tints the hover state red, for destructive row actions. */
  tone?: "neutral" | "danger";
  children: ReactNode;
}

export function IconButton({
  label,
  size = "md",
  tone = "neutral",
  type = "button",
  className,
  children,
  ...props
}: IconButtonProps): ReactNode {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx("mx-icon-button", className)}
      data-size={size}
      data-tone={tone === "danger" ? "danger" : undefined}
      {...props}
    >
      {children}
    </button>
  );
}
