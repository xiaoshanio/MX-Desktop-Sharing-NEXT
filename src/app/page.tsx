import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { isInitialized } from "@/lib/setup";

export const dynamic = "force-dynamic";

/** 入口只做分流：没初始化 → /setup，没登录 → /login，否则 → /dashboard。 */
export default async function Home() {
  if (!(await isInitialized())) redirect("/setup");
  const user = await currentUser();
  if (!user) redirect("/login");
  redirect("/dashboard");
}
