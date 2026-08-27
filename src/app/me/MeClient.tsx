"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api-client";
import type { MyProfile } from "@/lib/api-types";
import { useT, type MessageKey } from "@/i18n";
import { prepareImage, type ImageKind } from "@/lib/client-image";
import { humanizeError } from "@/lib/error-text";
import { toast } from "@/lib/toast";
import { CARD_ACCENTS, initialOf, userImageUrl, type CardAccent } from "@/lib/identity";
import { AppShell, type ShellUser } from "@/components/AppShell";
import { Badge, Button, Card, Icon, TextField } from "@/ui";

const ACCENT_KEYS: Record<CardAccent, MessageKey> = {
  iris: "me.accent.iris",
  azure: "me.accent.azure",
  teal: "me.accent.teal",
  lime: "me.accent.lime",
  amber: "me.accent.amber",
  rose: "me.accent.rose",
  magenta: "me.accent.magenta",
  slate: "me.accent.slate",
};

export function MeClient({ user }: { user: ShellUser }) {
  const t = useT();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState<"name" | "avatar" | "banner" | "accent" | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ profile: MyProfile }>("/api/me/profile");
      setProfile(res.profile);
      setDisplayName(res.profile.displayName);
    } catch (error) {
      toast.error(humanizeError(t, error));
    }
  }, [t]);

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
      try {
        const res = await api<{
          profile: Omit<MyProfile, "id" | "email" | "role" | "hasPassword" | "emailVerified">;
        }>("/api/me/profile", { method: "PATCH", json: patch });
        setProfile((previous) => (previous ? { ...previous, ...res.profile } : previous));
        toast.success(message);
      } catch (error) {
        toast.error(humanizeError(t, error));
      } finally {
        setBusy(null);
      }
    },
    [t],
  );

  async function pickImage(kind: ImageKind, file: File | undefined) {
    if (!file) return;
    try {
      // 先在浏览器里缩到目标尺寸，服务端那道上限就基本不会被撞到
      const dataUrl = await prepareImage(file, kind);
      await save(
        { [kind]: dataUrl },
        kind,
        kind === "avatar" ? t("me.avatarSaved") : t("me.bannerSaved"),
      );
    } catch (error) {
      toast.error(humanizeError(t, error));
    }
  }

  if (!profile) {
    return (
      <AppShell user={user} loading loadingLabel={t("me.loading")} heading={<span>{t("me.heading")}</span>}>
        <span />
      </AppShell>
    );
  }

  const bannerUrl = userImageUrl(profile.id, "banner", profile.bannerAt);
  const avatarUrl = userImageUrl(profile.id, "avatar", profile.avatarAt);

  return (
    <AppShell user={user} heading={<span>{t("me.heading")}</span>}>
      <section className="mx-section">
        <header className="mx-section__header">
          <div className="mx-section__heading">
            <h1 className="mx-section__title">{t("me.heading")}</h1>
            <p className="mx-section__subtitle">{t("me.subtitle")}</p>
          </div>
        </header>

        <Card title={t("me.preview.title")} description={t("me.preview.desc")}>
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
                  <span className="mx-pcard__meta">{t("me.preview.you")}</span>
                </span>
              </span>
              <span className="mx-pcard__live">
                <span className="mx-pcard__live-dot" />
              </span>
            </div>
          </div>
        </Card>

        <div className="mx-split">
          <Card title={t("me.avatar.title")} description={t("me.avatar.desc")}>
            <div className="mx-uploader">
              <span className="mx-uploader__preview" data-accent={profile.cardAccent}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={t("me.avatar.current")} width={72} height={72} />
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
                  {busy === "avatar" ? t("me.uploading") : t("me.pick")}
                </Button>
                {profile.avatarAt && (
                  <Button
                    variant="subtle"
                    disabled={busy !== null}
                    onClick={() => void save({ avatar: null }, "avatar", t("me.avatarReset"))}
                  >
                    <Icon name="trash" size={15} />
                    {t("me.reset")}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card title={t("me.banner.title")} description={t("me.banner.desc")}>
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
                  {busy === "banner" ? t("me.uploading") : t("me.pick")}
                </Button>
                {profile.bannerAt && (
                  <Button
                    variant="subtle"
                    disabled={busy !== null}
                    onClick={() => void save({ banner: null }, "banner", t("me.bannerReset"))}
                  >
                    <Icon name="trash" size={15} />
                    {t("me.reset")}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <Card title={t("me.accent.title")} description={t("me.accent.desc")}>
          <div className="mx-swatches">
            {CARD_ACCENTS.map((accent) => (
              <button
                key={accent}
                type="button"
                className="mx-swatch"
                data-accent={accent}
                data-active={profile.cardAccent === accent}
                aria-pressed={profile.cardAccent === accent}
                title={t(ACCENT_KEYS[accent])}
                disabled={busy !== null}
                onClick={() =>
                  void save({ cardAccent: accent }, "accent", t("me.accent.saved"))
                }
              >
                <span className="mx-swatch__chip" />
                <span className="mx-swatch__label">{t(ACCENT_KEYS[accent])}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title={t("me.account.title")} description={t("me.account.desc")}>
          <form
            className="mx-field-row"
            onSubmit={(event) => {
              event.preventDefault();
              void save(
                { displayName: displayName.trim() },
                "name",
                t("me.account.nameSaved"),
              );
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <TextField
                label={t("auth.displayName")}
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
              {busy === "name" ? t("common.saving") : t("common.save")}
            </Button>
          </form>

          <hr className="mx-card__divider" />

          <div className="mx-inline">
            <span className="mx-text-caption">{profile.email}</span>
            {profile.emailVerified ? (
              <Badge tone="success" dot>
                {t("me.account.emailVerified")}
              </Badge>
            ) : (
              <Badge tone="neutral">{t("me.account.emailUnverified")}</Badge>
            )}
            <Badge tone={profile.hasPassword ? "info" : "neutral"}>
              {profile.hasPassword ? t("me.account.hasPassword") : t("me.account.noPassword")}
            </Badge>
          </div>
        </Card>

        <Card title={t("me.tour.title")} description={t("me.tour.desc")}>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await api("/api/me/ingress-tip", { method: "DELETE" });
                toast.success(t("me.tour.done"));
              } catch (error) {
                toast.error(humanizeError(t, error));
              }
            }}
          >
            <Icon name="sparkle" size={15} />
            {t("me.tour.reset")}
          </Button>
        </Card>
      </section>
    </AppShell>
  );
}
