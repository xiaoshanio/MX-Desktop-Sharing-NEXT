import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { RoomClient } from "./RoomClient";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await currentUser();
  const { code } = await params;
  if (!user) redirect(`/login?next=/room/${code}`);

  return (
    <RoomClient
      code={code}
      user={{ email: user.email, displayName: user.displayName, role: user.role }}
    />
  );
}
