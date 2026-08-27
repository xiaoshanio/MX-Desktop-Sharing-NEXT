"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HTML_LANG,
  type Locale,
} from "./config";
import { getT, type TFunction } from "./translate";

interface I18nValue {
  locale: Locale;
  t: TFunction;
  setLocale: (next: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * 语言上下文。
 *
 * `locale` 由**服务端**算好（cookie → Accept-Language → 兜底，见 ./server），作为 prop
 * 传进来。这样服务端渲染出的 HTML 和客户端接手后的第一帧用的是同一种语言，不会水合不匹配 ——
 * 如果在这里读 navigator.language，服务端就猜不到它，每次首屏都会闪一下另一种语言。
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}): ReactNode {
  const router = useRouter();
  const [current, setCurrent] = useState<Locale>(locale);

  /**
   * 服务端换语言后（router.refresh() 之后）prop 会变，这里跟上。
   *
   * 同时也覆盖「用户在另一个标签页切了语言，这个标签页软导航后拿到新 cookie」这种情况。
   */
  useEffect(() => {
    setCurrent(locale);
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      // 先写 cookie：router.refresh() 会重新请求服务端组件，那一次必须已经带上新语言
      document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
      document.documentElement.lang = LOCALE_HTML_LANG[next] ?? next;
      // 客户端组件立刻换（不用等服务端往返），服务端组件靠 refresh 补上
      setCurrent(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale: current, t: getT(current), setLocale }),
    [current, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * 读语言上下文。
 *
 * Provider 不在时退化成兜底语言而不是抛错：这个 hook 被 UI 原语（Modal、Spinner…）使用，
 * 而它们也可能在测试或 Storybook 那种没有 Provider 的环境里渲染 —— 为了一句按钮文案
 * 让整棵树崩掉不划算。
 */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (value) return value;
  return {
    locale: DEFAULT_LOCALE,
    t: getT(DEFAULT_LOCALE),
    setLocale: () => {
      /* 没有 Provider 时无处可写，静默 */
    },
  };
}

/** 只要 `t` 的简写 —— 绝大多数组件只用这一个。 */
export function useT(): TFunction {
  return useI18n().t;
}

export function useLocale(): Locale {
  return useI18n().locale;
}
