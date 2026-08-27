/**
 * 站点支持的语言，以及「一个 BCP-47 标签该落到哪个语言」的归一化规则。
 *
 * 这个模块**零依赖**（不 import 任何本项目文件，也不碰 next/*），因为它同时被
 * 三种环境使用：服务端组件、路由处理器、以及浏览器里的客户端组件。
 */

/**
 * 支持的语言。**数组顺序就是下拉菜单里的顺序** —— 中文在前是刻意的，
 * 本项目的读者以中文用户为主，但兜底语言是英语（见 DEFAULT_LOCALE）。
 */
export const LOCALES = ["zh-CN", "zh-TW", "en", "fr", "ru", "ja", "vi"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * 一个标签都匹配不上时用哪个。
 *
 * 用英语而不是中文：匹配不上意味着访客的系统语言不在上面那七种里
 * （德语、西语、阿拉伯语……），对这些人英语是最可能读得懂的一种。
 * README 的默认语言也是英语，两处保持一致。
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * 语言偏好存在 cookie 里而不是 localStorage：服务端组件（首页、根 layout）要在
 * 渲染第一帧之前就知道用哪种语言，localStorage 读不到。cookie 两端都读得到，
 * 于是「服务端渲染出来的 HTML」和「客户端接手后的 state」天然一致，没有水合不匹配。
 */
export const LOCALE_COOKIE = "mxds.lang";

/** 一年。语言偏好属于「设一次就不用再管」的那类设置。 */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** 下拉菜单里显示的名字 —— 一律用该语言自己的写法，不要翻译语言名。 */
export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
  fr: "Français",
  ru: "Русский",
  ja: "日本語",
  vi: "Tiếng Việt",
};

/** `<html lang>` 用的值。和 locale 本身一致，单独抽出来是为了以后能分开演进。 */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  en: "en",
  fr: "fr",
  ru: "ru",
  ja: "ja",
  vi: "vi",
};

/** Cloudflare Turnstile 的 language 参数用的码，和我们的 locale 不完全同名。 */
export const LOCALE_TURNSTILE: Record<Locale, string> = {
  "zh-CN": "zh-cn",
  "zh-TW": "zh-tw",
  en: "en",
  fr: "fr",
  ru: "ru",
  ja: "ja",
  vi: "vi",
};

const LOCALE_SET = new Set<string>(LOCALES);

/**
 * 一个 BCP-47 标签 → 我们支持的语言。认不出来返回 null。
 *
 * 中文那两条是这里唯一有难度的部分：浏览器发过来的可能是 `zh`、`zh-CN`、`zh-Hans`、
 * `zh-Hans-CN`、`zh-TW`、`zh-Hant-HK`、`zh-MO`…… 按「简/繁」而不是按国家分：
 * 香港和澳门用的是繁体，新加坡用的是简体，只看国家代码会分错。
 */
export function normalizeLocale(raw: string | null | undefined): Locale | null {
  if (!raw) return null;

  const tag = raw.trim().replace(/_/g, "-");
  if (tag === "") return null;

  // 先试完全匹配（大小写不敏感 —— cookie 里可能被别的工具改过大小写）
  for (const locale of LOCALES) {
    if (locale.toLowerCase() === tag.toLowerCase()) return locale;
  }

  const lower = tag.toLowerCase();
  const primary = lower.split("-")[0] ?? "";

  if (primary === "zh") {
    // 有 script 子标签时以它为准，它比地区码更明确
    if (lower.includes("hant")) return "zh-TW";
    if (lower.includes("hans")) return "zh-CN";
    // 只有地区码：港澳台是繁体，其余（CN / SG / 无地区）按简体
    if (/-(tw|hk|mo)\b/.test(lower)) return "zh-TW";
    return "zh-CN";
  }

  // `jp` 是 ISO 国家码不是语言码，但被写错的频率高到值得收下
  if (primary === "jp") return "ja";

  return LOCALE_SET.has(primary) ? (primary as Locale) : null;
}

/**
 * 按顺序试一串候选标签，返回第一个认得出来的。
 * 用于 `navigator.languages` 和 `Accept-Language`。
 */
export function pickLocale(candidates: Iterable<string>): Locale | null {
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return null;
}

/**
 * 解析 `Accept-Language`，按 q 值从高到低返回标签。
 *
 * 这就是「跟随系统语言」的实现方式：浏览器把用户在操作系统 / 浏览器里设的语言顺序
 * 放进这个头，我们照着挑第一个支持的。不需要在客户端读 navigator，
 * 服务端第一帧就能出对的语言。
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];

  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((param) => /^\s*q\s*=\s*([\d.]+)\s*$/i.exec(param))
        .find((match) => match !== null);
      return { tag: (tag ?? "").trim(), q: q ? Number(q[1]) : 1 };
    })
    .filter((entry) => entry.tag !== "" && entry.tag !== "*" && Number.isFinite(entry.q))
    // sort 必须稳定才能保证同 q 值时保留原顺序 —— ES2019 起规范保证了这一点
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}

/**
 * 最终的语言判定：用户显式选过的（cookie）优先，否则跟随系统（Accept-Language），
 * 再否则兜底。三层顺序在服务端组件和路由处理器里必须一致，所以收在这一个函数里。
 */
export function resolveLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  return (
    normalizeLocale(cookieValue) ??
    pickLocale(parseAcceptLanguage(acceptLanguage)) ??
    DEFAULT_LOCALE
  );
}

/** `document.cookie` 里挖出语言偏好。客户端切换语言时用来判断要不要写。 */
export function readLocaleCookie(cookieHeader: string): Locale | null {
  const match = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`).exec(cookieHeader);
  return match ? normalizeLocale(decodeURIComponent(match[1] ?? "")) : null;
}
