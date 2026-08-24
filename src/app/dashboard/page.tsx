import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { isInitialized } from "@/lib/setup";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isInitialized())) redirect("/setup");
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <DashboardClient
      user={{ email: user.email, displayName: user.displayName, role: user.role }}
    />
  );
}
