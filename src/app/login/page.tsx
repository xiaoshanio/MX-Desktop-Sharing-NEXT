"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api-client";
import { BrandMark } from "@/components/BrandMark";
import { Banner, Button, TextField } from "@/ui";

/** 只接受站内相对路径，防止 open redirect。 */
function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default function LoginPage() {
  // useSearchParams() needs a Suspense boundary in Next 15.
  return (
    <Suspense fallback={<div className="mx-auth" />}>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const registering = mode === "register";

  function switchMode(target: "login" | "register") {
    setMode(target);
    setErr(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (registering) {
        await api("/api/auth/register", {
          method: "POST",
          json: { email, displayName, password },
        });
      } else {
        await api("/api/auth/login", { method: "POST", json: { email, password } });
      }
      router.push(next);
      router.refresh();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auth">
      <div className="mx-auth__inner">
        <div className="mx-auth__brand">
          <BrandMark size={64} className="mx-auth__mark" />
          <h1 className="mx-auth__title">MX 桌面共享</h1>
          <p className="mx-auth__subtitle">
            一房一节点，一人一推流地址。用 OBS 或浏览器直接把屏幕推给房间里的人。
          </p>
        </div>

        <form className="mx-auth__panel" onSubmit={submit}>
          <div className="mx-auth__switcher" role="tablist" aria-label="登录或注册">
            <button
              type="button"
              role="tab"
              className="mx-auth__switch"
              aria-selected={!registering}
              onClick={() => switchMode("login")}
            >
              登录
            </button>
            <button
              type="button"
              role="tab"
              className="mx-auth__switch"
              aria-selected={registering}
              onClick={() => switchMode("register")}
            >
              注册
            </button>
          </div>

          <div className="mx-form">
            <TextField
              label="邮箱"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            {registering && (
              <TextField
                label="显示名"
                type="text"
                required
                autoComplete="nickname"
                hint="房间成员列表里显示的名字。"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            )}

            <TextField
              label="密码"
              type="password"
              required
              autoComplete={registering ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {err && <Banner tone="error">{err}</Banner>}

            <Button type="submit" variant="primary" size="lg" full disabled={busy}>
              {busy ? "处理中…" : registering ? "注册并进入" : "登录"}
            </Button>
          </div>
        </form>

        <p className="mx-auth__footnote">
          {registering
            ? "注册即拥有自己的工作区，可接入你自己的 LiveKit 节点。"
            : "收到邀请链接的话，直接打开链接登录就会自动入房。"}
        </p>
      </div>
    </div>
  );
}
