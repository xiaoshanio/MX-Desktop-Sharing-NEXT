"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { LOCALES, LOCALE_LABELS, useI18n } from "@/i18n";
import { Icon } from "@/ui";

export interface LanguageSwitcherProps {
  /** 菜单从哪一侧展开。顶栏靠右，所以默认右对齐。 */
  align?: "start" | "end";
  className?: string;
}

/**
 * 语言下拉。放在主题切换按钮的**左边**（外壳顶栏、首页顶栏各一份）。
 *
 * 用原生按钮 + 绝对定位菜单，而不是 <select>：<select> 的选项列表由操作系统绘制，
 * 没法跟着站点主题走，而这一处正好紧挨着主题开关，样式不一致会很显眼。
 *
 * 切换语言不刷新整页：Provider 里先换客户端 state（当场生效），再 router.refresh()
 * 让服务端组件（首页、metadata）用新 cookie 重渲染一次。
 */
export function LanguageSwitcher({
  align = "end",
  className,
}: LanguageSwitcherProps): ReactNode {
  const { locale, t, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={className ? `mx-lang ${className}` : "mx-lang"} ref={wrapRef}>
      <button
        type="button"
        className="mx-lang__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("lang.change")}
        title={t("lang.change")}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="globe" size={17} />
        <span className="mx-lang__current">{LOCALE_LABELS[locale]}</span>
        <Icon name="chevronDown" size={13} />
      </button>

      {open && (
        <div className="mx-menu mx-lang__menu" data-align={align} role="menu">
          <div className="mx-menu__head">
            <strong>{t("lang.label")}</strong>
          </div>
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              className="mx-menu__item"
              role="menuitemradio"
              aria-checked={option === locale}
              data-active={option === locale ? "true" : undefined}
              lang={option}
              onClick={() => {
                setOpen(false);
                if (option !== locale) setLocale(option);
              }}
            >
              <span className="mx-lang__check">
                {option === locale ? <Icon name="check" size={14} /> : null}
              </span>
              {LOCALE_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
