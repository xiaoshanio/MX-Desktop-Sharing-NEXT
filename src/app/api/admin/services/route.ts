import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { badRequest, json, parseOr400, readJson, route } from "@/lib/http";
import {
  deleteCredential,
  describeAll,
  upsertCredential,
  type ServiceName,
} from "@/lib/service-credentials";
import { appUrl } from "@/lib/url";
import { upsertServiceSchema } from "@/lib/validation";

export const runtime = "nodejs";

const SERVICES = new Set<ServiceName>(["github", "google", "turnstile", "resend"]);

/**
 * 第三方服务凭据的管理接口。仅管理员。
 *
 * 回显只带掩码，**永不回传明文密钥** —— 管理员想确认填对了看掩码的首尾就够，
 * 而一个「能把密钥读回来」的接口迟早会被别的东西顺手调用。
 * 想换密钥就重新粘一次。
 */
export const GET = route(async (req) => {
  await requireAdmin();
  const base = appUrl(req);

  return json({
    services: await describeAll(),
    /**
     * OAuth 回调地址要一字不差地填到 GitHub / Google 的控制台里，
     * 填错是接第三方登录时最常见的坑，所以这里直接把该填的字符串算好给出来。
     */
    callbacks: {
      github: `${base}/api/auth/oauth/github/callback`,
      google: `${base}/api/auth/oauth/google/callback`,
    },
  });
});

export const PUT = route(async (req) => {
  const admin = await requireAdmin();
  const input = await readJson(req, (raw) => parseOr400(upsertServiceSchema, raw));

  await upsertCredential({
    service: input.service,
    publicValue: input.publicValue,
    secret: input.secret,
    isEnabled: input.isEnabled,
    meta: input.fromName ? { fromName: input.fromName } : {},
  });

  audit({
    actorId: admin.id,
    action: "service.configure",
    // 记「配了哪个服务、开没开」，绝不记 publicValue 之外的任何值
    detail: { service: input.service, isEnabled: input.isEnabled },
  });

  return json({ services: await describeAll() });
});

export const DELETE = route(async (req) => {
  const admin = await requireAdmin();

  const service = new URL(req.url).searchParams.get("service");
  if (!service || !SERVICES.has(service as ServiceName)) throw badRequest("service 参数不合法");

  await deleteCredential(service as ServiceName);
  audit({ actorId: admin.id, action: "service.delete", detail: { service } });

  return json({ services: await describeAll() });
});
