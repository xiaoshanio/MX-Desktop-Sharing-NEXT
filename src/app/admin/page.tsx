import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { isInitialized } from "@/lib/setup";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isInitialized())) redirect("/setup");
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");

  return <AdminClient selfId={user.id} />;
}
