import type { Locale, TFunction } from "@/i18n";
import type { BadgeTone } from "@/ui";

/**
 * 房间成员角色 → 本地化名字。未知值原样显示，方便排查后端新增的角色。
 *
 * 收 `t` 而不是自己去拿上下文：这几个函数同时被客户端组件和服务端组件调用，
 * 自己取上下文就得分成两份实现。
 */
export function roleLabel(t: TFunction, role: string): string {
  switch (role) {
    case "owner":
      return t("label.role.owner");
    case "publisher":
      return t("label.role.publisher");
    case "viewer":
      return t("label.role.viewer");
    default:
      return role;
  }
}

export function roleTone(role: string): BadgeTone {
  switch (role) {
    case "owner":
      return "accent";
    case "publisher":
      return "info";
    default:
      return "neutral";
  }
}

/** 节点体检结果 → 徽章文案与色调。null = 还没检测过。 */
export function healthLabel(t: TFunction, ok: boolean | null): { text: string; tone: BadgeTone } {
  if (ok === null) return { text: t("label.health.unknown"), tone: "neutral" };
  return ok
    ? { text: t("label.health.ok"), tone: "success" }
    : { text: t("label.health.bad"), tone: "error" };
}

/**
 * 时间戳 → 当前语言的短格式。
 *
 * 用 Intl 而不是自己拼：月/日的顺序、24 还是 12 小时制、分隔符都随语言不同
 * （en 是 08/27, 02:30 PM；de 是 27.08., 14:30；ja 是 08/27 14:30）。
 */
export function formatTime(locale: Locale, iso: string): string {
  return new Date(iso).toLocaleString(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
