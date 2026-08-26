import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { toShellUser } from "@/lib/shell-user";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");

  return <AdminClient selfId={user.id} user={toShellUser(user)} />;
}
