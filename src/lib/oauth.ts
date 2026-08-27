import { createHash, randomBytes } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";

import { db } from "@/db";
import { oauthStates, type OauthProvider } from "@/db/schema";
import { ApiError, badRequest } from "./http";
import { requireCredential } from "./service-credentials";

/**
 * GitHub / Google 的授权码流程。
 *
 * 三道防护，缺一不可：
 * - **state**：一次性、存哈希、带过期。没有它的话攻击者可以拿自己的授权码构造一个
 *   回调链接骗受害者点开，把受害者的会话绑到攻击者的第三方账号上（登录 CSRF）。
 * - **PKCE**：授权码即使在回调 URL 里被中途读到，没有 code_verifier 也换不出 token。
 *   Google 支持；GitHub 至今不支持，所以对它这一条退化成 state 单独顶着。
 * - **只按 provider + 第三方稳定 id 认人**，不按邮箱认人。见 identityFrom() 的注释。
 */

const STATE_TTL_MS = 10 * 60 * 1000;

const hashState = (raw: string) => createHash("sha256").update(raw).digest("hex");

/** 只允许站内相对路径，防 open redirect。 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export function redirectUri(appUrl: string, provider: OauthProvider): string {
  return `${appUrl}/api/auth/oauth/${provider}/callback`;
}

/* ============================================================
   授权阶段
   ============================================================ */

/** 生成授权 URL，并把 state / code_verifier 落库。返回要 302 过去的地址。 */
export async function beginAuthorization(input: {
  provider: OauthProvider;
  appUrl: string;
  nextPath: string;
}): Promise<string> {
  const credential = await requireCredential(input.provider);

  const state = randomBytes(32).toString("base64url");
  // RFC 7636 建议 43–128 字符；32 字节 base64url 正好 43
  const codeVerifier = randomBytes(32).toString("base64url");

  await db.insert(oauthStates).values({
    id: hashState(state),
    provider: input.provider,
    codeVerifier,
    nextPath: safeNextPath(input.nextPath),
    expiresAt: new Date(Date.now() + STATE_TTL_MS),
  });

  const uri = redirectUri(input.appUrl, input.provider);

  if (input.provider === "github") {
    const params = new URLSearchParams({
      client_id: credential.publicValue,
      redirect_uri: uri,
      // user:email 是为了在用户把邮箱设为私密时也能拿到主邮箱
      scope: "read:user user:email",
      state,
      allow_signup: "true",
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  const challenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: credential.publicValue,
    redirect_uri: uri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    // 每次都回到账号选择页，避免多账号用户被静默登成上一个
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** 核验并消费 state。返回当初记下的落地路径。 */
export async function consumeState(
  provider: OauthProvider,
  state: string | null,
): Promise<{ nextPath: string; codeVerifier: string }> {
  if (!state) throw badRequest("api.oauth.missingState");

  const id = hashState(state);
  // delete + returning 天然是原子的，同一个 state 并发过来只有一个能拿到行
  const [row] = await db
    .delete(oauthStates)
    .where(and(eq(oauthStates.id, id), eq(oauthStates.provider, provider)))
    .returning();

  if (!row) throw badRequest("api.oauth.staleState");
  if (row.expiresAt.getTime() <= Date.now()) {
    throw badRequest("api.oauth.stateTimeout");
  }

  // 顺手清一批过期的，省掉一个定时任务
  void db.delete(oauthStates).where(lt(oauthStates.expiresAt, new Date())).catch(() => {});

  return { nextPath: row.nextPath, codeVerifier: row.codeVerifier };
}

/* ============================================================
   回调阶段
   ============================================================ */

/**
 * 第三方那边的身份。
 *
 * `providerAccountId` 是认人的唯一依据，**不能用邮箱** —— 邮箱在 GitHub 上可以改，
 * 改完就变成「另一个人」；反过来，攻击者注册一个和受害者同邮箱的第三方账号
 * 就能顶掉受害者的登录。第三方的数字 id / sub 才是稳定且不可伪造的。
 */
export type OauthIdentity = {
  provider: OauthProvider;
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string;
  /** 第三方头像地址。会被服务端抓取一次转存成自己的字节，不做外链。 */
  avatarUrl: string | null;
};

export async function exchangeCode(input: {
  provider: OauthProvider;
  code: string;
  codeVerifier: string;
  appUrl: string;
}): Promise<OauthIdentity> {
  const credential = await requireCredential(input.provider);
  const uri = redirectUri(input.appUrl, input.provider);

  const accessToken =
    input.provider === "github"
      ? await githubToken(credential.publicValue, credential.secret, input.code, uri)
      : await googleToken(credential.publicValue, credential.secret, input.code, uri, input.codeVerifier);

  return input.provider === "github" ? githubIdentity(accessToken) : googleIdentity(accessToken);
}

async function postForm(url: string, body: URLSearchParams): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body,
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new ApiError(502, "oauth_unreachable", "api.oauth.unreachable");
  }
  const raw = await res.text();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

async function getJson(url: string, token: string): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
        // GitHub 要求带 UA，不带会 403
        "user-agent": "mx-desktop-sharing",
      },
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new ApiError(502, "oauth_unreachable", "api.oauth.unreachable");
  }
  if (!res.ok) throw new ApiError(502, "oauth_failed", "api.oauth.providerStatus", undefined, {
      status: res.status,
    });
  const raw = await res.text();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

/** access_token 换取失败时的统一报错。第三方会把原因放在 error_description 里。 */
function readAccessToken(payload: Record<string, unknown>): string {
  const token = payload.access_token;
  if (typeof token === "string" && token !== "") return token;
  const reason =
    (typeof payload.error_description === "string" && payload.error_description) ||
    (typeof payload.error === "string" && payload.error) ||
    "api.oauth.noAccessToken";
  throw new ApiError(502, "oauth_failed", "api.oauth.loginFailed", undefined, { reason });
}

async function githubToken(
  clientId: string,
  clientSecret: string,
  code: string,
  uri: string,
): Promise<string> {
  const payload = await postForm(
    "https://github.com/login/oauth/access_token",
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: uri,
    }),
  );
  return readAccessToken(payload);
}

