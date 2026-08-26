import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { toShellUser } from "@/lib/shell-user";
import { MeClient } from "./MeClient";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/me");

  return <MeClient user={toShellUser(user)} />;
}
