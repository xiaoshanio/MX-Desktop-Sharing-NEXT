import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { httpUrl } from "../src/lib/livekit.ts";
import { parseOr400 } from "../src/lib/http.ts";
import { generateRoomCode } from "../src/lib/room-code.ts";
import {
  createInviteSchema,
  createRoomSchema,
  wsUrlSchema,
} from "../src/lib/validation.ts";

describe("wsUrlSchema", () => {
  const parse = (v: string) => parseOr400(wsUrlSchema, v);

  it("https 自动改成 wss", () => {
    assert.equal(parse("https://x.livekit.cloud"), "wss://x.livekit.cloud");
  });

  it("裸域名补 wss://", () => {
    assert.equal(parse("x.livekit.cloud"), "wss://x.livekit.cloud");
  });

  it("剥掉路径和尾斜杠", () => {
    assert.equal(parse("wss://x.livekit.cloud/rtc/"), "wss://x.livekit.cloud");
  });

  it("保留自建的 ws:// 和端口", () => {
    assert.equal(parse("ws://localhost:7880"), "ws://localhost:7880");
  });

  it("空值被拒", () => {
    assert.throws(() => parse("   "));
  });
});

describe("httpUrl", () => {
  it("wss → https", () => {
    assert.equal(httpUrl("wss://x.livekit.cloud"), "https://x.livekit.cloud");
  });

  it("ws → http", () => {
    assert.equal(httpUrl("ws://localhost:7880"), "http://localhost:7880");
  });
});

describe("generateRoomCode", () => {
  it("不含易混字符 0/O/1/I/l", () => {
    for (let i = 0; i < 200; i++) {
      assert.ok(!/[01OIl]/.test(generateRoomCode()), "生成了易混字符");
    }
  });

  it("长度符合预期且基本不重复", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const code = generateRoomCode();
      assert.equal(code.length, 10);
      seen.add(code);
    }
    assert.equal(seen.size, 500, "10 位短码在 500 次内不该碰撞");
  });
});

describe("createRoomSchema", () => {
  it("默认观众不可推流、token 6 小时", () => {
    const out = parseOr400(createRoomSchema, { name: "我的房间" });
    assert.equal(out.viewerCanPublish, false);
    assert.equal(out.tokenTtlSeconds, 21600);
  });

  it("拒绝空房间名", () => {
    assert.throws(() => parseOr400(createRoomSchema, { name: "  " }));
  });

  it("拒绝超出范围的 ttl", () => {
    assert.throws(() => parseOr400(createRoomSchema, { name: "x", tokenTtlSeconds: 10 }));
    assert.throws(() => parseOr400(createRoomSchema, { name: "x", tokenTtlSeconds: 999999 }));
  });
});

describe("createInviteSchema", () => {
  it("默认仅观看、24 小时、不限次数", () => {
    const out = parseOr400(createInviteSchema, {});
    assert.equal(out.role, "viewer");
    assert.equal(out.expiresInHours, 24);
    assert.equal(out.maxUses, null);
  });

  it("允许显式永不过期", () => {
    assert.equal(parseOr400(createInviteSchema, { expiresInHours: null }).expiresInHours, null);
  });

  it("拒绝非法角色", () => {
    assert.throws(() => parseOr400(createInviteSchema, { role: "owner" }));
  });
});
