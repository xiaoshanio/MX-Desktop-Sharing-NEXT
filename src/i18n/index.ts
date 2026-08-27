/**
 * 客户端安全的 i18n 出口。
 *
 * `./server` 不在这里再导出一次 —— 它 import 了 `next/headers`，被客户端组件
 * 顺着这个 barrel 拉进去会直接构建失败。服务端组件请显式 `from "@/i18n/server"`。
 */

export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HTML_LANG,
  LOCALE_LABELS,
  LOCALE_TURNSTILE,
  normalizeLocale,
  parseAcceptLanguage,
  pickLocale,
  readLocaleCookie,
  resolveLocale,
  type Locale,
} from "./config";

export { I18nProvider, useI18n, useLocale, useT } from "./Provider";
export { RichText } from "./RichText";
export { getT, makeT, type MessageKey, type MessageVars, type TFunction } from "./translate";
