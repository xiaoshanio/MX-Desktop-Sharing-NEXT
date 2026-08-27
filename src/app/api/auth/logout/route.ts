import { destroySession } from "@/lib/auth";
import { json } from "@/lib/http";
import { route } from "@/lib/api-route";

export const runtime = "nodejs";

export const POST = route(async () => {
  await destroySession();
  return json({ ok: true });
});
