"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
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
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ settings: SiteSettings }>("/api/admin/settings");
      setSettings(res.settings);
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setLoading(false);
    }
  }, []);

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
      toast.error(humanizeError(error));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader>正在加载站点设置…</PageLoader>;
  if (!settings) return null;

  const open = settings.registrationEnabled;

  return (
    <>
      <Banner
        tone={open ? "info" : "warning"}
        title={open ? "当前开放注册" : "当前禁止注册，已有账号仍可登录"}
      >
        {open
          ? "任何人都能自己建号：邮箱密码注册、GitHub / Google 首次登录、邮箱验证码首次登录，这三条路都会当场建出账号。"
          : "三条建号的路都被拦住了，都会收到「本站点禁止注册」。已有账号的人不受影响，照旧能用密码、第三方和邮箱验证码登录。注意邀请链接也要先有账号才能兑换 —— 要放新人进来得先把这个开关打开。"}
      </Banner>

      <Card
        title="注册"
        description="控制陌生人能不能在本站建出新账号。拦截在服务端做（签发会话之前），不是前端把按钮藏起来。"
      >
        <Switch
          checked={open}
          disabled={busy}
          label="开放注册"
          hint="关掉之后：注册接口直接拒绝；第三方登录只认已经绑过的账号，没绑过的当场被拒；邮箱验证码登录同理 —— 已有账号照常放行，新邮箱不再自动建号。"
          onChange={(event) =>
            void patch(
              { registrationEnabled: event.target.checked },
              event.target.checked ? "已开放注册。" : "已禁止注册。",
            )
          }
        />
      </Card>
    </>
  );
}
