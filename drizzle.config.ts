import { loadEnvConfig } from "@next/env";
import type { Config } from "drizzle-kit";

/**
 * drizzle-kit 只会自己读 `.env`，**不读 `.env.local`** —— 而 Next 两个都读，文档也让
 * 大家把连接串写进 `.env.local`。照着文档做的人跑 `npm run db:migrate` 会撞上一句
 * 没头没尾的 `url: undefined`。
 *
 * 这里直接借 Next 自己的加载器，保证迁移命令看到的环境变量和应用运行时完全一致
 * （含 `.env.local` 覆盖 `.env` 的优先级）。文件不存在时它会静默跳过。
 */
loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL 未设置。三种办法任选：写进 .env.local；或临时前置 " +
      'DATABASE_URL="..." npm run db:migrate；或在当前 shell 里 export 它。',
  );
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
} satisfies Config;
