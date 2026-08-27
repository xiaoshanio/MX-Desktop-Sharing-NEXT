import { DEFAULT_LOCALE, type Locale } from "./config";
import { CATALOGS, FALLBACK_CATALOG, type MessageKey } from "./messages";

export type { MessageKey };

/** `{name}` placeholders. Numbers are stringified with the default locale-independent form. */
export type MessageVars = Record<string, string | number>;

export interface TFunction {
  /** Translate a known key. Unknown keys can't be passed — `MessageKey` is a closed union. */
  (key: MessageKey, vars?: MessageVars): string;
  /**
   * Translate a string that *might* be a key.
   *
   * Needed for values that travel across a boundary as data rather than as code:
   * API error messages (see lib/http.ts) and zod validation messages. Anything that
   * isn't in the catalog is returned as-is — that way a message this refactor missed
   * still shows the original text instead of a bare key.
   */
  raw(keyOrText: string, vars?: MessageVars): string;
  locale: Locale;
}

const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(template: string, vars: MessageVars | undefined): string {
  if (!vars) return template;
  return template.replace(PLACEHOLDER, (whole, name: string) => {
    const value = vars[name];
    return value === undefined ? whole : String(value);
  });
}

/**
 * Build the translator for one locale.
 *
 * Missing keys fall back to English rather than rendering the key: the type system
 * already guarantees completeness, so this only ever fires if a catalog is edited
 * by hand in a way that skips `npm run typecheck`.
 */
export function makeT(locale: Locale): TFunction {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];

  const t = ((key: MessageKey, vars?: MessageVars) =>
    interpolate(catalog[key] ?? FALLBACK_CATALOG[key] ?? key, vars)) as TFunction;

  t.raw = (keyOrText: string, vars?: MessageVars) => {
    const hit =
      (catalog as Record<string, string | undefined>)[keyOrText] ??
      (FALLBACK_CATALOG as Record<string, string | undefined>)[keyOrText];
    return interpolate(hit ?? keyOrText, vars);
  };

  t.locale = locale;

  return t;
}

/** One translator per locale, built lazily and reused — `makeT` is cheap but not free. */
const cache = new Map<Locale, TFunction>();

export function getT(locale: Locale): TFunction {
  let translator = cache.get(locale);
  if (!translator) {
    translator = makeT(locale);
    cache.set(locale, translator);
  }
  return translator;
}
