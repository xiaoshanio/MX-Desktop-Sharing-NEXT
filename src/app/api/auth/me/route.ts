import { currentUser } from "@/lib/auth";
import { ensureBootstrapped } from "@/lib/bootstrap";
import { json, route } from "@/lib/http";
import { accentFor } from "@/lib/identity";

export const runtime = "nodejs";

/** 前端启动时打这一个接口拿登录态。顺便兜底触发一次启动引导。 */
export const GET = route(async () => {
  await ensureBootstrapped();
  const user = await currentUser();

  return json({
    user: user
      ? {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          // 顶栏那个头像要用；没上传过就是 null，前端回退到底色 + 首字母
          cardAccent: accentFor(user.id, user.cardAccent),
          avatarAt: user.avatarUpdatedAt?.toISOString() ?? null,
          /** 首次进房的推流引导弹过了没有 */
          ingressTipSeen: user.ingressTipSeenAt !== null,
        }
      : null,
  });
});
