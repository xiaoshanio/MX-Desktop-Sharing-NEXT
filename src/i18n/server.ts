import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE, resolveLocale, type Locale } from "./config";
import { getT, type TFunction } from "./translate";

/**
 * 服务端组件用的语言判定。
 *
 * 只在服务端组件里 import 这个文件 —— 它碰 `next/headers`，进客户端 bundle 会报错。
 * 路由处理器请用 ./request（那边从 Request 对象上取，不需要 headers()）。
 *
 * 读 cookie/headers 会让页面变成动态渲染。本项目所有页面都已经是
 * `dynamic = "force-dynamic"`（登录态决定渲染结果），所以没有额外代价。
 */
export async function serverLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get("accept-language"),
  );
}

export async function serverT(): Promise<TFunction> {
  return getT(await serverLocale());
}
