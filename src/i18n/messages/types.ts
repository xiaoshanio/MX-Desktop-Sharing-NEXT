/**
 * The shape every catalog has to satisfy.
 *
 * Derived from the English catalog with a type-only import so there is no runtime
 * dependency (and therefore no import cycle: ./index imports every catalog, and the
 * catalogs import only this file).
 *
 * Because `en` is a plain object literal — deliberately **not** `as const` — every value
 * widens to `string`, so `Messages` constrains the key set without pinning the text.
 */
export type Messages = typeof import("./en").default;

/** Every valid message key. `t()` only accepts these, so typos fail at compile time. */
export type MessageKey = keyof Messages;
