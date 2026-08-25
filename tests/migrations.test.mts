import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { getTableName, isTable } from "drizzle-orm";

import * as schema from "../src/db/schema.ts";

/**
 * 迁移产物的完整性测试。
 *
 * 起因是一个真实事故：`drizzle/meta/` 曾被 .gitignore 挡掉，于是 clone 下来的仓库
 * 没有 `_journal.json`。而 drizzle-kit 遇到缺失的 journal 不会报错 —— 它会**默默建一个
 * entries 为空的**（源码里的 `dryJournal`），于是 `npm run db:migrate` 一声不响地
 * 什么都不干，库里一张表都没有。文档却让所有人跑这条命令。
 *
 * 所以这里两件事都要守：journal 必须在且覆盖所有 .sql；真正跑一遍 migrator 必须
 * 建出 schema 里声明的每一张表。
 *
 * 关于 meta 下的 snapshot：`migrate` 不读它们，只有 `generate` 需要（拿最新那个和
 * 当前 schema 做 diff）。仓库里只保留了 `0001_snapshot.json`（= 当前 schema 的状态），
 * 中间态的 `0000_snapshot.json` 没有重建 —— generate 只看最新的那个，实测
 * 「No schema changes」符合预期。
 */

const MIGRATIONS_DIR = new URL("../drizzle/", import.meta.url);
const JOURNAL = new URL("meta/_journal.json", MIGRATIONS_DIR);

function sqlFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

function schemaTables(): string[] {
  const exported: unknown[] = Object.values(schema);
  return exported
    .filter(isTable)
    .map((table) => getTableName(table))
    .sort();
}

describe("迁移产物", () => {
  it("meta/_journal.json 必须被提交（缺了 db:migrate 会静默空转）", () => {
    assert.ok(existsSync(JOURNAL), "drizzle/meta/_journal.json 不存在");
  });

  it("journal 覆盖了 drizzle/ 下的每一个 .sql，且顺序连续", () => {
    const journal = JSON.parse(readFileSync(JOURNAL, "utf8")) as {
      entries: Array<{ idx: number; tag: string; when: number }>;
    };

    const tags = journal.entries.map((e) => e.tag).sort();
    const files = sqlFiles().map((f) => f.replace(/\.sql$/, ""));
    assert.deepEqual(tags, files, "journal 里的 tag 和 .sql 文件对不上");

    journal.entries.forEach((entry, i) => {
      assert.equal(entry.idx, i, `第 ${i} 条的 idx 不连续`);
    });

    // when 必须严格递增 —— migrator 按它排序决定应用顺序
    const whens = journal.entries.map((e) => e.when);
    for (let i = 1; i < whens.length; i++) {
      assert.ok(whens[i]! > whens[i - 1]!, `第 ${i} 条的 when 没有递增`);
    }
  });
});

describe("跑真实 migrator", () => {
  it("建出 schema 里声明的全部表，且可重复执行", async () => {
    const client = new PGlite();
    const db = drizzle(client);
    const folder = new URL(".", MIGRATIONS_DIR).pathname.replace(/^\/([A-Za-z]:)/, "$1");

    await migrate(db, { migrationsFolder: folder });

    const rows = await client.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = current_schema()",
    );
    const present = rows.rows.map((r) => r.table_name).filter((n) => !n.startsWith("__drizzle"));
    const missing = schemaTables().filter((t) => !present.includes(t));
    assert.deepEqual(missing, [], `迁移没建出这些表：${missing.join("、")}`);

    const applied = await client.query<{ n: number }>(
      'select count(*)::int as n from "drizzle"."__drizzle_migrations"',
    );
    assert.equal(applied.rows[0]!.n, sqlFiles().length, "登记的迁移条数和文件数不一致");

    // 幂等：再跑一遍不该重复应用
    await migrate(db, { migrationsFolder: folder });
    const again = await client.query<{ n: number }>(
      'select count(*)::int as n from "drizzle"."__drizzle_migrations"',
    );
    assert.equal(again.rows[0]!.n, sqlFiles().length, "重复执行时又应用了一遍");

    await client.close();
  });
});
