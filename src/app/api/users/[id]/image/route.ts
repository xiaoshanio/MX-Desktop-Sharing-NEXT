import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { userAssets } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { badRequest, notFound, route } from "@/lib/http";

export const runtime = "nodejs";

/**
 * 头像 / 卡片背景的字节。
 *
 * 要求登录：这些图会出现在房间成员卡片上，而「谁在哪个房间」本身是信息。
 * 不做成公开端点就不用担心有人拿 uuid 枚举整站用户的头像。
 * 至于同一站内的用户之间 —— 能看到彼此的卡片本来就是功能的一部分。
 *
 * 缓存策略：URL 上带着 `v=<最后更新时间>`（见 lib/identity.ts 的 userImageUrl），
 * 所以同一个 URL 的内容永远不变，可以 immutable 长缓存；换了图就是换了 URL。
 * private 是因为要求登录 —— 不能让中间代理把 A 的头像缓存给 B。
 */
export const GET = route(
  async (req, ctx: { params: Promise<{ id: string }> }) => {
    await requireUser();

    const { id } = await ctx.params;
    const kind = new URL(req.url).searchParams.get("kind") ?? "avatar";
    if (kind !== "avatar" && kind !== "banner") throw badRequest("kind 只能是 avatar 或 banner");

    const [row] = await db
      .select({ mimeType: userAssets.mimeType, data: userAssets.data })
      .from(userAssets)
      .where(and(eq(userAssets.userId, id), eq(userAssets.kind, kind)))
      .limit(1);

    if (!row) throw notFound("没有这张图");

    return new Response(Buffer.from(row.data, "base64"), {
      headers: {
        "content-type": row.mimeType,
        "cache-control": "private, max-age=31536000, immutable",
      },
    });
  },
);
