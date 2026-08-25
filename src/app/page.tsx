import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 入口只做分流：没登录 → /login，否则 → /dashboard。 */
export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  redirect("/dashboard");
}
