"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api-client";
import { useT } from "@/i18n";
import { COPYRIGHT } from "@/lib/brand";
import { humanizeError } from "@/lib/error-text";
import { toast } from "@/lib/toast";
import { BrandMark } from "@/components/BrandMark";
import { Icon, LinkButton, Spinner } from "@/ui";

/**
 * 邀请落地页。未登录时先把人送去登录/注册，带上 next 参数再回来兑换。
 */
export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const t = useT();
  const router = useRouter();
  const [state, setState] = useState<"working" | "error">("working");

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
      } catch (error) {
        if (cancelled) return;
        toast.error(humanizeError(t, error));
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router, t]);

  return (
    <div className="mx-auth">
      <div className="mx-auth__inner">
        <div className="mx-auth__brand">
          <BrandMark size={64} className="mx-auth__mark" />
          <h1 className="mx-auth__title">
            {state === "working" ? t("join.working") : t("join.failed")}
          </h1>
          <p className="mx-auth__subtitle">
            {state === "working" ? t("join.workingBody") : t("join.failedBody")}
          </p>
        </div>

        <div className="mx-auth__panel">
          {state === "working" ? (
            <div
              className="mx-inline"
              style={{ justifyContent: "center", padding: "var(--mx-space-lg) 0" }}
            >
              <Spinner size={18} />
              <span className="mx-text-caption">{t("join.checking")}</span>
            </div>
          ) : (
            <>
              <p className="mx-text-caption">{t("join.failedHint")}</p>
              <LinkButton href="/dashboard" variant="primary" full>
                <Icon name="rooms" size={16} />
                {t("join.backToConsole")}
              </LinkButton>
            </>
          )}
        </div>

        <p className="mx-auth__copyright">{COPYRIGHT}</p>
      </div>
    </div>
  );
}
