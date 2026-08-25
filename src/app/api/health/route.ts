import { getTableName, isTable, sql, type Table } from "drizzle-orm";

import { db, schema } from "@/db";
import { ensureBootstrapped } from "@/lib/bootstrap";
import { encryptionKeySource } from "@/lib/key-store";
import { describeDbError, json, route } from "@/lib/http";

export const runtime = "nodejs";

/**
 * schema 里声明的所有表名。从 schema 模块推导，避免另维护一份会漂移的清单。
 * 该模块除了表还导出 relations 对象，靠 isTable 筛掉。
 */
function expectedTables(): string[] {
  // 先摊平成 unknown[]：schema 里每张表的 name 都是字面量类型，直接在那个联合上
  // 做类型守卫会因为「string 不能赋给 "users"」这类报错卡住。
  const exported: unknown[] = Object.values(schema);
  return exported
    .filter((value): value is Table => isTable(value))
    .map((table) => getTableName(table))
    .sort();
}

/**
 * 读出当前 schema 下真实存在的表。
 *
 * neon-http 的 db.execute() 返回 `{ rows }`，但别的驱动直接返回数组 —— 两种都兜住，
 * 免得换驱动时这里静默失灵。
 */
async function existingTables(): Promise<Set<string>> {
  const raw: unknown = await db.execute(
    sql`select table_name from information_schema.tables where table_schema = current_schema()`,
  );
  const rows = Array.isArray(raw) ? raw : ((raw as { rows?: unknown[] }).rows ?? []);
  const names = rows
    .map((row) => (row as { table_name?: unknown }).table_name)
    .filter((name): name is string => typeof name === "string");
  return new Set(names);
}

/**
 * 健康检查。配错了环境变量时，这里给出可读的诊断，而不是让人对着 500 页面猜。
 *
 * 故意不需要登录，所以回显的驱动错误一律先过 describeDbError()：它会顺着 cause 链
 * 挖出真实原因、按 SQLSTATE 补一句可操作的指引，并抹掉连接串里的口令。
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
      checks.database = { ok: false, detail: `连不上：${describeDbError(err).message}` };
    }
  }

  // 连得上不等于建过表。建表是手动步骤（不在构建里跑），漏掉的症状很有迷惑性：
  // 数据库显示正常，但凡是碰到表的接口全挂。这里直接点出缺哪几张，不靠猜报错字符串。
  if (checks.database?.ok) {
    try {
      const present = await existingTables();
      const missing = expectedTables().filter((name) => !present.has(name));
      checks.tables =
        missing.length === 0
          ? { ok: true, detail: `${expectedTables().length} 张表齐了` }
          : {
              ok: false,
              detail:
                `缺 ${missing.length} 张表（${missing.join("、")}）—— ` +
                `迁移没跑过或只跑了一半，对着这个库执行一次 npm run db:migrate。`,
            };
    } catch (err) {
      checks.tables = { ok: false, detail: `查不到表清单：${describeDbError(err).message}` };
    }
  }

  // 空字符串也算没设 —— 照抄 .env.example 忘了填是最常见的踩坑
  const hasAdminPassword = (process.env.ADMIN_PASSWORD ?? "").trim() !== "";
  checks.adminPassword = {
    ok: hasAdminPassword,
    detail: hasAdminPassword
      ? "已设置"
      : "缺少 ADMIN_PASSWORD（空字符串也算）—— 管理员账户不会被创建",
  };

  // 表没建齐就别跑引导了：它必然失败，只会再抛一条同源的报错盖住上面的结论
  if (checks.database?.ok && checks.tables?.ok) {
    const boot = await ensureBootstrapped();
    checks.bootstrap = boot.ok
      ? {
          ok: true,
          detail: boot.adminConfigured
            ? `就绪，管理员邮箱 ${boot.adminEmail}`
            : "已就绪，但管理员账户没创建（ADMIN_PASSWORD 为空）",
        }
      : { ok: false, detail: boot.error ?? "启动引导失败" };
  }

  const src = encryptionKeySource();
  checks.encryptionKey = {
    // 前面的环节没过时密钥必然还没加载，那不是独立的故障，别再报一个红
    ok: true,
    detail:
      src === "env"
        ? "来自 CREDENTIAL_ENCRYPTION_KEY"
        : src
          ? "自动生成并存于数据库（要更强的隔离就显式设置该变量）"
          : "尚未加载 —— 先解决上面标红的项",
  };

  const ok = Object.values(checks).every((c) => c.ok);
  return json({ ok, checks }, { status: ok ? 200 : 503 });
});
