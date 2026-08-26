import type { User } from "@/db/schema";
import { accentFor, type CardAccent } from "./identity";

/**
 * 顶栏和侧栏需要的那点用户信息。
 *
 * 每个页面的 server component 都要构造一份，抽成一个函数是为了不让五个地方
 * 各自漏掉一个字段 —— 漏了的表现是「某些页面顶栏头像变成默认底色」这种很难定位的不一致。
 *
 * 刻意只带呈现用的字段：这份数据会作为 props 序列化进 HTML，
 * 密码哈希、邮箱验证时间之类的东西不该出现在页面源码里。
 */
export type ShellUser = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  cardAccent: CardAccent;
  /** 头像最后更新时间（ISO），null = 用底色 + 首字母 */
  avatarAt: string | null;
  /** 首次进房的推流地址引导看过了没有 */
  ingressTipSeen: boolean;
};

export function toShellUser(user: User): ShellUser {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    cardAccent: accentFor(user.id, user.cardAccent),
    avatarAt: user.avatarUpdatedAt?.toISOString() ?? null,
    ingressTipSeen: user.ingressTipSeenAt !== null,
  };
}
