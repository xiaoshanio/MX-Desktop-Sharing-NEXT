/**
 * 验证码邮件的 HTML。
 *
 * 邮件不是网页：不能用外链 CSS、不能用 CSS 变量、Gmail 会删掉 <style> 里的一部分规则，
 * Outlook 用 Word 的排版引擎（不支持 flex/grid）。所以这里全部是 table 布局 +
 * 行内样式 + 写死的十六进制色值 —— 色值本身抄的是 tokens.css 的浅色档，
 * 保证和前端页面是同一套观感。
 *
 * LOGO 用 PNG 而不是 SVG：Gmail / QQ 邮箱 / 163 会拦掉 <img src="*.svg">。
 * 那个 PNG 由 scripts/render-logo-png.mjs 从同一份几何生成，见 public/logo-mark-email.png。
 */

import { LOCALE_HTML_LANG, type Locale, type TFunction } from "@/i18n";
import { APP_NAME } from "./brand";

/* tokens.css 浅色档的对应值 */
const ACCENT = "#5640c9";
const ACCENT_SOFT = "#eceafb";
const ACCENT_TEXT = "#4733a8";
const BG_BASE = "#f6f7f9";
const BG_CARD = "#ffffff";
const TEXT_PRIMARY = "#1a1c22";
const TEXT_TERTIARY = "#6b7280";
const STROKE = "#dce0e7";

const FONT =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";
const MONO = "'Cascadia Code', Consolas, ui-monospace, SFMono-Regular, monospace";

export type CodeMailInput = {
  code: string;
  /** 验证码有效期，用于正文里那句话 */
  minutes: number;
  /** 站点根地址，用来拼 LOGO 的绝对地址 —— 邮件里不能用相对路径 */
  appUrl: string;
  /**
   * 收件人的语言。
   *
   * 用**发起这次请求的语言**，而不是账号上存的偏好：验证码邮件是「我刚才点了发送」
   * 的即时回应，所以此刻界面是什么语言，邮件就该是什么语言 —— 而且这封信可能发给
   * 一个还没有账号的邮箱，那种情况下也没有偏好可查。
   */
  locale: Locale;
  t: TFunction;
};

/** 主题行。收件箱里一眼能认出是谁发的、干什么用的。 */
export function codeMailSubject(code: string, t: TFunction): string {
  return t("mail.subject", { code, app: APP_NAME });
}

/**
 * 纯文本兜底。
 * 只发 HTML 的邮件会被相当多的垃圾邮件规则加分，而且文本客户端会显示成一片空白。
 */
export function codeMailText({ code, minutes, t }: CodeMailInput): string {
  return [
    APP_NAME,
    "",
    t("mail.textLead", { code }),
    "",
    t("mail.validity", { minutes }),
    t("mail.textSafety"),
  ].join("\n");
}

export function codeMailHtml({ code, minutes, appUrl, locale, t }: CodeMailInput): string {
  const logo = `${appUrl}/logo-mark-email.png`;
  const host = appUrl.replace(/^https?:\/\//, "");

  // 验证码逐字符切开，字间距靠 letter-spacing 撑 —— 比整串显示好读，也不容易看错 0/O
  return `<!doctype html>
<html lang="${LOCALE_HTML_LANG[locale]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t("mail.title", { app: APP_NAME })}</title>
</head>
<body style="margin:0;padding:0;background:${BG_BASE};">
  <!-- 预览文字：收件箱列表里显示在标题后面的那一句 -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${t("mail.preview", { code, minutes })}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:${BG_BASE};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:480px;background:${BG_CARD};border:1px solid ${STROKE};border-radius:12px;overflow:hidden;">

          <!-- 品牌区 -->
          <tr>
            <td align="center" style="padding:32px 32px 8px 32px;">
              <img src="${logo}" width="56" height="56" alt="${APP_NAME}"
                   style="display:block;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px;font-family:${FONT};">
              <div style="font-size:19px;line-height:28px;font-weight:600;color:${TEXT_PRIMARY};">
                ${APP_NAME}
              </div>
              <div style="font-size:13px;line-height:18px;color:${TEXT_TERTIARY};padding-top:2px;">
                ${t("brand.tagline")}
              </div>
            </td>
          </tr>

          <!-- 验证码 -->
          <tr>
            <td align="center" style="padding:26px 32px 8px 32px;font-family:${FONT};">
              <div style="font-size:15px;line-height:22px;color:${TEXT_PRIMARY};padding-bottom:16px;">
                ${t("mail.lead")}
              </div>
              <div style="background:${ACCENT_SOFT};border-radius:12px;padding:18px 24px;">
                <span style="font-family:${MONO};font-size:32px;line-height:40px;font-weight:700;
                             letter-spacing:8px;color:${ACCENT_TEXT};">${code}</span>
              </div>
              <div style="font-size:13px;line-height:18px;color:${TEXT_TERTIARY};padding-top:14px;">
                ${t("mail.validity", { minutes })}
              </div>
            </td>
          </tr>

          <!-- 安全提示 -->
          <tr>
            <td style="padding:22px 32px 30px 32px;font-family:${FONT};">
              <div style="border-top:1px solid ${STROKE};padding-top:18px;font-size:13px;
                          line-height:20px;color:${TEXT_TERTIARY};">
                ${t("mail.safety")}
              </div>
            </td>
          </tr>
        </table>

        <div style="max-width:480px;padding:16px 8px 0 8px;font-family:${FONT};font-size:12px;
                    line-height:18px;color:${TEXT_TERTIARY};text-align:center;">
          ${t("mail.autoSent", { host: `<a href="${appUrl}" style="color:${ACCENT};text-decoration:none;">${host}</a>` })}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
