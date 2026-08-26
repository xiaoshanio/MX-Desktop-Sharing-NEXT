import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { userAssets, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { json, parseOr400, readJson, route } from "@/lib/http";
import { MAX_AVATAR_BYTES, MAX_BANNER_BYTES, decodeDataUrl } from "@/lib/images";
import { accentFor } from "@/lib/identity";
import { updateProfileSchema } from "@/lib/validation";

export const runtime = "nodejs";

type Kind = "avatar" | "banner";

/** 我自己的资料。个人中心开局打这个。 */
export const GET = route(async () => {
  const user = await requireUser();

  return json({
    profile: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      cardAccent: accentFor(user.id, user.cardAccent),
      /** null = 没上传过，前端用底色 + 首字母兜底 */
      avatarAt: user.avatarUpdatedAt?.toISOString() ?? null,
      bannerAt: user.bannerUpdatedAt?.toISOString() ?? null,
      hasPassword: user.passwordHash !== null,
      emailVerified: user.emailVerifiedAt !== null,
    },
  });
});

async function writeAsset(userId: string, kind: Kind, dataUrl: string): Promise<Date> {
  const limit = kind === "avatar" ? MAX_AVATAR_BYTES : MAX_BANNER_BYTES;
  const image = decodeDataUrl(dataUrl, limit);
  const updatedAt = new Date();

  await db
    .insert(userAssets)
    .values({
      userId,
      kind,
      mimeType: image.mimeType,
      data: image.base64,
      byteSize: image.byteSize,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: [userAssets.userId, userAssets.kind],
      set: {
        mimeType: image.mimeType,
        data: image.base64,
        byteSize: image.byteSize,
        updatedAt,
      },
    });

  return updatedAt;
}

/**
 * 改自己的资料：显示名、卡片底色、头像、背景图。
 *
 * 三种取值的语义必须区分开（schema 里用 nullable + optional 表达）：
 *   不传    这次不动它
 *   null   删掉，回到默认底色
 *   字符串  换成这张新图
 * 混淆的话「只想改个昵称」会顺手把头像清空。
 */
export const PATCH = route(async (req) => {
  const user = await requireUser();
  const input = await readJson(req, (raw) => parseOr400(updateProfileSchema, raw));

  const patch: Partial<typeof users.$inferInsert> = {};
  if (input.displayName !== undefined) patch.displayName = input.displayName;
  // cardAccent 传 null 是「回到按 id 随机分配的那一档」，所以直接写 null 而不是跳过
  if (input.cardAccent !== undefined) patch.cardAccent = input.cardAccent;

  for (const kind of ["avatar", "banner"] as const) {
    const value = input[kind];
    if (value === undefined) continue;

    const column = kind === "avatar" ? "avatarUpdatedAt" : "bannerUpdatedAt";
    if (value === null) {
      await db
        .delete(userAssets)
        .where(and(eq(userAssets.userId, user.id), eq(userAssets.kind, kind)));
      patch[column] = null;
    } else {
      patch[column] = await writeAsset(user.id, kind, value);
    }
  }

  if (Object.keys(patch).length > 0) {
    await db.update(users).set(patch).where(eq(users.id, user.id));
    audit({
      actorId: user.id,
      action: "profile.update",
      // 只记「改了哪几项」，不记内容 —— 图片字节没必要进审计日志
      detail: { fields: Object.keys(patch) },
    });
  }

  /**
   * 回显最终状态。
   *
   * 这里必须用「这一次有没有碰过这个字段」来判断，不能写成
   * `patch.avatarUpdatedAt ?? user.avatarUpdatedAt` —— 删图时 patch 里存的是 null，
   * `??` 会把它当成「没设置」而回落到旧时间戳，前端于是拿着一个已经被删掉的
   * 版本号去请求图片，界面上表现为「删了但还显示着，刷新才消失」。
   */
  const finalAvatarAt = "avatarUpdatedAt" in patch ? patch.avatarUpdatedAt : user.avatarUpdatedAt;
  const finalBannerAt = "bannerUpdatedAt" in patch ? patch.bannerUpdatedAt : user.bannerUpdatedAt;

  return json({
    profile: {
      displayName: patch.displayName ?? user.displayName,
      cardAccent: accentFor(
        user.id,
        input.cardAccent !== undefined ? input.cardAccent : user.cardAccent,
      ),
      avatarAt: finalAvatarAt?.toISOString() ?? null,
      bannerAt: finalBannerAt?.toISOString() ?? null,
    },
  });
});
