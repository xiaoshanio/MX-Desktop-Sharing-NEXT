"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api-client";
import type { MyProfile } from "@/lib/api-types";
import { prepareImage, type ImageKind } from "@/lib/client-image";
import { CARD_ACCENTS, initialOf, userImageUrl, type CardAccent } from "@/lib/identity";
import { AppShell, type ShellUser } from "@/components/AppShell";
import {
  Badge,
  Banner,
  Button,
  Card,
  Icon,
  Loading,
  TextField,
} from "@/ui";

const ACCENT_LABELS: Record<CardAccent, string> = {
  iris: "鸢尾",
  azure: "天青",
  teal: "松绿",
  lime: "柳绿",
  amber: "琥珀",
  rose: "绯红",
  magenta: "洋红",
  slate: "石板",
};

export function MeClient({ user }: { user: ShellUser }) {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"name" | "avatar" | "banner" | "accent" | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ profile: MyProfile }>("/api/me/profile");
      setProfile(res.profile);
      setDisplayName(res.profile.displayName);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * 统一的保存入口。
   *
   * 只把这一次真正改的字段放进请求体：PATCH 的语义是「不传 = 不动」，
   * 全量提交会让「改个昵称」顺手把头像也覆盖一遍（见 api/me/profile 的注释）。
   */
  const save = useCallback(
    async (patch: Record<string, unknown>, kind: NonNullable<typeof busy>, message: string) => {
      setBusy(kind);
      setErr(null);
      setNotice(null);
      try {
        const res = await api<{ profile: Omit<MyProfile, "id" | "email" | "role" | "hasPassword" | "emailVerified"> }>(
          "/api/me/profile",
          { method: "PATCH", json: patch },
        );
        setProfile((previous) => (previous ? { ...previous, ...res.profile } : previous));
        setNotice(message);
      } catch (error) {
        setErr(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  async function pickImage(kind: ImageKind, file: File | undefined) {
    if (!file) return;
    setErr(null);
    try {
      // 先在浏览器里缩到目标尺寸，服务端那道上限就基本不会被撞到
      const dataUrl = await prepareImage(file, kind);
      await save(
        { [kind]: dataUrl },
        kind,
        kind === "avatar" ? "头像已更新。" : "卡片背景已更新。",
      );
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    }
  }

  if (!profile) {
    return (
      <AppShell user={user} heading={<span>个人中心</span>}>
        <section className="mx-section">
          <Loading>正在加载资料…</Loading>
        </section>
      </AppShell>
    );
  }

  const bannerUrl = userImageUrl(profile.id, "banner", profile.bannerAt);
  const avatarUrl = userImageUrl(profile.id, "avatar", profile.avatarAt);

  return (
    <AppShell user={user} heading={<span>个人中心</span>}>
      <section className="mx-section">
        <header className="mx-section__header">
          <div className="mx-section__heading">
            <h1 className="mx-section__title">个人中心</h1>
            <p className="mx-section__subtitle">
              这里改的是房间里那张成员卡片 —— 别人在画面左侧看到的就是它。
            </p>
          </div>
        </header>

        {err && <Banner tone="error">{err}</Banner>}
        {notice && <Banner tone="success">{notice}</Banner>}

        <Card
          title="卡片预览"
          description="进房后你在别人画面左侧长这样。背景没上传时用按账号分配的底色。"
        >
          <div className="mx-cardpreview">
            <div className="mx-pcard" data-accent={profile.cardAccent} data-preview="true">
              <span
                className="mx-pcard__bg"
                style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
                data-custom={bannerUrl ? "true" : undefined}
              />
              <span className="mx-pcard__body">
                <span className="mx-pcard__avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" width={34} height={34} />
                  ) : (
                    <span aria-hidden="true">{initialOf(profile.displayName)}</span>
                  )}
                </span>
                <span className="mx-pcard__text">
                  <span className="mx-pcard__name">{profile.displayName}</span>
                  <span className="mx-pcard__meta">你</span>
                </span>
              </span>
              <span className="mx-pcard__live">
                <span className="mx-pcard__live-dot" />
              </span>
            </div>
          </div>
        </Card>

        <div className="mx-split">
          <Card title="头像" description="正方形显示，会自动裁成圆形。上传前浏览器会缩到 256px。">
            <div className="mx-uploader">
              <span className="mx-uploader__preview" data-accent={profile.cardAccent}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="当前头像" width={72} height={72} />
                ) : (
                  <span aria-hidden="true">{initialOf(profile.displayName)}</span>
                )}
              </span>
              <div className="mx-uploader__actions">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => {
                    void pickImage("avatar", event.target.files?.[0]);
                    // 清掉 value，否则连续选同一个文件不会触发 change
                    event.target.value = "";
                  }}
                />
                <Button
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Icon name="upload" size={15} />
                  {busy === "avatar" ? "上传中…" : "选择图片"}
                </Button>
                {profile.avatarAt && (
                  <Button
                    variant="subtle"
                    disabled={busy !== null}
                    onClick={() => void save({ avatar: null }, "avatar", "头像已恢复默认。")}
                  >
                    <Icon name="trash" size={15} />
                    恢复默认
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card title="卡片背景" description="卡片顶部那条横幅。会缩到 960×540 并居中裁切。">
            <div className="mx-uploader">
              <span
                className="mx-uploader__banner"
                data-accent={profile.cardAccent}
                style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
                data-custom={bannerUrl ? "true" : undefined}
              >
                {!bannerUrl && <Icon name="image" size={18} />}
              </span>
              <div className="mx-uploader__actions">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => {
                    void pickImage("banner", event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <Button
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Icon name="upload" size={15} />
                  {busy === "banner" ? "上传中…" : "选择图片"}
                </Button>
                {profile.bannerAt && (
                  <Button
                    variant="subtle"
                    disabled={busy !== null}
                    onClick={() => void save({ banner: null }, "banner", "背景已恢复默认底色。")}
                  >
                    <Icon name="trash" size={15} />
                    恢复默认
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <Card
          title="卡片底色"
          description="没上传背景图时用这个颜色。默认按账号随机分配一档。"
        >
          <div className="mx-swatches">
            {CARD_ACCENTS.map((accent) => (
              <button
                key={accent}
                type="button"
                className="mx-swatch"
                data-accent={accent}
                data-active={profile.cardAccent === accent}
                aria-pressed={profile.cardAccent === accent}
                title={ACCENT_LABELS[accent]}
                disabled={busy !== null}
                onClick={() => void save({ cardAccent: accent }, "accent", "底色已更新。")}
              >
                <span className="mx-swatch__chip" />
                <span className="mx-swatch__label">{ACCENT_LABELS[accent]}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="账号" description="显示名会出现在成员列表和卡片上。">
          <form
            className="mx-field-row"
            onSubmit={(event) => {
              event.preventDefault();
              void save({ displayName: displayName.trim() }, "name", "显示名已更新。");
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <TextField
                label="显示名"
                required
                maxLength={60}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={
                busy !== null || displayName.trim() === "" || displayName === profile.displayName
              }
            >
              {busy === "name" ? "保存中…" : "保存"}
            </Button>
          </form>

          <hr className="mx-card__divider" />

          <div className="mx-inline">
            <span className="mx-text-caption">{profile.email}</span>
            {profile.emailVerified ? (
              <Badge tone="success" dot>
                邮箱已验证
              </Badge>
            ) : (
              <Badge tone="neutral">邮箱未验证</Badge>
            )}
            <Badge tone={profile.hasPassword ? "info" : "neutral"}>
              {profile.hasPassword ? "已设密码" : "仅第三方 / 验证码登录"}
            </Badge>
          </div>
        </Card>

        <Card
          title="新手引导"
          description="第一次进房时那个「推流地址在哪」的提示。"
        >
          <Button
            variant="secondary"
            onClick={async () => {
              setErr(null);
              try {
                await api("/api/me/ingress-tip", { method: "DELETE" });
                setNotice("已重置，下次进房会再弹一次引导。");
              } catch (error) {
                setErr(error instanceof Error ? error.message : String(error));
              }
            }}
          >
            <Icon name="sparkle" size={15} />
            再看一次引导
          </Button>
        </Card>
      </section>
    </AppShell>
  );
}
