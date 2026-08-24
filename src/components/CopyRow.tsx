"use client";

import { useState } from "react";

/** 复制框。secret=true 时默认打码，点一下才显形。 */
export function CopyRow({ value, secret = false }: { value: string; secret?: boolean }) {
  const [revealed, setRevealed] = useState(!secret);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="copybox">
      <span className="mono">{revealed ? value : "•".repeat(Math.min(value.length, 40))}</span>
      {secret && (
        <button type="button" className="ghost" onClick={() => setRevealed((s) => !s)}>
          {revealed ? "隐藏" : "显示"}
        </button>
      )}
      <button type="button" className="ghost" onClick={copy}>
        {copied ? "已复制" : "复制"}
      </button>
    </div>
  );
}
