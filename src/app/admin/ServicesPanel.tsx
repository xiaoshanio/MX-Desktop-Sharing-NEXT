"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
import { RichText, useT, type MessageKey, type TFunction } from "@/i18n";
import { APP_NAME } from "@/lib/brand";
import { humanizeError } from "@/lib/error-text";
import { toast } from "@/lib/toast";
import type { ServiceRow } from "@/lib/api-types";
import { CopyRow } from "@/components/CopyRow";
import {
  Badge,
  Banner,
  Button,
  Card,
  ConfirmDialog,
  Icon,
  PageLoader,
  Switch,
  TextField,
} from "@/ui";

type ServiceKey = "github" | "google" | "turnstile" | "resend";

/**
 * 每种服务要填的两个字段各叫什么、去哪儿拿。
 *
 * 抽成一张表而不是写四段几乎一样的表单：它们的形状完全一致
 * （一个可公开的标识 + 一个必须加密的密钥），差别只有文案。
 * 表里存的是**消息键**，实际文案在语言包里 —— 四种服务 × 六段文案 × 七种语言
 * 写进组件会彻底不可读。
 */
const SERVICE_FORMS: Record<
  ServiceKey,
  {
    title: MessageKey;
    description: MessageKey;
    publicLabel: MessageKey;
    publicHint: MessageKey;
    secretLabel: MessageKey;
    secretHint: MessageKey;
    icon: "github" | "google" | "shield" | "mail";
  }
> = {
  github: {
    title: "svc.github.title",
    description: "svc.github.desc",
    publicLabel: "svc.github.publicLabel",
    publicHint: "svc.github.publicHint",
    secretLabel: "svc.github.secretLabel",
    secretHint: "svc.github.secretHint",
    icon: "github",
  },
  google: {
    title: "svc.google.title",
    description: "svc.google.desc",
    publicLabel: "svc.google.publicLabel",
    publicHint: "svc.google.publicHint",
    secretLabel: "svc.google.secretLabel",
    secretHint: "svc.google.secretHint",
    icon: "google",
  },
  turnstile: {
    title: "svc.turnstile.title",
    description: "svc.turnstile.desc",
    publicLabel: "svc.turnstile.publicLabel",
    publicHint: "svc.turnstile.publicHint",
    secretLabel: "svc.turnstile.secretLabel",
    secretHint: "svc.turnstile.secretHint",
    icon: "shield",
  },
  resend: {
    title: "svc.resend.title",
    description: "svc.resend.desc",
    publicLabel: "svc.resend.publicLabel",
    publicHint: "svc.resend.publicHint",
    secretLabel: "svc.resend.secretLabel",
    secretHint: "svc.resend.secretHint",
    icon: "mail",
  },
};

const SERVICE_ORDER: ServiceKey[] = ["github", "google", "turnstile", "resend"];

