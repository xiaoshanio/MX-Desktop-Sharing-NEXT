import { currentUser } from "@/lib/auth";
import { ensureBootstrapped } from "@/lib/bootstrap";
import { json, route } from "@/lib/http";

export const runtime = "nodejs";

/** 前端启动时打这一个接口拿登录态。顺便兜底触发一次启动引导。 */
export const GET = route(async () => {
  await ensureBootstrapped();
  const user = await currentUser();

  return json({
    user: user
      ? { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
      : null,
  });
});