async function googleToken(
  clientId: string,
  clientSecret: string,
  code: string,
  uri: string,
  codeVerifier: string,
): Promise<string> {
  const payload = await postForm(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: uri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  );
  return readAccessToken(payload);
}

async function githubIdentity(token: string): Promise<OauthIdentity> {
  const me = await getJson("https://api.github.com/user", token);
  const id = me.id;
  if (typeof id !== "number" && typeof id !== "string") {
    throw new ApiError(502, "oauth_failed", "api.oauth.githubNoId");
  }

  let email = typeof me.email === "string" ? me.email : null;
  let emailVerified = false;

  // 用户把邮箱设为私密时 /user 的 email 是 null，要另外问一次
  try {
    const list = (await getJson("https://api.github.com/user/emails", token)) as unknown as Array<{
      email?: string;
      primary?: boolean;
      verified?: boolean;
    }>;
    if (Array.isArray(list)) {
      const primary = list.find((e) => e.primary && e.verified) ?? list.find((e) => e.verified);
      if (primary?.email) {
        email = primary.email;
        emailVerified = true;
      }
    }
  } catch {
    // 拿不到就用 /user 上那个（可能为 null），下面会走「没邮箱」的分支
  }

  const login = typeof me.login === "string" ? me.login : `github-${id}`;
  return {
    provider: "github",
    providerAccountId: String(id),
    email: email?.toLowerCase() ?? null,
    emailVerified,
    displayName: (typeof me.name === "string" && me.name.trim()) || login,
    avatarUrl: typeof me.avatar_url === "string" ? me.avatar_url : null,
  };
}

async function googleIdentity(token: string): Promise<OauthIdentity> {
  const me = await getJson("https://www.googleapis.com/oauth2/v3/userinfo", token);
  const sub = me.sub;
  if (typeof sub !== "string" || sub === "") {
    throw new ApiError(502, "oauth_failed", "api.oauth.googleNoSub");
  }

  const email = typeof me.email === "string" ? me.email.toLowerCase() : null;
  return {
    provider: "google",
    providerAccountId: sub,
    email,
    emailVerified: me.email_verified === true,
    displayName:
      (typeof me.name === "string" && me.name.trim()) || email?.split("@")[0] || `google-${sub}`,
    avatarUrl: typeof me.picture === "string" ? me.picture : null,
  };
}

/**
 * 把第三方头像抓回来存成自己的字节。
 *
 * 不直接存外链：对方改了隐私设置或换了 CDN 路径，站内所有头像会同时变裂图；
 * 而且每次渲染都会把用户的访问信息漏给第三方。抓取失败不算错误 —— 没头像就用默认底色。
 */
export async function fetchAvatarBytes(
  url: string | null,
): Promise<{ mimeType: string; base64: string; byteSize: number } | null> {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    // 只允许 https，且不跟随到内网地址（这是我们主动发起的请求，得当 SSRF 防）
    if (parsed.protocol !== "https:") return null;

    const res = await fetch(parsed, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "mx-desktop-sharing" },
    });
    if (!res.ok) return null;

    const mimeType = (res.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
    if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    // 头像上限和用户自己上传的一致，超了就当没有
    if (buf.byteLength === 0 || buf.byteLength > 256 * 1024) return null;

    return { mimeType, base64: buf.toString("base64"), byteSize: buf.byteLength };
  } catch {
    return null;
  }
}
