"use client";

import type { ReactNode } from "react";

import { useT } from "@/i18n";
import { Button } from "./Button";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  /** Uses the destructive button variant for confirm. */
  danger?: boolean;
  /** Disables both actions while an in-flight request settles. */
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Two-action confirmation modal. Always keeps a cancel path — destructive operations must
 * never be the only way out.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps): ReactNode {
  const t = useT();
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? t("common.working") : (confirmLabel ?? t("common.confirm"))}
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  );
}
