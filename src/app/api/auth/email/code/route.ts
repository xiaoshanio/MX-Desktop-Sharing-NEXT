import { requireBootstrapped } from "@/lib/bootstrap";
import { CODE_TTL_MINUTES, issueCode } from "@/lib/email-codes";
import { codeMailHtml, codeMailSubject, codeMailText } from "@/lib/email-template";
import { json, parseOr400, readJson, route } from "@/lib/http";
import { sendMail } from "@/lib/mailer";
import { assertHuman } from "@/lib/turnstile";
import { appUrl, clientIp } from "@/lib/url";
import { requestEmailCodeSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * 发一封验证码邮件。
 *
 * 三道闸按这个顺序过，缺一不可：
 *   1. 人机验证 —— 没有它这就是一个「谁都能拿来给任意邮箱发信」的接口，
 *      既烧 Resend 额度，也会被当成骚扰工具，最后域名进黑名单。
 *   2. 频次限制（在 issueCode 里）—— 冷却 + 每小时上限，且在**发信之前**判定。
 *   3. 真正发信。
 *
 * 无论邮箱在不在库里，成功响应都长一样：这个接口同时承担注册和登录，
 * 回「该邮箱未注册」等于把用户名单送人。
 */
export const POST = route(async (req) => {
  const input = await readJson(req, (raw) => parseOr400(requestEmailCodeSchema, raw));
  await requireBootstrapped();

  await assertHuman(input.captchaToken, clientIp(req));

  const { code } = await issueCode(input.email);

  await sendMail({
    to: input.email,
    subject: codeMailSubject(code),
    html: codeMailHtml({ code, minutes: CODE_TTL_MINUTES, appUrl: appUrl(req) }),
    text: codeMailText({ code, minutes: CODE_TTL_MINUTES, appUrl: appUrl(req) }),
  });

  // 发信失败会由 sendMail 抛 502，所以走到这里就是真的投出去了。
  // 但仍然不回显任何和「这个邮箱存不存在」有关的信息。
  return json({ ok: true, expiresInMinutes: CODE_TTL_MINUTES });
});
