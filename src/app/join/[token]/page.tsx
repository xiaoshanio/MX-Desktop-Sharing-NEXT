"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api-client";

/**
 * 邀请落地页。未登录时先把人送去登录/注册，带上 next 参数再回来兑换。
 */
export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [state, setState] = useState<"working" | "error">("working");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 先看登录态；没登录就跳登录页，回来后自动重试
      const me = await api<{ user: unknown | null }>("/api/auth/me").catch(() => null);
      if (cancelled) return;

      if (!me?.user) {
        router.replace(`/login?next=/join/${encodeURIComponent(token)}`);
        return;
      }

      try {
        const { room } = await api<{ room: { code: string } }>(
          `/api/join/${encodeURIComponent(token)}`,
          { method: "POST" },
        );
        if (!cancelled) router.replace(`/room/${room.code}`);
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : String(e));
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="wrap" style={{ maxWidth: 480 }}>
      <div className="panel">
        {state === "working" ? (
          <>
            <h1>正在加入房间…</h1>
            <p className="muted">校验邀请链接。</p>
          </>
        ) : (
          <>
            <h1>无法加入</h1>
            <div className="err">{err}</div>
            <p className="muted" style={{ marginTop: 12 }}>
              链接可能已过期、被撤销，或使用次数已满。找房主重新发一个。
            </p>
            <a href="/dashboard">← 回控制台</a>
          </>
        )}
      </div>
    </div>
  );
}
