import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { httpUrl } from "../src/lib/livekit.ts";
import { describeDbError, parseOr400, redactSecrets } from "../src/lib/http.ts";
import { generateRoomCode } from "../src/lib/room-code.ts";
import { CARD_ACCENTS } from "../src/lib/identity.ts";
import {
  CARD_ACCENT_VALUES,
  createInviteSchema,
  createRoomSchema,
  emailSchema,
  updateProfileSchema,
  updateSyncPlayerSchema,
  updateRoomSchema,
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

describe("emailSchema", () => {
  const parse = (v: string) => parseOr400(emailSchema, v);

  it("接受默认管理员邮箱 admin@localhost", () => {
    // 回归测试：zod 的 .email() 会拒掉无点域名，导致默认管理员永远登不进去
    assert.equal(parse("admin@localhost"), "admin@localhost");
  });

  it("接受普通邮箱并归一化大小写和空白", () => {
    assert.equal(parse("  Admin@Example.COM  "), "admin@example.com");
  });

  it("接受内网单标签域名和 IP 字面量", () => {
    assert.equal(parse("user@intranet"), "user@intranet");
    assert.equal(parse("user@192.168.1.10"), "user@192.168.1.10");
  });

  it("拒绝明显不是邮箱的输入", () => {
    for (const bad of ["no-at-sign", "@nolocal.com", "a@", "a b@c.com", "a@b..c", ""]) {
      assert.throws(() => parse(bad), `本该拒绝：${JSON.stringify(bad)}`);
    }
  });

  it("拒绝域名标签以连字符收尾", () => {
    assert.throws(() => parse("a@-bad.com"));
    assert.throws(() => parse("a@bad-.com"));
  });
});

describe("redactSecrets", () => {
  it("抹掉连接串里的账号口令", () => {
    assert.equal(
      redactSecrets("connect failed: postgresql://neon:hunter2@ep-x.aws.neon.tech/db"),
      "connect failed: postgresql://***:***@ep-x.aws.neon.tech/db",
    );
  });

  it("一条消息里多个连接串都要抹", () => {
    const out = redactSecrets("a://u1:p1@h1 and b://u2:p2@h2");
    assert.ok(!out.includes("p1") && !out.includes("p2"), out);
  });

  it("不含口令的 URL 原样保留", () => {
    const msg = "timeout talking to https://ep-x.aws.neon.tech/db";
    assert.equal(redactSecrets(msg), msg);
  });
});

describe("describeDbError", () => {
  /** 复刻真实结构：drizzle 把驱动异常包进 DrizzleQueryError，真实原因在 cause 里。 */
  function drizzleWrapped(causeMessage: string, code?: string): Error {
    const cause = new Error(causeMessage) as Error & { code?: string };
    if (code) cause.code = code;
    const wrapper = new Error(
      'Failed query: select "value" from "app_config" where "app_config"."key" = $1 limit $2\n' +
        "params: credential_encryption_key,1",
    ) as Error & { cause?: Error };
    wrapper.cause = cause;
    return wrapper;
  }

  it("挖出 cause 里的真实原因，不返回 drizzle 那层的 Failed query", () => {
    const out = describeDbError(drizzleWrapped('relation "app_config" does not exist', "42P01"));
    assert.ok(!out.message.includes("Failed query"), out.message);
    assert.ok(out.message.includes('relation "app_config" does not exist'), out.message);
  });

  it("按 SQLSTATE 补一句可操作的指引", () => {
    const out = describeDbError(drizzleWrapped('relation "users" does not exist', "42P01"));
    assert.equal(out.code, "42P01");
    assert.ok(out.message.includes("npm run db:migrate"), out.message);
  });

  it("认得出口令错误和连接数超限", () => {
    assert.ok(describeDbError(drizzleWrapped("auth failed", "28P01")).message.includes("密码不对"));
    assert.ok(
      describeDbError(drizzleWrapped("too many clients", "53300")).message.includes("Pooled"),
    );
  });

  it("未收录的 SQLSTATE 仍然回传原始消息和码", () => {
    const out = describeDbError(drizzleWrapped("something odd", "XX999"));
    assert.equal(out.code, "XX999");
    assert.ok(out.message.includes("something odd"), out.message);
  });

  it("抹掉 cause 消息里的连接串口令", () => {
    const out = describeDbError(drizzleWrapped("connect to postgresql://u:secret@h/db failed"));
    assert.ok(!out.message.includes("secret"), out.message);
  });

  it("只有 Failed query 一层时给兜底文案而不是回显 SQL", () => {
    const bare = new Error("Failed query: select 1\nparams: ");
    const out = describeDbError(bare);
    assert.ok(!out.message.includes("select 1"), out.message);
    assert.equal(out.code, undefined);
  });

  it("非 Error 输入不炸", () => {
    assert.ok(describeDbError("boom").message.length > 0);
    assert.ok(describeDbError(null).message.length > 0);
    assert.ok(describeDbError(undefined).message.length > 0);
  });

  it("cause 自引用不会死循环", () => {
    const loop = new Error("outer") as Error & { cause?: unknown };
    loop.cause = loop;
    assert.ok(describeDbError(loop).message.includes("outer"));
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

describe("updateRoomSchema", () => {
  it("接受布尔开关", () => {
    assert.equal(parseOr400(updateRoomSchema, { obsEnabled: false }).obsEnabled, false);
    assert.equal(parseOr400(updateRoomSchema, { obsEnabled: true }).obsEnabled, true);
  });

  it("拒绝缺字段和字符串「false」（前端忘了转类型时不能静默当成 true）", () => {
    assert.throws(() => parseOr400(updateRoomSchema, {}));
    assert.throws(() => parseOr400(updateRoomSchema, { obsEnabled: "false" }));
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

describe("updateProfileSchema", () => {
  it("底色档位和 identity.ts 里的那份必须完全一致", () => {
    // validation.ts 刻意零项目内依赖，所以那份列表是手抄的。
    // 抄漏一档的后果是「个人中心能选、但保存时报 400」，界面上看不出原因，所以在这里钉住。
    assert.deepEqual([...CARD_ACCENT_VALUES], [...CARD_ACCENTS]);
  });

  it("区分「删掉头像」和「这次不改头像」", () => {
    // null = 删掉，undefined（不传）= 保持原样。两者混淆会让用户一改显示名就丢头像。
    assert.equal(parseOr400(updateProfileSchema, { avatar: null }).avatar, null);
    assert.equal("avatar" in parseOr400(updateProfileSchema, { displayName: "阿伟" }), false);
  });

  it("拒绝空显示名和不认识的底色", () => {
    assert.throws(() => parseOr400(updateProfileSchema, { displayName: "   " }));
    assert.throws(() => parseOr400(updateProfileSchema, { cardAccent: "chartreuse" }));
  });
});

describe("updateSyncPlayerSchema", () => {
  it("空字符串归一成 null（= 清空片源）", () => {
    assert.equal(parseOr400(updateSyncPlayerSchema, { sourceUrl: "" }).sourceUrl, null);
    assert.equal(parseOr400(updateSyncPlayerSchema, { sourceUrl: null }).sourceUrl, null);
  });

  it("只收 http(s) —— 浏览器取不到别的协议", () => {
    assert.equal(
      parseOr400(updateSyncPlayerSchema, { sourceUrl: "https://a.example/v.mkv" }).sourceUrl,
      "https://a.example/v.mkv",
    );
    assert.throws(() => parseOr400(updateSyncPlayerSchema, { sourceUrl: "file:///etc/passwd" }));
    assert.throws(() => parseOr400(updateSyncPlayerSchema, { sourceUrl: "magnet:?xt=urn:btih:x" }));
  });
});
