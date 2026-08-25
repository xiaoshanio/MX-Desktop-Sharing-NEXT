"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Text beside the track. Omit for a bare switch in a toolbar or table cell. */
  label?: ReactNode;
  /** Secondary line under the label — say what flipping it actually does. */
  hint?: ReactNode;
}

/**
 * On/off control for a setting that takes effect immediately (no form to submit).
 * A checkbox is the right control when the change is staged; this one is for
 * "flip it and it's applied".
 */
export function Switch({ label, hint, className, ...props }: SwitchProps): ReactNode {
  const track = (
    <span className="mx-switch">
      <input type="checkbox" role="switch" {...props} />
      <span className="mx-switch__track" aria-hidden="true">
        <span className="mx-switch__knob" />
      </span>
    </span>
  );

  if (!label) return track;

  return (
    <label className={cx("mx-switch-row", className)}>
      {track}
      <span className="mx-switch-row__text">
        <span className="mx-switch-row__label">{label}</span>
        {hint ? <span className="mx-switch-row__hint">{hint}</span> : null}
      </span>
    </label>
  );
}
