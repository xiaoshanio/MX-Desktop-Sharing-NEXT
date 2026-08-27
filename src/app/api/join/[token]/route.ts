import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { json } from "@/lib/http";
import { route } from "@/lib/api-route";
import { redeemInvite } from "@/lib/invites";

export const runtime = "nodejs";

/** 凭邀请 token 入房。必须先登录——所以 /join 页面会先把人送去登录再回来。 */
export const POST = route(async (_req, ctx: { params: Promise<{ token: string }> }) => {
  const user = await requireUser();
  const { token } = await ctx.params;

  const { room, invite } = await redeemInvite(token, user);

  audit({
    actorId: user.id,
    roomId: room.id,
    action: "invite.redeem",
    detail: { inviteId: invite.id, role: invite.role },
  });

  return json({ room: { code: room.code, name: room.name } });
});
