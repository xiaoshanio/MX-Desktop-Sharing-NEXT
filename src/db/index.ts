import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

// 惰性初始化：模块加载时不读 env，否则 `next build` 收集页面数据时（此时
// 环境变量可能还没配）会在顶层直接抛错，导致整个构建失败。第一次真正用到
// db 时才连接。
let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL 未设置。复制 .env.example 为 .env.local 后填入 Neon 连接串。");
  }
  // neon-http：每条语句一次 HTTP 请求，无常驻连接，适配 Vercel serverless。
  // 代价是不支持交互式事务（db.transaction 里只能用 batch 风格）。
  return drizzle(neon(url), { schema });
}

/** 通过 Proxy 把首次访问推迟到运行时，模块加载阶段完全不碰 env。 */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    if (!cached) cached = connect();
    return Reflect.get(cached, prop, receiver);
  },
});

export { schema };
