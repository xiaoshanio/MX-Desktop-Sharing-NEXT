import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { toShellUser } from "@/lib/shell-user";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return <DashboardClient user={toShellUser(user)} />;
}
