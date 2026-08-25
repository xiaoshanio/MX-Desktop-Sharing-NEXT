import type { BadgeTone } from "@/ui";

/** 房间成员角色的中文名。未知值原样显示，方便排查后端新增的角色。 */
export function roleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "房主";
    case "publisher":
      return "可推流";
    case "viewer":
      return "仅观看";
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
export function healthLabel(ok: boolean | null): { text: string; tone: BadgeTone } {
  if (ok === null) return { text: "未检测", tone: "neutral" };
  return ok ? { text: "正常", tone: "success" } : { text: "异常", tone: "error" };
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
