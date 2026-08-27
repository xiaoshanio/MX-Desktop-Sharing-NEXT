import { ApiError } from "./http";
import { requireCredential } from "./service-credentials";

/**
 * Resend 发信。直接打它的 REST 接口，不引 `resend` 这个 npm 包 ——
 * 那个包除了帮我们拼一个 fetch 之外没做别的，而多一个依赖就多一份升级和审计负担。
 *
 * API Key 从加密的 service_credentials 里取（见 service-credentials.ts 顶部
 * 「为什么不用环境变量」那段）。
 */

const ENDPOINT = "https://api.resend.com/emails";

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * 发一封信。失败抛 ApiError —— 调用方需要把「验证码没发出去」明确告诉用户，
 * 静默失败最糟：用户会一直等一封永远不会到的邮件。
 */
export async function sendMail(input: MailInput): Promise<{ id: string }> {
  const credential = await requireCredential("resend");

  // publicValue 是发件地址；带显示名的话拼成 `名字 <地址>`
  const fromName = credential.meta.fromName?.trim();
  const from = fromName ? `${fromName} <${credential.publicValue}>` : credential.publicValue;

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${credential.secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new ApiError(502, "mail_unreachable", "api.mail.unreachable");
  }

  const raw = await res.text();
  const payload = raw ? (JSON.parse(raw) as { id?: string; message?: string; name?: string }) : {};

  if (!res.ok) {
    // Resend 的报错基本都是配置问题（域名没验证、Key 失效、from 地址不属于该域名），
    // 原文往前端抛出去反而有用 —— 管理员照着那句话就知道去改哪里。
    // 但不带上 Key 本身，也不带整个响应体。
    const detail = payload.message ?? payload.name ?? `HTTP ${res.status}`;
    throw new ApiError(502, "mail_failed", "api.mail.failed", undefined, { detail });
  }

  return { id: payload.id ?? "" };
}
