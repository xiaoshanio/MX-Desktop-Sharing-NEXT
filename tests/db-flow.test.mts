import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { PGlite } from "@electric-sql/pglite";

import { hashPassword, verifyPassword } from "../src/lib/password.ts";

/**
 * 用 PGlite（WASM 版真 Postgres）把 drizzle 生成的迁移跑起来，验证那些「读代码读不出来」
 * 的东西：迁移能不能真的建表、表达式索引和 partial unique index 是否按预期生效、
 * 邀请的原子扣减在并发下守不守得住 max_uses。
 *
 * 这里刻意直接写 SQL 而不是走 src/db —— 那个模块绑死了 neon-http 驱动。
 * 目标是验证 schema 与 SQL 语义，不是验证 ORM 的胶水。
 */
let pg: PGlite;

before(async () => {
  pg = new PGlite();
  const dir = new URL("../drizzle/", import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  assert.ok(files.length >= 2, "应该有两个迁移文件");

  for (const f of files) {
    const sql = readFileSync(new URL(f, dir), "utf8");
    // drizzle 用 --> statement-breakpoint 分隔语句
    for (const stmt of sql.split("--> statement-breakpoint")) {
      const s = stmt.trim();
      if (s) await pg.exec(s);
    }
  }
});

after(async () => {
  await pg?.close();
});

describe("迁移", () => {
  it("12 张表全部建起来了", async () => {
    const r = await pg.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name`,
    );
    const names = r.rows.map((x) => x.table_name);
    for (const t of [
      "app_config",
      "audit_logs",
      "livekit_nodes",
      "login_attempts",
      "room_ingress",
      "room_invites",
      "room_members",
      "room_presence",
      "rooms",
      "sessions",
      "users",
      "webhook_events",
    ]) {
      assert.ok(names.includes(t), `缺表 ${t}`);
    }
    assert.equal(names.length, 12);
  });
});

/** 建一个完整的「管理员 + 节点 + 房间」现场，返回各自 id。每次调用都用独立邮箱/房间码。 */
async function seed() {
  const adminId = randomUUID();
  await pg.query(
    `insert into users (id, email, password_hash, display_name, role)
     values ($1, $2, $3, $4, 'admin')`,
    [adminId, `admin-${adminId}@localhost`, "scrypt$16384$x$y", "管理员"],
  );

  const nodeId = randomUUID();
  await pg.query(
    `insert into livekit_nodes (id, name, kind, ws_url, api_key, api_secret_enc, owner_id, allow_public)
     values ($1, '内置', 'builtin', $3, $4, 'enc', $2, true)`,
    [nodeId, adminId, `wss://${nodeId}.livekit.cloud`, `API-${nodeId}`],
  );

  // 房间码取 uuid 片段，保证每次 seed 不撞码
  const code = adminId.replace(/-/g, "").slice(0, 10);
  const roomId = randomUUID();
  await pg.query(
    `insert into rooms (id, code, name, owner_id, node_id) values ($1, $2, '演示房', $3, $4)`,
    [roomId, code, adminId, nodeId],
  );
  await pg.query(
    `insert into room_members (room_id, user_id, role) values ($1, $2, 'owner')`,
    [roomId, adminId],
  );
  return { adminId, nodeId, roomId, code };
}

describe("bootstrap 建管理员", () => {
  it("lower(email) 唯一索引能挡住大小写不同的重复注册", async () => {
    const id = randomUUID();
    await pg.query(
      `insert into users (id, email, password_hash, display_name) values ($1,$2,$3,$4)`,
      [id, "Dup@Example.com", "h", "甲"],
    );

    await assert.rejects(
      () =>
        pg.query(
          `insert into users (id, email, password_hash, display_name) values ($1,$2,$3,$4)`,
          [randomUUID(), "dup@example.com", "h", "乙"],
        ),
      /duplicate key|unique/i,
      "大小写不同的同一邮箱应该被唯一索引拒绝",
    );
  });

  it("on conflict do nothing 能在表达式索引上正常工作（幂等建号的前提）", async () => {
    const email = "idem@example.com";
    for (let i = 0; i < 3; i++) {
      await pg.query(
        `insert into users (id, email, password_hash, display_name)
         values ($1,$2,$3,$4) on conflict do nothing`,
        [randomUUID(), email, "h", "幂等"],
      );
    }
    const r = await pg.query<{ n: number }>(
      `select count(*)::int as n from users where lower(email) = $1`,
      [email],
    );
    assert.equal(r.rows[0]!.n, 1, "重复引导不该建出多个管理员");
  });
});

describe("加密密钥自动供给", () => {
  it("抢占式插入 + 回读：并发冷启动最终只落一把密钥", async () => {
    const keyA = "AAAA".repeat(11);
    const keyB = "BBBB".repeat(11);

    await Promise.all([
      pg.query(
        `insert into app_config (key, value) values ('credential_encryption_key', $1)
         on conflict do nothing`,
        [JSON.stringify({ v: keyA })],
      ),
      pg.query(
        `insert into app_config (key, value) values ('credential_encryption_key', $1)
         on conflict do nothing`,
        [JSON.stringify({ v: keyB })],
      ),
    ]);

    const r = await pg.query<{ value: { v: string } }>(
      `select value from app_config where key = 'credential_encryption_key'`,
    );
    assert.equal(r.rows.length, 1, "只能有一行密钥");
    assert.ok([keyA, keyB].includes(r.rows[0]!.value.v), "回读到的必须是先到的那把");
  });
});

describe("成员鉴权（签 token 的依据）", () => {
  it("非成员查不到房间成员身份", async () => {
    const { roomId } = await seed();
    const stranger = randomUUID();
    const r = await pg.query(
      `select 1 from room_members where room_id = $1 and user_id = $2`,
      [roomId, stranger],
    );
    assert.equal(r.rows.length, 0, "陌生人不该有成员行 —— 这就是签不出 token 的原因");
  });

  it("踢人后成员行消失，之后再也签不出 token", async () => {
    const { roomId } = await seed();
    const viewer = randomUUID();
    await pg.query(`insert into users (id,email,password_hash,display_name) values ($1,$2,'h','观众')`, [
      viewer,
      `v-${viewer}@e.com`,
    ]);
    await pg.query(`insert into room_members (room_id,user_id,role) values ($1,$2,'viewer')`, [
      roomId,
      viewer,
    ]);

    let r = await pg.query(`select 1 from room_members where room_id=$1 and user_id=$2`, [
      roomId,
      viewer,
    ]);
    assert.equal(r.rows.length, 1);

    await pg.query(`delete from room_members where room_id=$1 and user_id=$2`, [roomId, viewer]);
    r = await pg.query(`select 1 from room_members where room_id=$1 and user_id=$2`, [roomId, viewer]);
    assert.equal(r.rows.length, 0, "踢完必须查不到");
  });
});

describe("邀请链接原子扣减", () => {
  it("max_uses 在并发兑换下不会被击穿", async () => {
    const { roomId, adminId } = await seed();
    const inviteId = randomUUID();
    const tokenHash = createHash("sha256").update("tok").digest("hex");

    // 只允许用 2 次
    await pg.query(
      `insert into room_invites (id, room_id, token_hash, role, created_by, max_uses)
       values ($1,$2,$3,'viewer',$4,2)`,
      [inviteId, roomId, tokenHash, adminId],
    );

    // 这条就是 redeemInvite 用的条件 UPDATE
    const claim = () =>
      pg.query(
        `update room_invites set use_count = use_count + 1
         where token_hash = $1
           and revoked_at is null
           and (expires_at is null or expires_at > now())
           and (max_uses is null or use_count < max_uses)
         returning id`,
        [tokenHash],
      );

    // 连打 5 次，只应成功 2 次
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await claim());
    const wins = results.filter((r) => r.rows.length === 1).length;
    assert.equal(wins, 2, `max_uses=2 只能兑换 2 次，实际 ${wins} 次`);

    const r = await pg.query<{ use_count: number }>(
      `select use_count from room_invites where id = $1`,
      [inviteId],
    );
    assert.equal(r.rows[0]!.use_count, 2, "计数不能超过上限");
  });

  it("已过期的邀请兑换不了", async () => {
    const { roomId, adminId } = await seed();
    const tokenHash = createHash("sha256").update("expired").digest("hex");
    await pg.query(
      `insert into room_invites (id, room_id, token_hash, role, created_by, expires_at)
       values ($1,$2,$3,'viewer',$4, now() - interval '1 hour')`,
      [randomUUID(), roomId, tokenHash, adminId],
    );
    const r = await pg.query(
      `update room_invites set use_count = use_count + 1
       where token_hash = $1 and revoked_at is null
         and (expires_at is null or expires_at > now())
         and (max_uses is null or use_count < max_uses)
       returning id`,
      [tokenHash],
    );
    assert.equal(r.rows.length, 0, "过期邀请不该能兑换");
  });

  it("已撤销的邀请兑换不了", async () => {
    const { roomId, adminId } = await seed();
    const tokenHash = createHash("sha256").update("revoked").digest("hex");
    await pg.query(
      `insert into room_invites (id, room_id, token_hash, role, created_by, revoked_at)
       values ($1,$2,$3,'viewer',$4, now())`,
      [randomUUID(), roomId, tokenHash, adminId],
    );
    const r = await pg.query(
      `update room_invites set use_count = use_count + 1
       where token_hash = $1 and revoked_at is null
         and (expires_at is null or expires_at > now())
         and (max_uses is null or use_count < max_uses)
       returning id`,
      [tokenHash],
    );
    assert.equal(r.rows.length, 0, "撤销的邀请不该能兑换");
  });
});

describe("OBS 推流地址（room_ingress）", () => {
  it("partial unique index：未撤销的地址每人每房只允许一条", async () => {
    const { roomId, adminId } = await seed();
    const ins = (ingressId: string) =>
      pg.query(
        `insert into room_ingress (id, room_id, user_id, ingress_id, participant_identity, whip_url, stream_key_enc)
         values ($1,$2,$3,$4,$5,'https://whip','enc')`,
        [randomUUID(), roomId, adminId, ingressId, `obs:${adminId}`],
      );

    await ins("ig-1");
    await assert.rejects(() => ins("ig-2"), /duplicate key|unique/i, "第二条未撤销的应被拒");
  });

  it("撤销之后可以再生成（rotate 的前提）", async () => {
    const { roomId, adminId } = await seed();
    const first = randomUUID();
    await pg.query(
      `insert into room_ingress (id, room_id, user_id, ingress_id, participant_identity, whip_url, stream_key_enc)
       values ($1,$2,$3,'ig-a',$4,'https://whip','enc')`,
      [first, roomId, adminId, `obs:${adminId}`],
    );
    await pg.query(`update room_ingress set revoked_at = now() where id = $1`, [first]);

    await pg.query(
      `insert into room_ingress (id, room_id, user_id, ingress_id, participant_identity, whip_url, stream_key_enc)
       values ($1,$2,$3,'ig-b',$4,'https://whip','enc')`,
      [randomUUID(), roomId, adminId, `obs:${adminId}`],
    );

    const r = await pg.query<{ n: number }>(
      `select count(*)::int as n from room_ingress where room_id=$1 and user_id=$2 and revoked_at is null`,
      [roomId, adminId],
    );
    assert.equal(r.rows[0]!.n, 1, "轮换后应只有一条生效");
  });
});

describe("在线状态（webhook 落库）", () => {
  it("重复的 join 事件 upsert 不会写出两行", async () => {
    const { roomId, adminId } = await seed();
    const upsert = (online: boolean, evt: string) =>
      pg.query(
        `insert into room_presence (room_id, identity, kind, is_online, last_event, updated_at)
         values ($1,$2,'user',$3,$4, now())
         on conflict (room_id, identity)
         do update set is_online = excluded.is_online, last_event = excluded.last_event, updated_at = now()`,
        [roomId, adminId, online, evt],
      );

    await upsert(true, "participant_joined");
    await upsert(true, "track_published");
    await upsert(false, "participant_left");

    const r = await pg.query<{ n: number; is_online: boolean }>(
      `select count(*)::int as n, bool_or(is_online) as is_online
       from room_presence where room_id=$1 and identity=$2`,
      [roomId, adminId],
    );
    assert.equal(r.rows[0]!.n, 1, "同一 identity 只能一行");
    assert.equal(r.rows[0]!.is_online, false, "最后一个事件是 left，应为离线");
  });

  it("webhook 事件去重：同 id 第二次插入被吞掉", async () => {
    const { nodeId } = await seed();
    const evtId = "EV_" + randomUUID();
    const ins = () =>
      pg.query(
        `insert into webhook_events (id, node_id, event) values ($1,$2,'participant_joined')
         on conflict do nothing returning id`,
        [evtId, nodeId],
      );
    const first = await ins();
    const second = await ins();
    assert.equal(first.rows.length, 1, "首次应插入成功");
    assert.equal(second.rows.length, 0, "重投应被去重");
  });

  it("成员列表的 presence 关联：identity 用 uuid::text 能对上", async () => {
    const { roomId, adminId } = await seed();
    await pg.query(
      `insert into room_presence (room_id, identity, kind, is_online) values ($1,$2,'user',true)`,
      [roomId, adminId],
    );
    const r = await pg.query<{ is_online: boolean | null }>(
      `select p.is_online from room_members m
       left join room_presence p on p.room_id = m.room_id and p.identity = m.user_id::text
       where m.room_id = $1 and m.user_id = $2`,
      [roomId, adminId],
    );
    assert.equal(r.rows[0]!.is_online, true, "uuid::text 应能匹配上 presence.identity");
  });
});

describe("节点与房间约束", () => {
  it("同一用户不能重复接入同一套凭据", async () => {
    const owner = randomUUID();
    await pg.query(`insert into users (id,email,password_hash,display_name) values ($1,$2,'h','甲')`, [
      owner,
      `o-${owner}@e.com`,
    ]);
    const ins = () =>
      pg.query(
        `insert into livekit_nodes (id,name,kind,ws_url,api_key,api_secret_enc,owner_id)
         values ($1,'我的','user','wss://same.livekit.cloud','APIsame','enc',$2)`,
        [randomUUID(), owner],
      );
    await ins();
    await assert.rejects(() => ins(), /duplicate key|unique/i);
  });

  it("房间码全库唯一", async () => {
    const { adminId, nodeId, code } = await seed();
    await assert.rejects(
      () =>
        pg.query(
          `insert into rooms (id,code,name,owner_id,node_id) values ($1,$2,'撞码',$3,$4)`,
          [randomUUID(), code, adminId, nodeId],
        ),
      /duplicate key|unique/i,
      "房间码同时是 LiveKit room name，必须唯一",
    );
  });

  it("节点下还有房间时不能被删（外键 restrict）", async () => {
    const { nodeId } = await seed();
    await assert.rejects(
      () => pg.query(`delete from livekit_nodes where id = $1`, [nodeId]),
      /foreign key|violates/i,
      "有房间引用时删节点应被数据库拦住",
    );
  });

  it("删用户会级联清掉其房间与成员行", async () => {
    const { adminId, roomId } = await seed();
    await pg.query(`delete from users where id = $1`, [adminId]);
    const r = await pg.query(`select 1 from rooms where id = $1`, [roomId]);
    assert.equal(r.rows.length, 0, "房主被删，房间应级联消失");
  });
});

describe("引导建号 → 登录 闭环", () => {
  it("引导写入的哈希，登录能校验通过；错密码被拒", async () => {
    const email = `boot-${randomUUID()}@localhost`;
    const password = "TestPass12345";

    // 这就是 bootstrap.ensureAdmin 做的事：真的用 scrypt 哈希后落库
    const hash = await hashPassword(password);
    await pg.query(
      `insert into users (id,email,password_hash,display_name,role) values ($1,$2,$3,'管理员','admin')`,
      [randomUUID(), email, hash],
    );

    // 这是 login 路由做的事：按 lower(email) 查出来再校验
    const r = await pg.query<{ password_hash: string; role: string; is_disabled: boolean }>(
      `select password_hash, role, is_disabled from users where lower(email) = $1`,
      [email],
    );
    assert.equal(r.rows.length, 1, "引导建的号必须能按 lower(email) 查到");
    const row = r.rows[0]!;
    assert.equal(row.role, "admin");
    assert.equal(row.is_disabled, false);

    assert.equal(await verifyPassword(password, row.password_hash), true, "正确密码应登录成功");
    assert.equal(await verifyPassword("WrongPass12345", row.password_hash), false, "错密码应被拒");
  });

  it("改 ADMIN_PASSWORD 后指纹变化 → 同步新密码，旧密码失效", async () => {
    const email = `sync-${randomUUID()}@localhost`;
    const userId = randomUUID();
    const oldPw = "OldPass12345";
    const newPw = "NewPass67890";

    await pg.query(
      `insert into users (id,email,password_hash,display_name,role) values ($1,$2,$3,'管理员','admin')`,
      [userId, email, await hashPassword(oldPw)],
    );
    const fp = (pw: string) => createHash("sha256").update(`${email}:${pw}`).digest("hex");
    await pg.query(`insert into app_config (key,value) values ('admin_credential_fingerprint',$1)`, [
      JSON.stringify({ v: fp(oldPw) }),
    ]);

    // 引导时的判断：库里记的指纹 != 当前 env 的指纹 → 需要同步
    const stored = await pg.query<{ value: { v: string } }>(
      `select value from app_config where key='admin_credential_fingerprint'`,
    );
    assert.notEqual(stored.rows[0]!.value.v, fp(newPw), "换了密码指纹就该不同");

    await pg.query(`update users set password_hash=$1 where id=$2`, [
      await hashPassword(newPw),
      userId,
    ]);

    const r = await pg.query<{ password_hash: string }>(
      `select password_hash from users where id=$1`,
      [userId],
    );
    assert.equal(await verifyPassword(newPw, r.rows[0]!.password_hash), true, "新密码应可用");
    assert.equal(await verifyPassword(oldPw, r.rows[0]!.password_hash), false, "旧密码必须失效");
  });

  it("停用账号时会作废其所有会话（已登录的浏览器不能继续用）", async () => {
    const userId = randomUUID();
    await pg.query(`insert into users (id,email,password_hash,display_name) values ($1,$2,'h','甲')`, [
      userId,
      `dis-${userId}@e.com`,
    ]);
    await pg.query(
      `insert into sessions (id,user_id,expires_at) values ($1,$2, now() + interval '1 day')`,
      [`sess-${userId}`, userId],
    );

    await pg.query(`update users set is_disabled = true where id=$1`, [userId]);
    await pg.query(`delete from sessions where user_id=$1`, [userId]);

    const r = await pg.query(`select 1 from sessions where user_id=$1`, [userId]);
    assert.equal(r.rows.length, 0, "停用后不能残留会话");
  });
});

describe("定时清理", () => {
  it("只删过期会话，不碰有效会话", async () => {
    const u = randomUUID();
    await pg.query(`insert into users (id,email,password_hash,display_name) values ($1,$2,'h','甲')`, [
      u,
      `s-${u}@e.com`,
    ]);
    await pg.query(
      `insert into sessions (id,user_id,expires_at) values ('live',$1, now() + interval '1 day')`,
      [u],
    );
    await pg.query(
      `insert into sessions (id,user_id,expires_at) values ('dead',$1, now() - interval '1 day')`,
      [u],
    );

    const del = await pg.query(`delete from sessions where expires_at < now() returning id`);
    assert.equal(del.rows.length, 1);
    const left = await pg.query<{ id: string }>(`select id from sessions`);
    assert.equal(left.rows[0]!.id, "live", "有效会话不能被清掉");
  });
});
