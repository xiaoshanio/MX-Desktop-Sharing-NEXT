"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api-client";
import type { AuthProviders } from "@/lib/api-types";
import { BrandMark } from "@/components/BrandMark";
import { Turnstile } from "@/components/Turnstile";
import { Banner, Button, Icon, TextField } from "@/ui";

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

  // 第三方回调失败时会把原因放在 ?error= 上带回来（见 oauth/[provider]/callback）
  const [err, setErr] = useState<string | null>(params.get("error"));
  const [notice, setNotice] = useState<string | null>(null);

  const [providers, setProviders] = useState<AuthProviders | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  /** 改变它会换一枚新的人机验证 token —— 每次提交失败后必须换。 */
  const [captchaNonce, setCaptchaNonce] = useState(0);

  /** 验证码已发出，进入「填验证码」的状态 */
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    api<AuthProviders>("/api/auth/providers")
      .then(setProviders)
      // 拿不到就退化成「只有邮箱密码登录」，不能让登录页打不开
      .catch(() => setProviders({ oauth: [], turnstileSiteKey: null, emailCodeEnabled: false }));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const registering = mode === "register";
  const needsCaptcha = providers?.turnstileSiteKey != null;

  /** 提交失败后重置人机验证：token 是一次性的，不换的话下一次必然失败。 */
  const failed = useCallback((message: string) => {
    setErr(message);
    setCaptchaToken(null);
    setCaptchaNonce((nonce) => nonce + 1);
  }, []);

  function switchMode(target: Mode) {
    setMode(target);
    setErr(null);
    setNotice(null);
    if (target === "register") setMethod("password");
  }

  function switchMethod(target: Method) {
    setMethod(target);
    setErr(null);
    setNotice(null);
    setCodeSent(false);
    setCode("");
  }

  async function sendCode() {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      await api("/api/auth/email/code", { method: "POST", json: { email, captchaToken } });
      setCodeSent(true);
      setCooldown(60);
      setNotice(`验证码已发到 ${email}，10 分钟内有效。`);
      // 这枚 token 已经被服务端消费掉了，换一枚给后面的操作用
      setCaptchaToken(null);
      setCaptchaNonce((nonce) => nonce + 1);
    } catch (error) {
      failed(error instanceof Error ? error.message : String(error));
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
    setErr(null);
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
      failed(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = busy
    ? "处理中…"
    : registering
      ? "注册并进入"
      : method === "code"
        ? codeSent
          ? "验证并登录"
          : "发送验证码"
        : "登录";

  /**
   * 人机验证只在「会真的消费一枚 token」的那些提交上要求。
   * 验证码登录的第二步（填 6 位数）不需要 —— 发码那步已经验过了，
   * 而爆破由验证码本身的试错上限守着。
   */
  const captchaRequired = needsCaptcha && !(method === "code" && codeSent);
  const blocked = captchaRequired && captchaToken === null;

  return (
    <div className="mx-auth">
      <div className="mx-auth__inner">
        <div className="mx-auth__brand">
          <BrandMark size={64} className="mx-auth__mark" />
          <h1 className="mx-auth__title">MX 桌面共享</h1>
          <p className="mx-auth__subtitle">
            一房一节点，一人一推流地址。用 OBS 或浏览器直接把屏幕推给房间里的人。
          </p>
        </div>

        <form className="mx-auth__panel" onSubmit={submit}>
          <div className="mx-auth__switcher" role="tablist" aria-label="登录或注册">
            <button
              type="button"
              role="tab"
              className="mx-auth__switch"
              aria-selected={!registering}
              onClick={() => switchMode("login")}
            >
              登录
            </button>
            <button
              type="button"
              role="tab"
              className="mx-auth__switch"
              aria-selected={registering}
              onClick={() => switchMode("register")}
            >
              注册
            </button>
          </div>

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
                    用 {provider === "github" ? "GitHub" : "Google"} 继续
                  </a>
                ))}
              </div>
              <div className="mx-auth__divider">
                <span>或用邮箱</span>
              </div>
            </>
          )}

          {/* 登录方式：密码 / 验证码。只有配了 Resend 才给验证码这条路。 */}
          {!registering && providers?.emailCodeEnabled && (
            <div className="mx-auth__methods" role="tablist" aria-label="登录方式">
              <button
                type="button"
                role="tab"
                className="mx-auth__method"
                aria-selected={method === "password"}
                onClick={() => switchMethod("password")}
              >
                <Icon name="key" size={14} />
                密码
              </button>
              <button
                type="button"
                role="tab"
                className="mx-auth__method"
                aria-selected={method === "code"}
                onClick={() => switchMethod("code")}
              >
                <Icon name="mail" size={14} />
                邮箱验证码
              </button>
            </div>
          )}

          <div className="mx-form">
            <TextField
              label="邮箱"
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
                label="显示名"
                type="text"
                required
                autoComplete="nickname"
                hint="房间成员列表里显示的名字。"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            )}

            {method === "password" && (
              <TextField
                label="密码"
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
                  label="邮箱验证码"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  placeholder="6 位数字"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  className="mx-auth__resend"
                  disabled={busy || cooldown > 0}
                  onClick={() => void sendCode()}
                >
                  {cooldown > 0 ? `重新发送（${cooldown}s）` : "没收到？重新发送"}
                </button>
              </>
            )}

            {notice && <Banner tone="success">{notice}</Banner>}
            {err && <Banner tone="error">{err}</Banner>}

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

        <p className="mx-auth__footnote">
          {registering
            ? "注册即拥有自己的工作区，可接入你自己的 LiveKit 节点。"
            : "收到邀请链接的话，直接打开链接登录就会自动入房。"}
        </p>
      </div>
    </div>
  );
}
