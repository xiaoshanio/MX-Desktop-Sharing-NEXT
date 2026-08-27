import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { badRequest, json, readJson, parseOr400 } from "@/lib/http";
import { route } from "@/lib/api-route";
import { createInvite, listInvites, revokeInvite } from "@/lib/invites";
import { requireRoomOwner } from "@/lib/rooms";
import { appUrl } from "@/lib/url";
import { createInviteSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);

  const rows = await listInvites(roomCtx.room.id);
  const base = appUrl(req);

  return json({
    invites: rows.map((i) => ({
      id: i.id,
      role: i.role,
      useCount: i.useCount,
      maxUses: i.maxUses,
      expiresAt: i.expiresAt?.toISOString() ?? null,
      revokedAt: i.revokedAt?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
      // 明文 token 只在创建时返回一次，列表里给不出完整链接
      joinUrlPrefix: `${base}/join/`,
    })),
  });
});

export const POST = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);
  const input = await readJson(req, (raw) => parseOr400(createInviteSchema, raw));

  const { invite, token } = await createInvite({
    roomId: roomCtx.room.id,
    createdBy: user.id,
    role: input.role,
    expiresInHours: input.expiresInHours,
    maxUses: input.maxUses,
  });

  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: "invite.create",
    detail: { inviteId: invite.id, role: input.role, maxUses: input.maxUses },
  });

  return json(
    {
      invite: { id: invite.id, role: invite.role },
      // 只有这一次能拿到完整链接
      joinUrl: `${appUrl(req)}/join/${token}`,
    },
    { status: 201 },
  );
});

export const DELETE = route(async (req, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  const roomCtx = await requireRoomOwner(code, user);

  const inviteId = new URL(req.url).searchParams.get("id");
  if (!inviteId) throw badRequest("api.invites.missingId");

  await revokeInvite(inviteId, roomCtx.room.id);
  audit({
    actorId: user.id,
    roomId: roomCtx.room.id,
    action: "invite.revoke",
    detail: { inviteId },
  });
  return json({ ok: true });
});
