import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "subtle" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretches to the full width of its container — used in narrow forms. */
  full?: boolean;
  children: ReactNode;
}

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    CommonProps {}

export function Button({
  variant = "secondary",
  size = "md",
  full = false,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps): ReactNode {
  return (
    <button
      type={type}
      className={cx("mx-button", className)}
      data-variant={variant}
      data-size={size}
      data-full={full ? "true" : undefined}
      {...props}
    >
      {children}
    </button>
  );
}

export interface LinkButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">,
    CommonProps {
  href: string;
}

/** Same visual contract as Button, but navigates. Use for real links, not actions. */
export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  full = false,
  className,
  children,
  ...props
}: LinkButtonProps): ReactNode {
  return (
    <Link
      href={href}
      className={cx("mx-button", className)}
      data-variant={variant}
      data-size={size}
      data-full={full ? "true" : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}
