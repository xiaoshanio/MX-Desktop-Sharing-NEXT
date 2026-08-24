"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api-client";

/** 只接受站内相对路径，防止 open redirect。 */
function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default function LoginPage() {
  // useSearchParams() 需要 Suspense 边界（Next 15）
  return (
    <Suspense fallback={<div className="wrap" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "login") {
        await api("/api/auth/login", { method: "POST", json: { email, password } });
      } else {
        await api("/api/auth/register", {
          method: "POST",
          json: { email, displayName, password },
        });
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <form className="panel" onSubmit={submit}>
        <h1>{mode === "login" ? "登录" : "注册"}</h1>

        <label>邮箱</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        {mode === "register" && (
          <>
            <label>显示名</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </>
        )}

        <label>密码</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err && <div className="err">{err}</div>}

        <div className="row" style={{ marginTop: 20 }}>
          <button type="submit" disabled={busy}>
            {busy ? "处理中…" : mode === "login" ? "登录" : "注册"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErr(null);
            }}
          >
            {mode === "login" ? "没有账号？注册" : "已有账号？登录"}
          </button>
        </div>
      </form>
    </div>
  );
}
