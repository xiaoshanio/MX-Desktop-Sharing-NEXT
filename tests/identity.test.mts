import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CARD_ACCENTS,
  accentFor,
  decodeParticipantMeta,
  encodeParticipantMeta,
  initialOf,
  userImageUrl,
} from "../src/lib/identity.ts";
import { isImmersivePath } from "../src/lib/theme.ts";
import { MAX_AVATAR_BYTES, decodeDataUrl } from "../src/lib/images.ts";

/** 一个最小的合法 PNG（1x1 透明），用来验证魔数校验放行真图。 */
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4DwABBAEAX+d1twAAAABJRU5ErkJggg==";

describe("initialOf", () => {
  it("取第一个字符，中英文都要对", () => {
    assert.equal(initialOf("阿伟"), "阿");
    assert.equal(initialOf("wei"), "w");
  });

  it("按码点切而不是按 UTF-16 下标（否则 emoji 会被切成半个字）", () => {
    // "🎬" 是代理对，用 name[0] 会得到一个孤立的高位代理，渲染成乱码方块
    assert.equal(initialOf("🎬 放映室"), "🎬");
  });

  it("空名字回退", () => {
    assert.equal(initialOf("   "), "?");
    assert.equal(initialOf("", "M"), "M");
  });
});

describe("accentFor", () => {
  it("同一个 id 永远得到同一档（不能用 Math.random）", () => {
    // 真随机会导致同一个人每次渲染换色，且服务端渲染和客户端 hydrate 对不上
    const id = "8f1c2b3a-0000-4000-8000-000000000001";
    const first = accentFor(id);
    for (let i = 0; i < 20; i++) assert.equal(accentFor(id), first);
  });

  it("落在已知档位里", () => {
    for (let i = 0; i < 200; i++) {
      assert.ok(CARD_ACCENTS.includes(accentFor(`user-${i}`)));
    }
  });

  it("不同 id 会分散到多档，不是全挤在一档", () => {
    const seen = new Set(Array.from({ length: 200 }, (_, i) => accentFor(`u${i}`)));
    assert.ok(seen.size >= 5, `只用到了 ${seen.size} 档，哈希分布太差`);
  });

  it("存过的合法值优先于哈希", () => {
    assert.equal(accentFor("whatever", "teal"), "teal");
  });

  it("存了不认识的值时回退到哈希，而不是原样返回", () => {
    // 否则数据库里一条脏数据会让 data-accent 变成一个没有样式的值（卡片变透明）
    const id = "abc";
    assert.equal(accentFor(id, "chartreuse"), accentFor(id));
  });
});

describe("userImageUrl", () => {
  it("没版本号就返回 null（= 用底色兜底）", () => {
    assert.equal(userImageUrl("u1", "avatar", null), null);
    assert.equal(userImageUrl("u1", "avatar", undefined), null);
  });

  it("带上版本号作为缓存键", () => {
    const url = userImageUrl("u1", "banner", "2026-08-26T10:00:00.000Z");
    assert.ok(url?.startsWith("/api/users/u1/image?kind=banner&v="), url ?? "null");
    assert.ok(url?.endsWith(String(Date.parse("2026-08-26T10:00:00.000Z"))));
  });

  it("时间戳解析不出来时不产出 NaN", () => {
    // v=NaN 会让浏览器每次都当成新 URL，缓存全废
    assert.ok(userImageUrl("u1", "avatar", "not a date")?.endsWith("v=0"));
  });
});

describe("participant metadata", () => {
  it("往返不变形", () => {
    const meta = { accent: "amber" as const, avatarAt: "2026-01-01T00:00:00.000Z", bannerAt: null };
    assert.deepEqual(decodeParticipantMeta(encodeParticipantMeta(meta), "u1"), meta);
  });

  it("对端没有 metadata 时退回默认值，不抛错", () => {
    const meta = decodeParticipantMeta(undefined, "u1");
    assert.equal(meta.accent, accentFor("u1"));
    assert.equal(meta.avatarAt, null);
  });

  it("metadata 是垃圾数据时也不能炸（房里有人用旧版客户端）", () => {
    assert.equal(decodeParticipantMeta("{{{", "u1").accent, accentFor("u1"));
    assert.equal(decodeParticipantMeta('{"accent":123}', "u1").accent, accentFor("u1"));
  });
});

describe("isImmersivePath", () => {
  it("房间页要自动收起侧栏", () => {
    assert.equal(isImmersivePath("/room/p3qbsvcfhu"), true);
  });

  it("其他页面保持用户自己的偏好", () => {
    for (const path of ["/dashboard", "/nodes", "/me", "/admin", "/login", "/"]) {
      assert.equal(isImmersivePath(path), false, path);
    }
  });

  it("不能被前缀相近的路径误判", () => {
    // 引导脚本和 React effect 共用这个判断，两边不一致就会出现「刷新后和点进来时不一样」
    assert.equal(isImmersivePath("/rooms"), false);
    assert.equal(isImmersivePath("/roomy/x"), false);
  });
});

describe("decodeDataUrl", () => {
  it("接受合法的 PNG data URL", () => {
    const out = decodeDataUrl(`data:image/png;base64,${TINY_PNG_BASE64}`, MAX_AVATAR_BYTES);
    assert.equal(out.mimeType, "image/png");
    assert.ok(out.byteSize > 0);
  });

  it("拒绝 SVG（它能带脚本）", () => {
    assert.throws(() => decodeDataUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", MAX_AVATAR_BYTES));
  });

  it("拒绝裸 URL —— 不做外链，也避免变成 SSRF 入口", () => {
    assert.throws(() => decodeDataUrl("https://example.com/a.png", MAX_AVATAR_BYTES));
  });

  it("拒绝声明成图片但内容不是的文件（改前缀就能绕过 mime 检查）", () => {
    const notAnImage = Buffer.from("#!/bin/sh\nrm -rf /\n".padEnd(64, " ")).toString("base64");
    assert.throws(() => decodeDataUrl(`data:image/png;base64,${notAnImage}`, MAX_AVATAR_BYTES));
  });

  it("超过上限就拒绝", () => {
    const big = Buffer.alloc(2048).toString("base64");
    assert.throws(() => decodeDataUrl(`data:image/png;base64,${big}`, 1024));
  });
});
