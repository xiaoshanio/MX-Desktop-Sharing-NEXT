"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cx } from "./cx";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: ReactNode;
  /** Display current value next to label */
  showValue?: boolean;
  /** Format function for displaying value */
  formatValue?: (value: number) => string;
  /** Unit to display after value (e.g., "fps", "Mbps", "p") */
  unit?: string;
}

export function Slider({
  label,
  hint,
  showValue = false,
  formatValue,
  unit,
  value,
  min = 0,
  max = 100,
  step = 1,
  id,
  className,
  ...props
}: SliderProps): ReactNode {
  const generatedId = useId();
  const sliderId = id ?? generatedId;

  const numValue = typeof value === "string" ? parseFloat(value) : typeof value === "number" ? value : Number(min);
  const displayValue = formatValue
    ? formatValue(numValue)
    : unit
      ? `${numValue}${unit}`
      : String(numValue);

  return (
    <div className="mx-field">
      {label || showValue ? (
        <label className="mx-field__label" htmlFor={sliderId}>
          {label}
          {showValue && (
            <span className="mx-slider__value">{displayValue}</span>
          )}
        </label>
      ) : null}
      <input
        type="range"
        id={sliderId}
        className={cx("mx-slider", className)}
        min={min}
        max={max}
        step={step}
        value={value}
        {...props}
      />
      {hint ? <span className="mx-field__hint">{hint}</span> : null}
    </div>
  );
}
