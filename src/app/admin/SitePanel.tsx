"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
import { useT } from "@/i18n";
import { humanizeError } from "@/lib/error-text";
import { toast } from "@/lib/toast";
import type { SiteSettings } from "@/lib/api-types";
import { Banner, Card, PageLoader, Switch } from "@/ui";

/**
 * 管理后台的「站点」分区。
 *
 * 这里的开关都是「翻一下立刻生效」，所以用 Switch 而不是表单 + 保存按钮：
 * 状态先跟着手指走，请求失败再回滚（下面的 catch）—— 否则点一下要等一个来回才动。
 */
export function SitePanel() {
  const t = useT();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ settings: SiteSettings }>("/api/admin/settings");
      setSettings(res.settings);
    } catch (error) {
      toast.error(humanizeError(t, error));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(body: Partial<SiteSettings>, message: string) {
    if (!settings) return;
    const previous = settings;
    setSettings({ ...settings, ...body });
    setBusy(true);
    try {
      const res = await api<{ settings: SiteSettings }>("/api/admin/settings", {
        method: "PATCH",
        json: body,
      });
      setSettings(res.settings);
      toast.success(message);
    } catch (error) {
      // 乐观更新回滚：不回滚的话界面会显示一个其实没保存成功的状态
      setSettings(previous);
      toast.error(humanizeError(t, error));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader>{t("site.loading")}</PageLoader>;
  if (!settings) return null;

  const open = settings.registrationEnabled;

  return (
    <>
      <Banner
        tone={open ? "info" : "warning"}
        title={open ? t("site.openTitle") : t("site.closedTitle")}
      >
        {open ? t("site.openBody") : t("site.closedBody")}
      </Banner>

      <Card title={t("site.card.title")} description={t("site.card.desc")}>
        <Switch
          checked={open}
          disabled={busy}
          label={t("site.switch.label")}
          hint={t("site.switch.hint")}
          onChange={(event) =>
            void patch(
              { registrationEnabled: event.target.checked },
              event.target.checked ? t("site.opened") : t("site.closed"),
            )
          }
        />
      </Card>
    </>
  );
}
