import { readConfigValue, writeConfigValue } from "./app-config";
import { ApiError } from "./http";

/**
 * 站点级策略开关。
 *
 * 放在 app_config 里而不是环境变量，理由和第三方凭据一样（见 service-credentials.ts）：
 * 管理员在网页里改，改完立刻生效，不用重新部署。
 */

const REGISTRATION_KEY = "registration_enabled";

/** 关闭注册后，所有「这一步会新建账号」的路径都回这一句。 */
export const REGISTRATION_CLOSED_MESSAGE = "api.registrationClosed";

/**
 * 注册开着没有。
 *
 * 键不存在时默认 **开放** —— 老部署升级上来不该突然把门关上，
 * 而且这也是零配置部署的预期形态。
 */
export async function registrationEnabled(): Promise<boolean> {
  return (await readConfigValue<boolean>(REGISTRATION_KEY)) ?? true;
}

export async function setRegistrationEnabled(enabled: boolean): Promise<void> {
  await writeConfigValue(REGISTRATION_KEY, enabled);
}

/**
 * 「这一步会新建账号」的守卫。放在会真的 insert users 的地方，不放在路由入口 ——
 * 第三方登录和邮箱验证码都是「有账号就登录，没账号就建一个」，
 * 只有后半句该被拦，前半句必须照常放行。
 *
 * 403 而不是 400：这不是参数错，是站点策略不允许，换参数重试也没用。
 */
export async function assertRegistrationOpen(): Promise<void> {
  if (await registrationEnabled()) return;
  throw new ApiError(403, "registration_closed", REGISTRATION_CLOSED_MESSAGE);
}
