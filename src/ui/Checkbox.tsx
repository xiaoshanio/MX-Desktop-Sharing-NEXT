"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Label text rendered beside the box. Omit for bare checkboxes in table cells. */
  label?: ReactNode;
}

export function Checkbox({ label, className, ...props }: CheckboxProps): ReactNode {
  const box = <input type="checkbox" className={cx("mx-checkbox", className)} {...props} />;
  if (!label) return box;
  return (
    <label className="mx-check">
      {box}
      <span>{label}</span>
    </label>
  );
}
