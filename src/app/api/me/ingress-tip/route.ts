import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { json, route } from "@/lib/http";

export const runtime = "nodejs";

/**
 * 记下「推流地址在哪」的新手引导已经看过了。
 *
 * 那个引导只在**第一次进任意房间**时弹一次，所以标记落在 users 上而不是房间上。
 * 重复调用只是把时间戳往后挪，没有副作用，所以不需要额外的并发保护
 * （两个标签页同时进房各写一次也无所谓）。
 */
export const POST = route(async () => {
  const user = await requireUser();

  const [updated] = await db
    .update(users)
    .set({ ingressTipSeenAt: new Date() })
    .where(eq(users.id, user.id))
    .returning({ seenAt: users.ingressTipSeenAt });

  return json({ seenAt: updated?.seenAt?.toISOString() ?? null });
});

/** 清掉标记，让用户能再看一次引导（个人中心里那个「重看引导」）。 */
export const DELETE = route(async () => {
  const user = await requireUser();
  await db.update(users).set({ ingressTipSeenAt: null }).where(eq(users.id, user.id));
  return json({ ok: true });
});
