"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

import { cx } from "./cx";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  hint?: ReactNode;
}

export function Select({
  label,
  options,
  placeholder,
  hint,
  id,
  className,
  ...props
}: SelectProps): ReactNode {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="mx-field">
      {label ? (
        <label className="mx-field__label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <select id={selectId} className={cx("mx-select", className)} {...props}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className="mx-field__hint">{hint}</span> : null}
    </div>
  );
}
