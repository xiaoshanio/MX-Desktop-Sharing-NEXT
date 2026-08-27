import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { oauthAccounts, userAssets, users, type User } from "@/db/schema";
import { ApiError } from "./http";
import { fetchAvatarBytes, type OauthIdentity } from "./oauth";
import { assertRegistrationOpen } from "./site-settings";

/**
 * 「第三方身份 → 本站账号」的落地逻辑。
 *
 * 这个文件是整套第三方登录里最容易出安全事故的地方，所以把判断写死在一处，
 * 不散落到各个 route 里。
 *
 * 「站点关闭注册」也守在这里，理由同上：本模块的两个入口都是
 * 「有账号就登录，没账号就当场建一个」，只有后半句该被拦下，前半句必须照常放行。
 * 换句话说，关掉注册之后已有账号的人仍然能用 GitHub / Google / 邮箱验证码登录。
 */

/**
 * GitHub 允许把邮箱设为私密。这种情况下用它官方的 noreply 约定合成一个，
 * 而不是留空 —— users.email 是 not null + 唯一索引，也是后续「按邮箱拉人进房」的键。
 */
function fallbackEmail(identity: OauthIdentity): string {
  return `${identity.provider}-${identity.providerAccountId}@users.noreply.${
    identity.provider === "github" ? "github.com" : "google.com"
  }`;
}

async function storeAvatar(userId: string, avatarUrl: string | null): Promise<boolean> {
  const bytes = await fetchAvatarBytes(avatarUrl);
  if (!bytes) return false;

  await db
    .insert(userAssets)
    .values({
      userId,
      kind: "avatar",
      mimeType: bytes.mimeType,
      data: bytes.base64,
      byteSize: bytes.byteSize,
    })
    .onConflictDoUpdate({
      target: [userAssets.userId, userAssets.kind],
      set: {
        mimeType: bytes.mimeType,
        data: bytes.base64,
        byteSize: bytes.byteSize,
        updatedAt: new Date(),
      },
    });
  return true;
}

/**
 * 拿第三方身份换一个本站用户。可能是登录已有账号，也可能是当场注册一个。
 *
 * 三条分支，顺序很重要：
 *
 * 1. **已经绑过** —— 按 (provider, providerAccountId) 找到绑定行，直接登录。
 *    这是唯一一条「认人」的可靠依据，所以放在最前面。
 *
 * 2. **没绑过，但第三方确认了邮箱，且本站已有同邮箱账号** —— 自动绑定并登录。
 *    安全前提是 `emailVerified`：第三方替我们证明了「这个邮箱确实归这个人」。
 *
 * 3. **没绑过，本站也没有这个邮箱** —— 新建账号（无密码）。
 *    这一条是唯一会建号的分支，所以「站点关闭注册」只拦它：
 *    第 1、2 条都是登录已有账号，关不关注册都放行。
 *
 * 刻意**不做**的一件事：邮箱没被第三方验证过时，绝不自动绑到同邮箱的本站账号上。
 * 那是教科书级的账号接管 —— 攻击者在第三方注册一个 victim@example.com 的账号
 * （不验证），一登录就顶掉了受害者的本站账号。这种情况直接拒绝，让本人先用密码
 * 登录再去个人中心绑定。
 */
export async function resolveOauthLogin(identity: OauthIdentity): Promise<User> {
  const [linked] = await db
    .select({ user: users })
    .from(oauthAccounts)
    .innerJoin(users, eq(users.id, oauthAccounts.userId))
    .where(
      and(
        eq(oauthAccounts.provider, identity.provider),
        eq(oauthAccounts.providerAccountId, identity.providerAccountId),
      ),
    )
    .limit(1);

  if (linked) {
    if (linked.user.isDisabled) {
      throw new ApiError(403, "account_disabled", "api.account.disabled");
    }
    return linked.user;
  }

  const email = identity.email ?? fallbackEmail(identity);

  const [existing] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1);

  if (existing) {
    if (!identity.emailVerified) {
      throw new ApiError(
        409,
        "email_not_verified",
        "api.account.unverifiedLink",
        undefined,
        { email, provider: identity.provider === "github" ? "GitHub" : "Google" },
      );
    }
    if (existing.isDisabled) {
      throw new ApiError(403, "account_disabled", "api.account.disabled");
    }

    await db.insert(oauthAccounts).values({
      provider: identity.provider,
      providerAccountId: identity.providerAccountId,
      userId: existing.id,
    });

    // 已有账号还没有头像时，顺手把第三方那张存下来
    if (!existing.avatarUpdatedAt) {
      const stored = await storeAvatar(existing.id, identity.avatarUrl);
      if (stored) {
        await db
          .update(users)
          .set({ avatarUpdatedAt: new Date(), emailVerifiedAt: existing.emailVerifiedAt ?? new Date() })
          .where(eq(users.id, existing.id));
        return { ...existing, avatarUpdatedAt: new Date() };
      }
    }
    if (!existing.emailVerifiedAt) {
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, existing.id));
    }
    return existing;
  }

  // 全新用户。passwordHash 留空 —— 这个账号只能靠第三方或邮箱验证码进来。
  await assertRegistrationOpen();

  const [created] = await db
    .insert(users)
    .values({
      email,
      displayName: identity.displayName.slice(0, 60),
      passwordHash: null,
      role: "user",
      emailVerifiedAt: identity.emailVerified ? new Date() : null,
    })
    .returning();

  const user = created!;
  await db.insert(oauthAccounts).values({
    provider: identity.provider,
    providerAccountId: identity.providerAccountId,
    userId: user.id,
  });

  const stored = await storeAvatar(user.id, identity.avatarUrl);
  if (stored) {
    const avatarUpdatedAt = new Date();
    await db.update(users).set({ avatarUpdatedAt }).where(eq(users.id, user.id));
    return { ...user, avatarUpdatedAt };
  }

  return user;
}

/**
 * 邮箱验证码登录：有账号就登录，没有就当场建一个。
 *
 * 验证码本身已经证明了「这个邮箱是你的」，所以这里可以放心地按邮箱认人 ——
 * 和 OAuth 那条分支不同，这里的验证是我们自己发的。
 *
 * 关闭注册时只拦「建一个」那半句。判断刻意放在这里而不是发码那一步：
 * 发码接口无论邮箱在不在库里都回同一个响应（见那个 route 的注释），
 * 在那里拦等于把「这个邮箱注册过没有」告诉任何一个来问的人。
 */
export async function resolveEmailCodeLogin(email: string): Promise<User> {
  const [existing] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1);

  if (existing) {
    if (existing.isDisabled) {
      throw new ApiError(403, "account_disabled", "api.account.disabled");
    }
    if (!existing.emailVerifiedAt) {
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, existing.id));
    }
    return existing;
  }

  await assertRegistrationOpen();

  const [created] = await db
    .insert(users)
    .values({
      email,
      // 用邮箱前缀当显示名，之后可以在个人中心改
      displayName: email.split("@")[0]!.slice(0, 60),
      passwordHash: null,
      role: "user",
      emailVerifiedAt: new Date(),
    })
    .returning();

  return created!;
}
