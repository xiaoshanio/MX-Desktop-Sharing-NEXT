"use client";

import type { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  /** Optional trailing count, e.g. member total. */
  count?: number;
}

export interface TabsProps<T extends string> {
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the tab strip. */
  label: string;
}

/** Segmented control used for in-page sub-navigation (room detail panels). */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: TabsProps<T>): ReactNode {
  return (
    <div className="mx-tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          className="mx-tab"
          aria-selected={item.value === value}
          onClick={() => onChange(item.value)}
        >
          {item.icon ? <Icon name={item.icon} size={14} /> : null}
          {item.label}
          {item.count !== undefined ? (
            <span className="mx-tab__count">{item.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
