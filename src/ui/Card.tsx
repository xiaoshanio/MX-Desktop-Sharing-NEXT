import type { ReactNode } from "react";

import { cx } from "./cx";

export interface CardProps {
  /** Card heading. Omit for a plain surface. */
  title?: ReactNode;
  /** One-line explanation under the title. */
  description?: ReactNode;
  /** Right-aligned header slot — buttons, badges, counts. */
  actions?: ReactNode;
  /** `card` uses the raised surface instead of the layer surface. */
  surface?: "layer" | "card";
  /** `tight` trims the padding — for dense side panels. */
  pad?: "default" | "tight";
  children?: ReactNode;
  className?: string;
}

/**
 * The default content container: bordered surface, optional header row, vertical body stack.
 * Replaces the old `.panel` and is the building block for every page section.
 */
export function Card({
  title,
  description,
  actions,
  surface = "layer",
  pad = "default",
  children,
  className,
}: CardProps): ReactNode {
  return (
    <section
      className={cx("mx-card", className)}
      data-inset={surface === "card" ? "true" : undefined}
      data-pad={pad === "tight" ? "tight" : undefined}
    >
      {title || actions ? (
        <header className="mx-card__header">
          {title ? <h2 className="mx-card__title">{title}</h2> : null}
          <span className="mx-card__spacer" />
          {actions}
        </header>
      ) : null}
      {description ? <p className="mx-card__body">{description}</p> : null}
      {children}
    </section>
  );
}
