"use client";

import type { ReactNode } from "react";

import { initialOf, userImageUrl, type CardAccent } from "@/lib/identity";
import { cx } from "@/ui";

export interface AvatarProps {
  userId: string;
  displayName: string;
  accent: CardAccent;
  /** 头像最后更新时间（ISO）。null = 没上传过，显示底色 + 首字母。 */
  avatarAt?: string | null;
  size?: number;
  className?: string;
}

/**
 * 头像。有自定义图就显示图，没有就显示「底色 + 名字首字母」。
 *
 * 用原生 <img> 而不是 next/image：图片来自 /api/users/[id]/image，是一个要求登录的
 * 动态端点，next/image 的优化器会去无 cookie 地取一次然后 401。而且这些图已经在
 * 上传时压过、URL 上带着不变的版本号可以长缓存，优化器帮不上什么。
 */
export function Avatar({
  userId,
  displayName,
  accent,
  avatarAt = null,
  size = 32,
  className,
}: AvatarProps): ReactNode {
  const src = userImageUrl(userId, "avatar", avatarAt);

  return (
    <span
      className={cx("mx-avatar", className)}
      data-accent={accent}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.42)) }}
    >
      {src ? (
        <img src={src} alt="" className="mx-avatar__img" width={size} height={size} />
      ) : (
        <span aria-hidden="true">{initialOf(displayName)}</span>
      )}
    </span>
  );
}