/** 管理后台的「第三方服务」分区。 */
export function ServicesPanel() {
  const t = useT();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [callbacks, setCallbacks] = useState<{ github: string; google: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{
        services: ServiceRow[];
        callbacks: { github: string; google: string };
      }>("/api/admin/services");
      setServices(res.services);
      setCallbacks(res.callbacks);
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const byService = new Map(services.map((row) => [row.service, row]));

  return (
    <>
      <Banner tone="info" title={t("svc.bannerTitle")}>
        <RichText text={t("svc.bannerBody")} />
      </Banner>

      {loading ? (
        <PageLoader>{t("svc.loading")}</PageLoader>
      ) : (
        SERVICE_ORDER.map((service) => (
          <ServiceForm
            key={service}
            service={service}
            current={byService.get(service)}
            callbackUrl={
              service === "github" || service === "google" ? callbacks?.[service] : undefined
            }
            onSaved={(rows, message) => {
              setServices(rows);
              toast.success(message);
            }}
          />
        ))
      )}
    </>
  );
}

function ServiceForm({
  service,
  current,
  callbackUrl,
  onSaved,
}: {
  service: ServiceKey;
  current: ServiceRow | undefined;
  callbackUrl: string | undefined;
  onSaved: (rows: ServiceRow[], message: string) => void;
}) {
  const t = useT();
  const form = SERVICE_FORMS[service];
  const title = t(form.title);

  const [publicValue, setPublicValue] = useState(current?.publicValue ?? "");
  const [secret, setSecret] = useState("");
  const [fromName, setFromName] = useState(current?.meta.fromName ?? "");
  const [isEnabled, setIsEnabled] = useState(current?.isEnabled ?? true);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);

  const configured = current !== undefined;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ services: ServiceRow[] }>("/api/admin/services", {
        method: "PUT",
        json: {
          service,
          publicValue,
          // 留空表示「不改密钥」，服务端会保留库里那一份
          secret: secret.trim() === "" ? undefined : secret,
          isEnabled,
          fromName: service === "resend" && fromName.trim() !== "" ? fromName : undefined,
        },
      });
      setSecret("");
      onSaved(res.services, t("svc.savedToast", { title }));
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await api<{ services: ServiceRow[] }>(`/api/admin/services?service=${service}`, {
        method: "DELETE",
      });
      setPublicValue("");
      setSecret("");
      setRemoving(false);
      onSaved(res.services, t("svc.removedToast", { title }));
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title={
        <span className="mx-inline">
          <Icon name={form.icon} size={16} />
          {title}
        </span>
      }
      description={t(form.description)}
      actions={
        !configured ? (
          <Badge tone="neutral">{t("svc.notConfigured")}</Badge>
        ) : current.isEnabled ? (
          <Badge tone="success" dot>
            {t("svc.enabled")}
          </Badge>
        ) : (
          <Badge tone="neutral">{t("svc.disabled")}</Badge>
        )
      }
    >
      {callbackUrl && (
        <div className="mx-field">
          <span className="mx-field__label">{t("svc.callbackLabel")}</span>
          <CopyRow value={callbackUrl} label={t("svc.callbackShort")} />
          <span className="mx-field__hint">{t("svc.callbackHint")}</span>
        </div>
      )}

      <form className="mx-form" onSubmit={submit}>
        <TextField
          label={t(form.publicLabel)}
          hint={t(form.publicHint)}
          required
          value={publicValue}
          onChange={(event) => setPublicValue(event.target.value)}
        />

        <TextField
          label={t(form.secretLabel)}
          type="password"
          hint={
            configured
              ? t("svc.secretCurrent", {
                  hint: t(form.secretHint),
                  // 掩码通常是真实字符串（"re_xx…xx"），但密文解不开时服务端会回一个
                  // 消息键 —— t.raw 认得出来就翻，认不出来原样显示
                  mask: t.raw(current.secretMask),
                })
              : t(form.secretHint)
          }
          required={!configured}
          autoComplete="new-password"
          placeholder={configured ? t("svc.secretKeepPlaceholder") : ""}
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />

        {service === "resend" && (
          <TextField
            label={t("svc.fromName")}
            hint={t("svc.fromNameHint", { app: APP_NAME })}
            value={fromName}
            onChange={(event) => setFromName(event.target.value)}
          />
        )}

        <Switch
          checked={isEnabled}
          label={t("svc.enableLabel")}
          hint={enableHint(t, service)}
          onChange={(event) => setIsEnabled(event.target.checked)}
        />

        <div className="mx-card__actions">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? t("common.saving") : configured ? t("svc.saveChanges") : t("common.save")}
          </Button>
          {configured && (
            <Button
              type="button"
              variant="danger"
              disabled={busy}
              onClick={() => setRemoving(true)}
            >
              <Icon name="trash" size={15} />
              {t("svc.removeConfig")}
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={removing}
        danger
        busy={busy}
        title={t("svc.removeTitle", { title })}
        confirmLabel={t("common.delete")}
        body={removeBody(t, service)}
        onConfirm={() => void remove()}
        onClose={() => setRemoving(false)}
      />
    </Card>
  );
}

function enableHint(t: TFunction, service: ServiceKey): string {
  if (service === "turnstile") return t("svc.enableHintTurnstile");
  if (service === "resend") return t("svc.enableHintResend");
  return t("svc.enableHintOauth");
}

function removeBody(t: TFunction, service: ServiceKey): string {
  if (service === "turnstile") return t("svc.removeBodyTurnstile");
  if (service === "resend") return t("svc.removeBodyResend");
  return t("svc.removeBodyOauth");
}
