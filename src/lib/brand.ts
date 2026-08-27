/**
 * 站点与公司的名字，全站只在这里写一遍。
 *
 * 之前这串名字散在 layout 的 metadata、AppShell 顶栏、登录页标题、首页页眉页脚
 * 和验证码邮件模板里各写一份 —— 改名要动六个文件，漏一个就同时存在两种叫法。
 * 这里是纯常量，服务端和客户端组件都能 import。
 */

/** 项目名 = 网站名。刻意用仓库名本身，不另起一个中文品牌名。 */
export const APP_NAME = "MX-Desktop-Sharing-NEXT";

/**
 * 一句话定位曾经也放在这里，现在挪进了语言包（`brand.tagline`）——
 * 它是要翻译的文案，而这个文件是「不随语言变的专有名词」。
 */

export const COMPANY = "Maishan Inc.";

/**
 * 页脚版权行。年份**写死**而不是 `new Date().getFullYear()` ——
 * 后者会让服务端渲染的 HTML 随时间变化（水合不匹配的经典来源），
 * 而且版权年标的是发布年份，不是访客的当前时间。
 */
export const COPYRIGHT = `© 2026 ${COMPANY}`;

/** 登录后底部状态栏左侧那一条。 */
export const POWERED_BY = `Powered by ${COMPANY}`;
