import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

import type { ButtonSize } from "./Button";
import { cx } from "./cx";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Accessible label, also used as the tooltip. Required — these buttons have no text. */
  label: string;
  size?: ButtonSize;
  /** `danger` tints the hover state red, for destructive row actions. */
  tone?: "neutral" | "danger";
  /**
   * React 19 lets function components take `ref` as an ordinary prop, so no forwardRef.
   * The room's guided tour needs it to anchor its callout to the settings button.
   */
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

export function IconButton({
  label,
  size = "md",
  tone = "neutral",
  type = "button",
  className,
  children,
  ref,
  ...props
}: IconButtonProps): ReactNode {
  return (
    <button
      ref={ref}
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
