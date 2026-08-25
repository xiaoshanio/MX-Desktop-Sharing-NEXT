import type { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";

export interface EmptyStateProps {
  icon?: IconName;
  title: ReactNode;
  children?: ReactNode;
  /** Call-to-action buttons. */
  actions?: ReactNode;
}

/** Dashed placeholder shown wherever a list has nothing in it yet. */
export function EmptyState({ icon, title, children, actions }: EmptyStateProps): ReactNode {
  return (
    <div className="mx-empty">
      {icon ? (
        <span className="mx-empty__icon">
          <Icon name={icon} size={22} />
        </span>
      ) : null}
      <span className="mx-empty__title">{title}</span>
      {children ? <span className="mx-empty__body">{children}</span> : null}
      {actions ? <div className="mx-empty__actions">{actions}</div> : null}
    </div>
  );
}
