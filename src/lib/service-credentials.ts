import { eq } from "drizzle-orm";

import { db } from "@/db";
import { serviceCredentials, type ServiceCredential } from "@/db/schema";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";
import { ensureEncryptionKey } from "./key-store";
import { badRequest } from "./http";

/**
 * 第三方服务凭据的读写口子。**刻意不走环境变量**。
 *
 * 为什么落库更安全（而不是「图方便」）：
 * - 密钥本身是 AES-256-GCM 加密后才写进 service_credentials.secret_enc 的，
 *   而那把主密钥可以用 CREDENTIAL_ENCRYPTION_KEY 放在数据库之外。也就是说
 *   拖走整个数据库 dump 的人拿不到任何一个第三方密钥。
 * - 环境变量在 Vercel 上对每个有项目读权限的人都是明文可见的，还会被打进构建日志、
 *   随 `printenv` 泄进任何一次调试输出。落库 + 加密把可见面收到「管理员在网页里改」这一处。
 * - 换密钥不需要重新部署，改完立刻生效。
 *
 * 明文密钥只在本模块内部出现，任何接口回显都走 describe() 的掩码。
 */

export type ServiceName = "github" | "google" | "turnstile" | "resend";

export type ServiceMeta = { fromName?: string };

export type ServiceDescriptor = {
  service: ServiceName;
  /** 可以公开的那一半：Client ID / Site Key / 发件地址 */
  publicValue: string;
  /** 掩码后的密钥，只够用来确认「配的是不是我想的那把」 */
  secretMask: string;
  isEnabled: boolean;
  meta: ServiceMeta;
  updatedAt: string;
};

/** 解密后的凭据。只在服务端内部流转，绝不放进任何响应体。 */
export type ResolvedCredential = {
  service: ServiceName;
  publicValue: string;
  secret: string;
  meta: ServiceMeta;
};

async function row(service: ServiceName): Promise<ServiceCredential | null> {
  const [found] = await db
    .select()
    .from(serviceCredentials)
    .where(eq(serviceCredentials.service, service))
    .limit(1);
  return found ?? null;
}

/** 取一套可用的凭据。没配、被停用、或解不开时返回 null —— 调用方据此降级。 */
export async function getCredential(service: ServiceName): Promise<ResolvedCredential | null> {
  const found = await row(service);
  if (!found || !found.isEnabled) return null;

  await ensureEncryptionKey();
  try {
    return {
      service,
      publicValue: found.publicValue,
      secret: decryptSecret(found.secretEnc),
      meta: (found.meta as ServiceMeta | null) ?? {},
    };
  } catch {
    // 主密钥换过、或密文损坏。这时候当成「没配」而不是抛错，
    // 否则一条坏数据会让整个登录页打不开。
    console.error(`[service-credentials] ${service} 的密钥解不开，已按未配置处理。`);
    return null;
  }
}

/** 同上，但拿不到就抛一个能看懂的 400 —— 给「这个功能必须有凭据」的路径用。 */
export async function requireCredential(service: ServiceName): Promise<ResolvedCredential> {
  const found = await getCredential(service);
  if (!found) {
    throw badRequest("api.svc.notConfigured", undefined, { name: LABELS[service] });
  }
  return found;
}

/**
 * 服务名 → 展示名。
 *
 * 只用产品名（"GitHub"、"Turnstile"），不带「登录」「人机验证」这类后缀 ——
 * 后缀属于要翻译的文案，而这个值会被塞进 `api.svc.notConfigured` 的
 * `{name}` 占位符里，那句话本身已经在语言包里说清楚是「还没有配置」了。
 */
export const LABELS: Record<ServiceName, string> = {
  github: "GitHub",
  google: "Google",
  turnstile: "Turnstile",
  resend: "Resend",
};

export async function upsertCredential(input: {
  service: ServiceName;
  publicValue: string;
  /** 省略 = 保留库里原有的密钥（管理员只想改 Client ID 或开关时不必重新粘密钥） */
  secret?: string;
  isEnabled: boolean;
  meta?: ServiceMeta;
}): Promise<void> {
  await ensureEncryptionKey();

  let secretEnc: string;
  if (input.secret && input.secret.trim() !== "") {
    secretEnc = encryptSecret(input.secret.trim());
  } else {
    const existing = await row(input.service);
    if (!existing) throw badRequest("api.svc.firstSecretRequired");
    secretEnc = existing.secretEnc;
  }

  await db
    .insert(serviceCredentials)
    .values({
      service: input.service,
      publicValue: input.publicValue.trim(),
      secretEnc,
      isEnabled: input.isEnabled,
      meta: (input.meta ?? {}) as never,
    })
    .onConflictDoUpdate({
      target: serviceCredentials.service,
      set: {
        publicValue: input.publicValue.trim(),
        secretEnc,
        isEnabled: input.isEnabled,
        meta: (input.meta ?? {}) as never,
        updatedAt: new Date(),
      },
    });
}

export async function deleteCredential(service: ServiceName): Promise<void> {
  await db.delete(serviceCredentials).where(eq(serviceCredentials.service, service));
}

/** 管理后台用的清单：带掩码，不带明文。 */
export async function describeAll(): Promise<ServiceDescriptor[]> {
  const rows = await db.select().from(serviceCredentials);
  await ensureEncryptionKey().catch(() => {});

  return rows.map((found) => {
    let secretMask = "api.svc.maskUndecryptable";
    try {
      secretMask = maskSecret(decryptSecret(found.secretEnc));
    } catch {
      /* 主密钥换过 —— 掩码就照上面那句显示 */
    }
    return {
      service: found.service,
      publicValue: found.publicValue,
      secretMask,
      isEnabled: found.isEnabled,
      meta: (found.meta as ServiceMeta | null) ?? {},
      updatedAt: found.updatedAt.toISOString(),
    };
  });
}

/**
 * 登录页要知道的那点信息：哪几种第三方登录可用、人机验证的 site key 是什么。
 * 未登录也能打，所以除了 site key（本来就要出现在页面 HTML 里）什么都不给。
 */
export async function publicAuthConfig(): Promise<{
  oauth: Array<{ provider: "github" | "google" }>;
  turnstileSiteKey: string | null;
  emailCodeEnabled: boolean;
}> {
  const rows = await db.select().from(serviceCredentials);
  const enabled = new Map(rows.filter((r) => r.isEnabled).map((r) => [r.service, r]));

  const oauth: Array<{ provider: "github" | "google" }> = [];
  for (const provider of ["github", "google"] as const) {
    if (enabled.get(provider)) oauth.push({ provider });
  }

  return {
    oauth,
    turnstileSiteKey: enabled.get("turnstile")?.publicValue ?? null,
    emailCodeEnabled: enabled.has("resend"),
  };
}
