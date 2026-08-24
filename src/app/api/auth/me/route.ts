import { currentUser } from "@/lib/auth";
import { json, route } from "@/lib/http";
import { isInitialized } from "@/lib/setup";

export const runtime = "nodejs";

/** 前端启动时打这一个接口拿全部引导状态。 */
export const GET = route(async () => {
  const [user, initialized] = await Promise.all([currentUser(), isInitialized()]);
  return json({
    initialized,
    user: user
      ? { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
      : null,
  });
});
