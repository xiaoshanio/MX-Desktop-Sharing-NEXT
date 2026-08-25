import { sql } from "drizzle-orm";

import { db } from "@/db";
import { ensureBootstrapped } from "@/lib/bootstrap";
import { json, route } from "@/lib/http";

export const runtime = "nodejs";

/**
 * 健康检查。配错了环境变量时，这里给出可读的诊断，
 * 而不是让人对着一个 500 页面猜。故意不需要登录 —— 它不泄露任何敏感信息。
 */
export const GET = route(async () => {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  checks.databaseUrl = {
    ok: hasDbUrl,
    detail: hasDbUrl ? "已设置" : "缺少 DATABASE_URL —— 这是唯一必填项",
  };

  if (hasDbUrl) {
    try {
      await db.execute(sql`select 1`);
      checks.database = { ok: true, detail: "连接正常" };
    } catch (err) {
      checks.database = {
        ok: false,
        detail: `连不上：${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  const hasAdminPassword = Boolean(process.env.ADMIN_PASSWORD);
  checks.adminPassword = {
    ok: hasAdminPassword,
    detail: hasAdminPassword ? "已设置" : "缺少 ADMIN_PASSWORD —— 管理员账户不会被创建",
  };

  checks.encryptionKey = {
    ok: true,
    detail: process.env.CREDENTIAL_ENCRYPTION_KEY
      ? "来自 CREDENTIAL_ENCRYPTION_KEY"
      : "自动生成并存于数据库（要更强的隔离就显式设置该变量）",
  };

  if (checks.database?.ok !== false) {
    await ensureBootstrapped();
  }

  const ok = Object.values(checks).every((c) => c.ok);
  return json({ ok, checks }, { status: ok ? 200 : 503 });
});
