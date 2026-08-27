import type { Locale } from "../config";
import type { Messages } from "./types";

import en from "./en";
import zhCN from "./zh-CN";
import zhTW from "./zh-TW";
import fr from "./fr";
import ru from "./ru";
import ja from "./ja";
import vi from "./vi";

/**
 * locale → catalog.
 *
 * All seven are imported eagerly and end up in the same bundle. That is a deliberate
 * trade: the catalogs are plain string maps (tens of KB gzipped for all of them), and
 * lazy-loading per locale would mean the first paint after a language switch has no
 * text at all. Switching language here is instant.
 */
export const CATALOGS: Record<Locale, Messages> = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  en,
  fr,
  ru,
  ja,
  vi,
};

export { en as FALLBACK_CATALOG };
export type { Messages, MessageKey } from "./types";
