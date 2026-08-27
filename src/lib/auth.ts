import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { forbidden, unauthorized } from "./http";

const COOKIE = "mxds_session";
const TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 天

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type SessionCookie = {
  name: string;
  value: string;
  expiresAt: Date;
  options: { httpOnly: true; sameSite: "lax"; secure: boolean; path: "/"; expires: Date };
};

/**
 * 建会话行并返回该下发的 cookie，**不自己写响应头**。
 *
 * 拆出这一层是因为 OAuth 回调返回的是一个跳转响应。`cookies().set()` 在
 * Route Handler 里能不能被合并进 `Response.redirect()` 造出来的那个不可变响应，
 * 属于框架内部细节 —— 赌错了的后果是「第三方登录一切正常，就是登不进去」，
 * 而且本地和线上表现可能不一致。所以那条路径显式地把 cookie 挂到自己构造的响应上。
 */
export async function issueSession(userId: string): Promise<SessionCookie> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });

  return {
    name: COOKIE,
    value: token,
    expiresAt,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    },
  };
}

/** 建会话并写进 cookie jar。给「返回 JSON」的那些登录接口用。 */
export async function createSession(userId: string): Promise<void> {
  const cookie = await issueSession(userId);
  const jar = await cookies();
  jar.set(cookie.name, cookie.value, cookie.options);
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  jar.delete(COOKIE);
}

/** 当前用户，未登录返回 null。会话过期的行留给定时清理，这里只做时间过滤。 */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const user = rows[0]?.user ?? null;
  if (!user || user.isDisabled) return null;
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") throw forbidden("api.needAdmin");
  return user;
}
