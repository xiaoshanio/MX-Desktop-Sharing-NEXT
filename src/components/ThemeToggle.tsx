"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useT } from "@/i18n";
import {
  DEFAULT_THEME_PREFERENCE,
  applyThemePreference,
  nextThemePreference,
  readStoredThemePreference,
  resolveTheme,
  watchSystemTheme,
  type ThemePreference,
} from "@/lib/theme";
import { Icon, IconButton, type ButtonSize, type IconName } from "@/ui";

export interface ThemeToggleProps {
  size?: ButtonSize;
}

const ICON: Record<ThemePreference, IconName> = {
  system: "monitor",
  light: "sun",
  dark: "moon",
};

/**
 * 主题开关：跟随系统 → 浅色 → 深色 → 跟随系统。外壳和首页各有一份顶栏，所以抽成组件。
 *
 * 真相来源是 `<html data-theme-pref>` —— 首帧之前由 lib/theme.ts 的引导脚本盖好。这里的
 * state 只负责「让图标跟上」，初值必须是 `DEFAULT_THEME_PREFERENCE` 而不是读 localStorage：
 * 服务端渲染读不到，一读就 hydration 不匹配。
 */
export function ThemeToggle({ size }: ThemeToggleProps): ReactNode {
  const t = useT();
  const [preference, setPreference] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);

  useEffect(() => {
    setPreference(readStoredThemePreference());
  }, []);

  /**
   * 「跟随系统」时监听系统深浅色变化并当场套用。
   *
   * 引导脚本只在整页加载时算一次，用户在系统设置里切主题时页面不会重新加载 ——
   * 没有这一条的话「跟随系统」只在刷新后才跟上，看着像坏的。
   */
  useEffect(() => {
    if (preference !== "system") return;
    return watchSystemTheme((theme) => {
      document.documentElement.setAttribute("data-theme", theme);
    });
  }, [preference]);

  // 按钮说的是「点下去会变成什么」，而不是「现在是什么」—— 一次点击到底做什么必须写清楚
  const label =
    preference === "system"
      ? t("theme.nextLight")
      : preference === "light"
        ? t("theme.nextDark")
        : t("theme.nextSystem");

  return (
    <IconButton
      size={size}
      label={label}
      onClick={() =>
        setPreference((previous) => {
          const next = nextThemePreference(previous);
          applyThemePreference(next);
          return next;
        })
      }
    >
      <Icon name={ICON[preference]} size={18} />
    </IconButton>
  );
}

/** 当前生效的主题（已把「跟随系统」解析成具体颜色）。Turnstile 要按它选主题。 */
export function useResolvedTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const sync = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      setTheme(attr === "light" ? "light" : attr === "dark" ? "dark" : resolveTheme("system"));
    };
    sync();
    return watchSystemTheme(sync);
  }, []);

  return theme;
}
