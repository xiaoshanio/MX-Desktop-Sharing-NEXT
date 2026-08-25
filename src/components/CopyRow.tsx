"use client";

import { useEffect, useState } from "react";

import { Icon, IconButton } from "@/ui";

/**
 * A read-only value with copy (and optional reveal) affordances. `secret` values start masked
 * so stream keys aren't sitting in plain sight on a shared screen.
 */
export function CopyRow({
  value,
  secret = false,
  label,
}: {
  value: string;
  secret?: boolean;
  /** Accessible description, e.g. "Bearer Token" — folded into the button labels. */
  label?: string;
}) {
  const [revealed, setRevealed] = useState(!secret);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard is blocked (insecure origin / denied permission). Selecting the text still
      // works, so leave the row untouched rather than claiming success.
      setCopied(false);
    }
  }

  const suffix = label ? ` ${label}` : "";

  return (
    <div className="mx-copy">
      <span className="mx-copy__value" data-masked={!revealed ? "true" : undefined}>
        {revealed ? value : "•".repeat(Math.min(value.length, 44))}
      </span>
      {copied && <span className="mx-copy__copied">已复制</span>}
      {secret && (
        <IconButton
          size="sm"
          label={revealed ? `隐藏${suffix}` : `显示${suffix}`}
          onClick={() => setRevealed((state) => !state)}
        >
          <Icon name={revealed ? "eyeOff" : "eye"} size={15} />
        </IconButton>
      )}
      <IconButton size="sm" label={`复制${suffix}`} onClick={() => void copy()}>
        <Icon name={copied ? "check" : "copy"} size={15} />
      </IconButton>
    </div>
  );
}
