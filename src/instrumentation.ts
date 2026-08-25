/**
 * Next.js 在服务进程启动时调用一次 register()，早于处理任何请求。
 * 我们在这里建管理员、供给凭据加密密钥，于是不再需要 /setup 向导。
 */
export async function register(): Promise<void> {
  // 只在 Node 运行时跑：Edge 里没有 node:crypto 和数据库驱动
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { bootstrap } = await import("@/lib/bootstrap");
  await bootstrap();
}
