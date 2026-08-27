"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api-client";
import type { AuthProviders } from "@/lib/api-types";
import { useT } from "@/i18n";
import { APP_NAME, COPYRIGHT } from "@/lib/brand";
import { humanizeError } from "@/lib/error-text";
import { toast } from "@/lib/toast";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Turnstile } from "@/components/Turnstile";
import { Button, Icon, TextField } from "@/ui";

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

type Mode = "login" | "register";
/** 登录用什么凭据。注册目前只有密码一条路。 */
type Method = "password" | "code";

function LoginScreen() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("password");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const [providers, setProviders] = useState<AuthProviders | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  /** 改变它会换一枚新的人机验证 token —— 每次提交失败后必须换。 */
  const [captchaNonce, setCaptchaNonce] = useState(0);

  /** 验证码已发出，进入「填验证码」的状态 */
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  /**
   * 第三方登录失败时，原因是通过 ?error= 带回来的（见 oauth/[provider]/callback ——
   * 那一步是浏览器跳转，没法回 JSON）。进页面就弹出来。
   */
  const oauthError = params.get("error");
  useEffect(() => {
    if (oauthError) toast.error(oauthError, { title: t("auth.oauthFailedTitle") });
  }, [oauthError, t]);

  useEffect(() => {
    api<AuthProviders>("/api/auth/providers")
      .then(setProviders)
      // 拿不到就退化成「只有邮箱密码登录」，不能让登录页打不开
      .catch(() =>
        setProviders({
          oauth: [],
          turnstileSiteKey: null,
          emailCodeEnabled: false,
          registrationEnabled: true,
        }),
      );
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const registering = mode === "register";
  const needsCaptcha = providers?.turnstileSiteKey != null;
  /**
   * 站点关了注册时不显示「注册」页签。
   *
   * 还不知道（providers 未到）时按开放算：绝大多数部署是开放的，
   * 先按开放渲染只在极少数站点上会有一次页签消失，反过来则是每次打开
   * 登录页都要等一个来回才出现页签。真正的拦截在服务端，藏不藏按钮都拦得住。
   */
  const registrationOpen = providers?.registrationEnabled ?? true;

  /** 已经切到注册页签、这时才知道注册关了 —— 把人送回登录，别留在一个提交必失败的表单上。 */
  useEffect(() => {
    if (providers && !providers.registrationEnabled) setMode("login");
  }, [providers]);

  /** 提交失败后重置人机验证：token 是一次性的，不换的话下一次必然失败。 */
  const failed = useCallback(
    (error: unknown) => {
      toast.error(humanizeError(t, error));
      setCaptchaToken(null);
      setCaptchaNonce((nonce) => nonce + 1);
    },
    [t],
  );

  function switchMode(target: Mode) {
    setMode(target);
    if (target === "register") setMethod("password");
  }

  function switchMethod(target: Method) {
    setMethod(target);
    setCodeSent(false);
    setCode("");
  }

  async function sendCode() {
    setBusy(true);
    try {
      await api("/api/auth/email/code", { method: "POST", json: { email, captchaToken } });
      setCodeSent(true);
      setCooldown(60);
      toast.success(t("auth.codeSent", { email }));
      // 这枚 token 已经被服务端消费掉了，换一枚给后面的操作用
      setCaptchaToken(null);
      setCaptchaNonce((nonce) => nonce + 1);
    } catch (error) {
      failed(error);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    // 验证码模式下还没发码时，这个按钮就是「发送验证码」
    if (method === "code" && !codeSent) {
      await sendCode();
      return;
    }

    setBusy(true);
    try {
      if (registering) {
        await api("/api/auth/register", {
          method: "POST",
          json: { email, displayName, password, captchaToken },
        });
      } else if (method === "code") {
        await api("/api/auth/email/verify", { method: "POST", json: { email, code } });
      } else {
        await api("/api/auth/login", { method: "POST", json: { email, password, captchaToken } });
      }
      router.push(next);
      router.refresh();
    } catch (error) {
      failed(error);
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = busy
    ? t("auth.submitBusy")
    : registering
      ? t("auth.submitRegister")
      : method === "code"
        ? codeSent
          ? t("auth.submitVerify")
          : t("auth.submitSendCode")
        : t("auth.submitLogin");

  /**
   * 人机验证只在「会真的消费一枚 token」的那些提交上要求。
   * 验证码登录的第二步（填 6 位数）不需要 —— 发码那步已经验过了，
   * 而爆破由验证码本身的试错上限守着。
   */
  const captchaRequired = needsCaptcha && !(method === "code" && codeSent);
  const blocked = captchaRequired && captchaToken === null;

  return (
    <div className="mx-auth">
      {/*
        登录页也要能换语言：它是未登录用户唯一停留够久的页面，而首页顶栏在手机上
        不显示语言下拉（见 landing.css）—— 两处都没有的话，系统语言没被认出来的人
        就完全没有出路了。
      */}
      <div className="mx-auth__chrome">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="mx-auth__inner">
        <div className="mx-auth__brand">
          <Link href="/" className="mx-auth__home" aria-label={t("auth.home")}>
            <BrandMark size={64} className="mx-auth__mark" />
            <h1 className="mx-auth__title">{APP_NAME}</h1>
          </Link>
          <p className="mx-auth__subtitle">{t("auth.subtitle")}</p>
        </div>

        <form className="mx-auth__panel" onSubmit={submit}>
          {registrationOpen ? (
            <div className="mx-auth__switcher" role="tablist" aria-label={t("auth.tabs")}>
              <button
                type="button"
                role="tab"
                className="mx-auth__switch"
                aria-selected={!registering}
                onClick={() => switchMode("login")}
              >
                {t("auth.signIn")}
              </button>
              <button
                type="button"
                role="tab"
                className="mx-auth__switch"
                aria-selected={registering}
                onClick={() => switchMode("register")}
              >
                {t("auth.signUp")}
              </button>
            </div>
          ) : (
            <p className="mx-auth__closed">
              <Icon name="ban" size={14} />
              {t("auth.closed")}
            </p>
          )}

          {/* 第三方登录。没配的话整块不出现。 */}
          {providers && providers.oauth.length > 0 && (
            <>
              <div className="mx-oauth">
                {providers.oauth.map(({ provider }) => (
                  <a
                    key={provider}
                    className="mx-oauth__button"
                    data-provider={provider}
                    href={`/api/auth/oauth/${provider}/start?next=${encodeURIComponent(next)}`}
                  >
                    <Icon name={provider} size={18} />
                    {t("auth.oauthContinue", {
                      provider: provider === "github" ? "GitHub" : "Google",
                    })}
                  </a>
                ))}
              </div>
              <div className="mx-auth__divider">
                <span>{t("auth.orEmail")}</span>
              </div>
            </>
          )}

          {/* 登录方式：密码 / 验证码。只有配了 Resend 才给验证码这条路。 */}
          {!registering && providers?.emailCodeEnabled && (
            <div className="mx-auth__methods" role="tablist" aria-label={t("auth.methods")}>
              <button
                type="button"
                role="tab"
                className="mx-auth__method"
                aria-selected={method === "password"}
                onClick={() => switchMethod("password")}
              >
                <Icon name="key" size={14} />
                {t("auth.methodPassword")}
              </button>
              <button
                type="button"
                role="tab"
                className="mx-auth__method"
                aria-selected={method === "code"}
                onClick={() => switchMethod("code")}
              >
                <Icon name="mail" size={14} />
                {t("auth.methodCode")}
              </button>
            </div>
          )}

          <div className="mx-form">
            <TextField
              label={t("auth.email")}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              // 发出验证码之后锁住邮箱，避免改了邮箱却用旧邮箱的码去验
              disabled={method === "code" && codeSent}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            {registering && (
              <TextField
                label={t("auth.displayName")}
                type="text"
                required
                autoComplete="nickname"
                hint={t("auth.displayNameHint")}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            )}

            {method === "password" && (
              <TextField
                label={t("auth.password")}
                type="password"
                required
                autoComplete={registering ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}

            {method === "code" && codeSent && (
              <>
                <TextField
                  label={t("auth.code")}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  placeholder={t("auth.codePlaceholder")}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  className="mx-auth__resend"
                  disabled={busy || cooldown > 0}
                  onClick={() => void sendCode()}
                >
                  {cooldown > 0 ? t("auth.resendIn", { seconds: cooldown }) : t("auth.resend")}
                </button>
              </>
            )}

            {/* 人机验证放在提交按钮正上方 */}
            {captchaRequired && providers?.turnstileSiteKey && (
              <Turnstile
                siteKey={providers.turnstileSiteKey}
                resetKey={captchaNonce}
                onToken={setCaptchaToken}
              />
            )}

            <Button type="submit" variant="primary" size="lg" full disabled={busy || blocked}>
              {submitLabel}
            </Button>
          </div>
        </form>

        <div className="mx-auth__foot">
          <p className="mx-auth__footnote">
            {registering ? t("auth.footRegister") : t("auth.footLogin")}
          </p>
          <p className="mx-auth__copyright">{COPYRIGHT}</p>
        </div>
      </div>
    </div>
  );
}
