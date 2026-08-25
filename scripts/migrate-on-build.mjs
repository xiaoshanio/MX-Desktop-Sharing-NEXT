/**
 * 构建前跑一遍数据库迁移。
 *
 * 为什么放在构建里而不是「首次登录时」：构建是每次部署只跑一次的**单个**进程，
 * 天然没有并发；而 serverless 运行时可能同时冷启动多个实例，neon-http 又不支持
 * 交互式事务（每条语句一次 HTTP），两个实例同时建表就会有一个炸在
 * 「relation already exists」上，把库留在半残状态。构建期失败最多是部署不出去，
 * 运行时失败是线上带着一个建了一半的库在跑。
 *
 * 两种情况刻意都不让构建失败：
 * - 没配 DATABASE_URL：跳过。只想 `next build` 的沙箱/CI 不该被数据库卡住。
 * - 迁移本身报错：**让构建失败**。宁可部署不出去，也别上线一个半残的库。
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// @next/env 是 CJS，没有具名导出，只能走 default
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

// 和 drizzle.config.ts / 应用运行时读同一套 env 文件。真实环境变量优先，
// 不会被 .env.local 覆盖 —— 这点在 Vercel 上很关键。
loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });

if (!process.env.DATABASE_URL) {
  console.log(
    "[build] 没有 DATABASE_URL，跳过迁移。" +
      "部署环境记得配上，否则线上会因为表不存在而起不来（打开 /api/health 能看到）。",
  );
  process.exit(0);
}

const require_ = createRequire(import.meta.url);

// drizzle-kit 的 exports 字段没暴露 ./bin.cjs，直接 resolve 它会 ERR_PACKAGE_PATH_NOT_EXPORTED。
// 所以先 resolve 包入口再拼同目录下的 bin.cjs。不用 node_modules/.bin 的 shim ——
// 那在 Windows 上是 .cmd/.ps1，spawn 起来还得开 shell。
let bin;
try {
  bin = join(dirname(require_.resolve("drizzle-kit")), "bin.cjs");
} catch {
  bin = "";
}

if (!bin || !existsSync(bin)) {
  console.error(
    "[build] 找不到 drizzle-kit 的可执行文件。它是 devDependency —— 构建时别跳过 devDependencies。",
  );
  process.exit(1);
}

console.log("[build] 正在应用数据库迁移…");
const result = spawnSync(process.execPath, [bin, "migrate"], { stdio: "inherit" });

if (result.status !== 0) {
  console.error(
    "\n[build] 迁移失败，构建中止 —— 不把一个可能半残的库带上线。\n" +
      "        本地对着同一个库跑 npm run db:migrate 看完整报错。",
  );
  process.exit(result.status ?? 1);
}

console.log("[build] 迁移已是最新。");
