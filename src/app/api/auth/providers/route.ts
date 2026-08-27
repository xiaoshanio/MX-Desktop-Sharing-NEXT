import { ensureBootstrapped } from "@/lib/bootstrap";
import { json } from "@/lib/http";
import { route } from "@/lib/api-route";
import { publicAuthConfig } from "@/lib/service-credentials";
import { registrationEnabled } from "@/lib/site-settings";

export const runtime = "nodejs";

/**
 * 登录页开局打这一个接口，问「这套部署开了哪些登录方式」。
 *
 * 未登录可访问，所以只回四样东西：哪几种第三方登录可用、人机验证的 site key
 * （它本来就必须出现在页面上才能渲染那个组件）、邮箱验证码通不通、以及
 * 注册开着没有。任何密钥都不在这里出现。
 *
 * `registrationEnabled` 只用来决定登录页要不要显示「注册」那个页签 ——
 * 真正的拦截在服务端（见 lib/site-settings.ts），改这个字段绕不过去。
 *
 * 拿不到配置时不要让登录页打不开 —— 降级成「只有邮箱密码登录」，
 * 这是零配置部署的默认形态。
 */
export const GET = route(async () => {
  await ensureBootstrapped();

  try {
    const [config, registration] = await Promise.all([publicAuthConfig(), registrationEnabled()]);
    return json({ ...config, registrationEnabled: registration });
  } catch {
    return json({
      oauth: [],
      turnstileSiteKey: null,
      emailCodeEnabled: false,
      // 读不到就按开放算：和键不存在时的默认值一致，且真关了的话服务端仍然会拒
      registrationEnabled: true,
    });
  }
});
