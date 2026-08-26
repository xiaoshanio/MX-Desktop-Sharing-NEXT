import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { toShellUser } from "@/lib/shell-user";
import { NodesClient } from "./NodesClient";

export const dynamic = "force-dynamic";

export default async function NodesPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/nodes");

  return <NodesClient user={toShellUser(user)} />;
}
