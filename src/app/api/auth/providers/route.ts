import { ensureBootstrapped } from "@/lib/bootstrap";
import { json, route } from "@/lib/http";
import { publicAuthConfig } from "@/lib/service-credentials";

export const runtime = "nodejs";

/**
 * 登录页开局打这一个接口，问「这套部署开了哪些登录方式」。
 *
 * 未登录可访问，所以只回三样东西：哪几种第三方登录可用、人机验证的 site key
 * （它本来就必须出现在页面上才能渲染那个组件）、以及邮箱验证码通不通。
 * 任何密钥都不在这里出现。
 *
 * 拿不到配置时不要让登录页打不开 —— 降级成「只有邮箱密码登录」，
 * 这是零配置部署的默认形态。
 */
export const GET = route(async () => {
  await ensureBootstrapped();

  try {
    return json(await publicAuthConfig());
  } catch {
    return json({ oauth: [], turnstileSiteKey: null, emailCodeEnabled: false });
  }
});
