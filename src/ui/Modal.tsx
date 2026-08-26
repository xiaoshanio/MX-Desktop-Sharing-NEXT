"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  /** Called on Escape, backdrop click, or the close button. */
  onClose: () => void;
  children?: ReactNode;
  /** Footer slot, rendered right-aligned (reverse row order). */
  footer?: ReactNode;
  size?: ModalSize;
}

/**
 * Accessible dialog rendered into a portal on document.body.
 * Locks page scroll, closes on Escape and backdrop click, moves focus to the panel on open,
 * and plays an exit animation before unmounting.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps): ReactNode {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(open);

  useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }
    if (!rendered) return;
    const id = window.setTimeout(() => setRendered(false), 170);
    return () => window.clearTimeout(id);
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      // Only the backdrop itself closes — clicks inside the panel must not.
      if (event.target === event.currentTarget) onClose();
    },
    [onClose],
  );

  if (!rendered || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="mx-modal__backdrop"
      data-state={open ? "open" : "closing"}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="mx-modal__panel"
        data-size={size}
        data-state={open ? "open" : "closing"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="mx-modal__header">
          <h2 id={titleId} className="mx-modal__title">
            {title}
          </h2>
          <button type="button" className="mx-modal__close" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="mx-modal__body">{children}</div>
        {footer ? <footer className="mx-modal__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
