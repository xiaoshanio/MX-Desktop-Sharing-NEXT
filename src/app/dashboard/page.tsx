import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <DashboardClient
      user={{ email: user.email, displayName: user.displayName, role: user.role }}
    />
  );
}
