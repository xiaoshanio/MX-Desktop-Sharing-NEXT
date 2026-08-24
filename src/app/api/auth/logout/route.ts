import { destroySession } from "@/lib/auth";
import { json, route } from "@/lib/http";

export const runtime = "nodejs";

export const POST = route(async () => {
  await destroySession();
  return json({ ok: true });
});
