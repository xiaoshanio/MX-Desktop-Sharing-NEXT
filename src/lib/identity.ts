/**
 * 用户身份的呈现层：卡片底色、头像地址、首字母。
 *
 * 纯函数、零依赖，所以服务端和客户端组件都能直接 import
 * （房间里的成员卡片是客户端渲染的，而签 token 时又要把同样的信息写进 metadata）。
 */

export const CARD_ACCENTS = [
  "iris",
  "azure",
  "teal",
  "lime",
  "amber",
  "rose",
  "magenta",
  "slate",
] as const;

export type CardAccent = (typeof CARD_ACCENTS)[number];

/** 名字里挑一个字当头像占位符。中文取第一个字，英文取首字母。 */
export function initialOf(name: string, fallback = "?"): string {
  const trimmed = name.trim();
  // Array.from 而不是 [0]：emoji 和部分汉字是代理对，按 UTF-16 下标切会切出半个字
  return Array.from(trimmed)[0] ?? fallback;
}

/**
 * 没设过底色的人按 id 稳定地分一档。
 *
 * 「默认随机」不能真的用 Math.random —— 那样同一个人每次渲染都换色，
 * 而且服务端渲染和客户端 hydrate 会对不上。按 id 哈希取模：看起来是随机分配的，
 * 但对同一个人永远是同一档。
 */
export function accentFor(id: string, stored?: string | null): CardAccent {
  if (stored && (CARD_ACCENTS as readonly string[]).includes(stored)) {
    return stored as CardAccent;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    // FNV 风格的滚动哈希，取值只要分布均匀就够，不需要密码学强度
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return CARD_ACCENTS[Math.abs(hash) % CARD_ACCENTS.length]!;
}

/**
 * 头像 / 卡片背景的地址。
 *
 * `version` 是该图最后一次更新的时间戳：作为查询串挂上去，换图后浏览器立刻拿到新的，
 * 没换图时又能一直吃缓存（端点那边配的是 immutable）。
 * 传 null（没上传过自定义图）时返回 null，由调用方回退到底色 + 首字母。
 */
export function userImageUrl(
  userId: string,
  kind: "avatar" | "banner",
  version: string | null | undefined,
): string | null {
  if (!version) return null;
  const v = Date.parse(version);
  return `/api/users/${userId}/image?kind=${kind}&v=${Number.isNaN(v) ? 0 : v}`;
}

/**
 * 写进 LiveKit token metadata 的那一小坨。
 *
 * 房间里的成员卡片需要头像和底色，而参与者列表是 LiveKit 客户端 SDK 直接给的
 * （不查库、不轮询）。把这几个字段随 token 带过去，卡片就能在参与者一上线的瞬间
 * 画对，不用再为每个人发一次请求。刻意只放呈现用的字段 —— metadata 房里所有人可见。
 */
export type ParticipantMeta = {
  accent: CardAccent;
  /** 头像最后更新时间（ISO），null = 用默认底色 */
  avatarAt: string | null;
  bannerAt: string | null;
};

export function encodeParticipantMeta(meta: ParticipantMeta): string {
  return JSON.stringify(meta);
}

/** 解析对端的 metadata。对方版本不一致或字段缺失时退回默认值，不抛错。 */
export function decodeParticipantMeta(raw: string | undefined, identity: string): ParticipantMeta {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ParticipantMeta>;
      return {
        accent: accentFor(identity, parsed.accent),
        avatarAt: typeof parsed.avatarAt === "string" ? parsed.avatarAt : null,
        bannerAt: typeof parsed.bannerAt === "string" ? parsed.bannerAt : null,
      };
    } catch {
      /* 不是合法 JSON —— 当成没有 metadata */
    }
  }
  return { accent: accentFor(identity), avatarAt: null, bannerAt: null };
}
