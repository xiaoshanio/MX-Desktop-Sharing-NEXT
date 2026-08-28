"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cx } from "./cx";

/** One discrete stage under the track. `label` is the parameter annotation. */
export interface SliderMark {
  value: number;
  label: string;
}

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: ReactNode;
  /** Display current value next to label */
  showValue?: boolean;
  /** Format function for displaying value */
  formatValue?: (value: number) => string;
  /** Unit to display after value (e.g., "fps", "Mbps", "p") */
  unit?: string;
  /**
   * Discrete stage markers rendered under the track. Each is positioned at its
   * value's percentage of [min, max], so with index-based sliders (0..n-1) every
   * stage sits at an equal interval and lines up with the thumb's snap points.
   */
  marks?: SliderMark[];
}

export function Slider({
  label,
  hint,
  showValue = false,
  formatValue,
  unit,
  marks,
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

  const numMin = Number(min);
  const numMax = Number(max);
  const numValue = typeof value === "string" ? parseFloat(value) : typeof value === "number" ? value : Number(min);
  const displayValue = formatValue
    ? formatValue(numValue)
    : unit
      ? `${numValue}${unit}`
      : String(numValue);

  const span = numMax - numMin;

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
      {marks && marks.length > 0 ? (
        <div className="mx-slider-marks" aria-hidden="true">
          {marks.map((mark) => (
            <span
              key={mark.value}
              className="mx-slider-marks__item"
              data-active={mark.value === numValue ? "true" : undefined}
              style={{
                left: `${span > 0 ? ((mark.value - numMin) / span) * 100 : 0}%`,
              }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      ) : null}
      {hint ? <span className="mx-field__hint">{hint}</span> : null}
    </div>
  );
}
