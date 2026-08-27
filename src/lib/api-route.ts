import { tFromRequest } from "@/i18n/request";
import { ApiError } from "./http";

/**
 * 包住 route handler：把 ApiError 翻成响应，其余异常记日志后统一 500。
 *
 * 为什么单独一个文件而不是放在 http.ts 里：这是整条链上**唯一**需要请求上下文
 * （因而需要 i18n）的一环。http.ts 因此可以保持零项目内依赖 —— 它的错误约定、
 * SQLSTATE 解释、zod 校验转换都能被 tests/validation.test.mts 直接 import
 * 并单元测试，不必先把路径别名和 ESM 解析伺候好。
 * 和 validation.ts「保持纯数据描述」是同一个取舍。
 */
export function route<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<Response>,
) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      // 消息键 → 调用者语言的成品文案，全站只在这一处做
      const t = tFromRequest(req);

      if (err instanceof ApiError) {
        return Response.json(
          {
            error: err.code,
            message: t.raw(err.message, err.params),
            detail: err.detail ?? null,
          },
          { status: err.status },
        );
      }
      console.error("[api] uncaught", err);
      return Response.json({ error: "internal", message: t("api.internal") }, { status: 500 });
    }
  };
}
