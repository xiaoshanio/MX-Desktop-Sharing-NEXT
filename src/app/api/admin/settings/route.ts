import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { json, parseOr400, readJson } from "@/lib/http";
import { route } from "@/lib/api-route";
import { registrationEnabled, setRegistrationEnabled } from "@/lib/site-settings";
import { adminUpdateSettingsSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * 站点级开关。仅管理员。
 *
 * 和 /api/admin 分开是因为那个端点的 PATCH 是节点专用的（要带 ?nodeId=）。
 * 形状对齐 /api/admin/services：读回整份配置，写完也回整份，前端不用自己拼状态。
 */
export const GET = route(async () => {
  await requireAdmin();
  return json({ settings: { registrationEnabled: await registrationEnabled() } });
});

export const PATCH = route(async (req) => {
  const admin = await requireAdmin();
  const input = await readJson(req, (raw) => parseOr400(adminUpdateSettingsSchema, raw));

  if (input.registrationEnabled !== undefined) {
    await setRegistrationEnabled(input.registrationEnabled);
    audit({
      actorId: admin.id,
      action: "admin.settings.update",
      detail: { registrationEnabled: input.registrationEnabled },
    });
  }

  return json({ settings: { registrationEnabled: await registrationEnabled() } });
});
