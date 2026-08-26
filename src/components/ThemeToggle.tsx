"use client";

import { useEffect, useState, type ReactNode } from "react";

import { DEFAULT_THEME, applyTheme, readStoredTheme, type Theme } from "@/lib/theme";
import { Icon, IconButton, type ButtonSize } from "@/ui";

export interface ThemeToggleProps {
  size?: ButtonSize;
}

/**
 * 浅色 / 深色开关。外壳和首页各有一份顶栏，所以抽成组件。
 *
 * 真相来源是 `<html data-theme>` —— 首帧之前由 lib/theme.ts 的引导脚本盖好。这里的
 * state 只负责「让图标跟上」，初值必须是 `DEFAULT_THEME` 而不是读 localStorage：
 * 服务端渲染读不到，一读就 hydration 不匹配。
 */
export function ThemeToggle({ size }: ThemeToggleProps): ReactNode {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  return (
    <IconButton
      size={size}
      label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
      onClick={() =>
        setTheme((previous) => {
          const next: Theme = previous === "dark" ? "light" : "dark";
          applyTheme(next);
          return next;
        })
      }
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </IconButton>
  );
}
