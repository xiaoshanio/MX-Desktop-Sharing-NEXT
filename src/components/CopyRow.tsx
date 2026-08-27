"use client";

import { useEffect, useState } from "react";

import { useT } from "@/i18n";
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
  const t = useT();
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

  /**
   * 按钮标签：有 label 时拼成「复制 Bearer Token」，没有就只说「复制」。
   *
   * 拼接放在语言包里（`common.copy` = "复制{label}"）而不是这里 —— 中文不加空格、
   * 英文要加、法语是 "Copier le {label}"，词序和空格都得由译文决定。
   */
  const reveal = label ? t("common.reveal", { label }) : t("common.revealPlain");
  const hide = label ? t("common.hide", { label }) : t("common.hidePlain");
  const copyLabel = label ? t("common.copy", { label }) : t("common.copyPlain");

  return (
    <div className="mx-copy">
      <span className="mx-copy__value" data-masked={!revealed ? "true" : undefined}>
        {revealed ? value : "•".repeat(Math.min(value.length, 44))}
      </span>
      {copied && <span className="mx-copy__copied">{t("common.copied")}</span>}
      {secret && (
        <IconButton
          size="sm"
          label={revealed ? hide : reveal}
          onClick={() => setRevealed((state) => !state)}
        >
          <Icon name={revealed ? "eyeOff" : "eye"} size={15} />
        </IconButton>
      )}
      <IconButton size="sm" label={copyLabel} onClick={() => void copy()}>
        <Icon name={copied ? "check" : "copy"} size={15} />
      </IconButton>
    </div>
  );
}
