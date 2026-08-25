"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cx } from "./cx";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Small explanatory line under the input. */
  hint?: ReactNode;
  /** Replaces the hint with an error message when set. */
  error?: string | null;
  /** Renders the value in the monospace face — for URLs, keys, codes. */
  mono?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, mono, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="mx-field">
      {label ? (
        <label className="mx-field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cx("mx-input", className)}
        data-mono={mono ? "true" : undefined}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? (
        <span className="mx-field__error">{error}</span>
      ) : hint ? (
        <span className="mx-field__hint">{hint}</span>
      ) : null}
    </div>
  );
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: ReactNode;
}

export function TextArea({ label, hint, id, className, ...props }: TextAreaProps): ReactNode {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="mx-field">
      {label ? (
        <label className="mx-field__label" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <textarea id={fieldId} className={cx("mx-input", className)} {...props} />
      {hint ? <span className="mx-field__hint">{hint}</span> : null}
    </div>
  );
}
