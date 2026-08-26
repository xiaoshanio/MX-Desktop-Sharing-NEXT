"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile 组件。
 *
 * 脚本按需加载一次（全站共享那一份），组件卸载时把 widget 销毁掉但**不卸载脚本** ——
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
      "error-callback"?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    // 已经在加载中 —— 等它那一次的结果，不要再插一个
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("加载失败")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("加载失败")), { once: true });
    document.head.appendChild(script);
  });
}

export interface TurnstileProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** 改变它会重画一个新 widget —— 提交失败后必须换一枚新 token。 */
  resetKey?: number;
}

export function Turnstile({ siteKey, onToken, resetKey = 0 }: TurnstileProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  // onToken 存进 ref：把它放进 effect 依赖会因为父组件每次渲染都传新函数而
  // 不停地重建 widget（表现是人机验证框一直在闪）。
  const callbackRef = useRef(onToken);
  useEffect(() => {
    callbackRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;

    setFailed(false);
    callbackRef.current(null);

    void loadScript()
      .then(() => {
        if (cancelled || !holderRef.current || !window.turnstile) return;
        holderRef.current.innerHTML = "";
        widgetId = window.turnstile.render(holderRef.current, {
          sitekey: siteKey,
          // 跟随站点主题：<html data-theme> 由引导脚本在首帧前盖好，这里读得到
          theme:
            document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
          language: "zh-cn",
          callback: (token) => callbackRef.current(token),
          // 过期和出错都要把 token 清掉，否则父组件会拿着一枚废 token 去提交
          "expired-callback": () => callbackRef.current(null),
          "error-callback": () => {
            callbackRef.current(null);
            setFailed(true);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

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
  }, [siteKey, resetKey]);

  return (
    <div className="mx-turnstile">
      <div ref={holderRef} />
      {failed && (
        <p className="mx-field__error">
          人机验证组件加载不出来。检查一下网络能不能访问 challenges.cloudflare.com。
        </p>
      )}
    </div>
  );
}
