"use client";

import type { ReactNode } from "react";

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
  confirmLabel = "确定",
  cancelLabel = "取消",
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps): ReactNode {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "处理中…" : confirmLabel}
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  );
}
