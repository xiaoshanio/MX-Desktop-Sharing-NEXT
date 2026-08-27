"use client";

import { useEffect, useRef, useState } from "react";

import { LOCALE_TURNSTILE, useI18n, type TFunction } from "@/i18n";

/**
 * Cloudflare Turnstile 组件。
 *
 * 脚本按需加载一次（全站共享那一份），组件卸载时销毁 widget 但**不卸载脚本** ——
 * 在登录/注册两个标签之间来回切时反复插拔 script 标签会让 Cloudflare 侧计数错乱。
 *
 * `onToken` 拿到的 token 只能用一次、5 分钟内有效。所以每次提交失败之后必须
 * reset 重新要一枚，否则第二次提交会被服务端判成 timeout-or-duplicate。
 * 这个由父组件通过改变 `resetKey` 触发。
 */

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      language?: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: (code?: string) => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Cloudflare 的错误码 → 能照着做的一句话。
 *
 * 这一层是必要的：`error-callback` 只给一个像 `110200` 的数字，而这些码几乎全都
 * 指向**配置**问题，不是网络问题。之前所有失败都提示「检查网络」，
 * 结果是配错域名的人一直在查网络（而 challenges.cloudflare.com 本来是通的）。
 *
 * 码表见 Cloudflare 文档的 Client-side errors 一节。
 */
function explainCode(t: TFunction, code: string | undefined, hostname: string): string {
  const value = code ?? "";

  if (value.startsWith("110200")) return t("turnstile.badDomain", { code: value, hostname });
  if (value.startsWith("1101") || value.startsWith("110100") || value.startsWith("110110")) {
    return t("turnstile.badKey", { code: value });
  }
  if (value.startsWith("110500")) return t("turnstile.badBrowser", { code: value });
  if (value.startsWith("110600")) return t("turnstile.timeout", { code: value });
  if (value.startsWith("300") || value.startsWith("600")) {
    return t("turnstile.execFailed", { code: value });
  }
  if (value.startsWith("105")) return t("turnstile.staleScript", { code: value });

  return value === ""
    ? t("turnstile.initFailed")
    : t("turnstile.initFailedCode", { code: value });
}

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    // 已经在加载中 —— 等它那一次的结果，不要再插一个
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("blocked")), { once: true });
      // 万一 load 事件已经错过了（脚本先前就加载完了），下面的轮询会兜住
      setTimeout(resolve, 3000);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("blocked")), { once: true });
    document.head.appendChild(script);
  });
}

/**
 * 等 `window.turnstile` 真的出现。
 *
 * script 的 load 事件和「api.js 把 window.turnstile 挂上去」之间有个很短的窗口。
 * 原来的写法在这个窗口里会直接 return，结果既没有 widget 也没有报错 ——
 * 页面上就是一片空白，最难排查的那种失败。
 */
async function waitForApi(timeoutMs = 8000): Promise<TurnstileApi | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (window.turnstile) return window.turnstile;
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  return window.turnstile ?? null;
}

export interface TurnstileProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** 改变它会重画一个新 widget —— 提交失败后必须换一枚新 token。 */
  resetKey?: number;
}

export function Turnstile({ siteKey, onToken, resetKey = 0 }: TurnstileProps) {
  const { locale, t } = useI18n();
  const holderRef = useRef<HTMLDivElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // onToken 存进 ref：把它放进 effect 依赖会因为父组件每次渲染都传新函数而
  // 不停地重建 widget（表现是人机验证框一直在闪）。
  const callbackRef = useRef(onToken);
  useEffect(() => {
    callbackRef.current = onToken;
  }, [onToken]);

  // t 同理：makeT 每个语言只建一次，但放进依赖仍然会在语言不变时被 React 拿去比较，
  // 而我们只想在 locale 真的变了的时候重画 widget（那才需要换 language 参数）。
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;

    setProblem(null);
    callbackRef.current(null);

    const hostname = window.location.hostname;

    void (async () => {
      try {
        await loadScript();
      } catch {
        if (!cancelled) {
          // 只有这一条才是真的网络/拦截问题
          setProblem(tRef.current("turnstile.blocked"));
        }
        return;
      }

      const api = await waitForApi();
      if (cancelled) return;

      if (!api) {
        setProblem(tRef.current("turnstile.noInit"));
        return;
      }
      if (!holderRef.current) return;

      holderRef.current.innerHTML = "";
      try {
        widgetId = api.render(holderRef.current, {
          sitekey: siteKey,
          // 跟随站点主题：<html data-theme> 由引导脚本在首帧前盖好，这里读得到
          theme:
            document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
          // 跟随站点语言 —— 验证框里的文字不能和它上下的表单是两种语言
          language: LOCALE_TURNSTILE[locale],
          callback: (token) => callbackRef.current(token),
          // 过期和出错都要把 token 清掉，否则父组件会拿着一枚废 token 去提交
          "expired-callback": () => callbackRef.current(null),
          "error-callback": (code) => {
            callbackRef.current(null);
            setProblem(explainCode(tRef.current, code, hostname));
          },
        });
      } catch (error) {
        setProblem(
          tRef.current("turnstile.renderFailed", {
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    })();

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* 已经被移除了 */
        }
      }
    };
  }, [siteKey, resetKey, locale]);

  return (
    <div className="mx-turnstile">
      <div ref={holderRef} />
      {problem && <p className="mx-field__error">{problem}</p>}
    </div>
  );
}
