"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
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
 */
const SERVICE_FORMS: Record<
  ServiceKey,
  {
    title: string;
    description: string;
    publicLabel: string;
    publicHint: string;
    secretLabel: string;
    secretHint: string;
    icon: "github" | "google" | "shield" | "mail";
  }
> = {
  github: {
    title: "GitHub 登录",
    description: "GitHub → Settings → Developer settings → OAuth Apps → New OAuth App。",
    publicLabel: "Client ID",
    publicHint: "OAuth App 页面上的 Client ID。",
    secretLabel: "Client Secret",
    secretHint: "只在生成时显示一次，之后 GitHub 自己也看不到 —— 存好再离开那个页面。",
    icon: "github",
  },
  google: {
    title: "Google 登录",
    description: "Google Cloud Console → API 和服务 → 凭据 → 创建 OAuth 客户端 ID（Web 应用）。",
    publicLabel: "Client ID",
    publicHint: "形如 xxxxx.apps.googleusercontent.com。",
    secretLabel: "Client Secret",
    secretHint: "凭据详情页里的客户端密钥。",
    icon: "google",
  },
  turnstile: {
    title: "Turnstile 人机验证",
    description:
      "Cloudflare 控制台 → Turnstile → 添加站点。配上之后登录、注册、发验证码三处都会要求验证。",
    publicLabel: "Site Key",
    publicHint: "会出现在登录页的 HTML 里，本身是公开的。",
    secretLabel: "Secret Key",
    secretHint: "服务端校验用，绝不能出现在前端。",
    icon: "shield",
  },
  resend: {
    title: "Resend 邮件服务",
    description:
      "resend.com → API Keys。发件域名必须在 Resend 里验证过，否则发信会被拒。配上之后登录页才会出现「邮箱验证码」。",
    publicLabel: "发件地址",
    publicHint: "必须属于已在 Resend 验证过的域名，例如 no-reply@your-domain.com。",
    secretLabel: "API Key",
    secretHint: "形如 re_xxxxxxxx。",
    icon: "mail",
  },
};

const SERVICE_ORDER: ServiceKey[] = ["github", "google", "turnstile", "resend"];

/** 管理后台的「第三方服务」分区。 */
export function ServicesPanel() {
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
      toast.error(humanizeError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byService = new Map(services.map((row) => [row.service, row]));

  return (
    <>

      <Banner tone="info" title="密钥加密后存在数据库里，不走环境变量">
        这些密钥用 AES-256-GCM 加密后写进 <code>service_credentials</code>，主密钥可以放在库外
        （<code>CREDENTIAL_ENCRYPTION_KEY</code>）—— 拿到整个数据库 dump 也解不开。
        任何接口都不回传密钥明文，下面显示的是掩码。改完立刻生效，不用重新部署。
      </Banner>

      {loading ? (
        <PageLoader>正在加载第三方服务配置…</PageLoader>
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
  const form = SERVICE_FORMS[service];

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
      onSaved(res.services, `${form.title}已保存。`);
    } catch (error) {
      toast.error(humanizeError(error));
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
      onSaved(res.services, `${form.title}已删除。`);
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title={
        <span className="mx-inline">
          <Icon name={form.icon} size={16} />
          {form.title}
        </span>
      }
      description={form.description}
      actions={
        !configured ? (
          <Badge tone="neutral">未配置</Badge>
        ) : current.isEnabled ? (
          <Badge tone="success" dot>
            已启用
          </Badge>
        ) : (
          <Badge tone="neutral">已停用</Badge>
        )
      }
    >
      {callbackUrl && (
        <div className="mx-field">
          <span className="mx-field__label">回调地址（一字不差地填到对方控制台）</span>
          <CopyRow value={callbackUrl} label="回调地址" />
          <span className="mx-field__hint">
            填错这一项是接第三方登录最常见的失败原因 —— 对方会直接拒绝授权请求。
          </span>
        </div>
      )}

      <form className="mx-form" onSubmit={submit}>
        <TextField
          label={form.publicLabel}
          hint={form.publicHint}
          required
          value={publicValue}
          onChange={(event) => setPublicValue(event.target.value)}
        />

        <TextField
          label={form.secretLabel}
          type="password"
          hint={
            configured
              ? `${form.secretHint} 当前：${current.secretMask}。留空表示不修改。`
              : form.secretHint
          }
          required={!configured}
          autoComplete="new-password"
          placeholder={configured ? "留空 = 不修改" : ""}
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />

        {service === "resend" && (
          <TextField
            label="发件人显示名（可选）"
            hint={`收件人看到的名字，例如「${APP_NAME}」。`}
            value={fromName}
            onChange={(event) => setFromName(event.target.value)}
          />
        )}

        <Switch
          checked={isEnabled}
          label="启用"
          hint={
            service === "turnstile"
              ? "停用后登录页不再要求人机验证。"
              : service === "resend"
                ? "停用后登录页不再显示「邮箱验证码」。"
                : "停用后登录页不再显示这个按钮。"
          }
          onChange={(event) => setIsEnabled(event.target.checked)}
        />

        <div className="mx-card__actions">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "保存中…" : configured ? "保存修改" : "保存"}
          </Button>
          {configured && (
            <Button
              type="button"
              variant="danger"
              disabled={busy}
              onClick={() => setRemoving(true)}
            >
              <Icon name="trash" size={15} />
              删除配置
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={removing}
        danger
        busy={busy}
        title={`删除 ${form.title} 配置`}
        confirmLabel="删除"
        body={
          service === "turnstile"
            ? "删除后登录、注册、发验证码都不再要求人机验证。确定？"
            : service === "resend"
              ? "删除后邮箱验证码登录会失效，已发出的验证码也验不了。确定？"
              : "删除后这个第三方登录按钮会消失。已经用它绑定过、且没有设过密码的用户将再也登不进来 —— 先确认他们有别的登录方式。"
        }
        onConfirm={() => void remove()}
        onClose={() => setRemoving(false)}
      />
    </Card>
  );
}
