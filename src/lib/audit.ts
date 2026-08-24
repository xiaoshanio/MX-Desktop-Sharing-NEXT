import { after } from "next/server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";

type AuditInput = {
  actorId?: string | null;
  roomId?: string | null;
  action: string;
  detail?: unknown;
};

/**
 * 审计日志。不阻塞主流程，写失败也不抛错。
 *
 * 必须走 after()：Vercel 的 serverless 函数在响应返回后可能立刻冻结，
 * 裸的 void promise 会被丢掉（本地 dev 不冻结，所以看不出来）。
 * after() 把回调登记到响应之后的生命周期，保证它有机会跑完。
 *
 * 注意：detail 里绝对不要塞 api_secret / stream_key。
 */
export function audit(input: AuditInput): void {
  const write = async () => {
    try {
      await db.insert(auditLogs).values({
        actorId: input.actorId ?? null,
        roomId: input.roomId ?? null,
        action: input.action,
        detail: (input.detail ?? null) as never,
      });
    } catch (err) {
      console.error("[audit] 写入失败", input.action, err);
    }
  };

  try {
    after(write);
  } catch {
    // after() 只能在请求上下文里调用；脚本/测试等场景退化成直接执行
    void write();
  }
}
