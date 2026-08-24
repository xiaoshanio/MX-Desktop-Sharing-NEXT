import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

// crypto.ts 惰性读 env（只在首次加解密时读），所以这里设在 import 之后也来得及
process.env.CREDENTIAL_ENCRYPTION_KEY = randomBytes(32).toString("base64");

import { decryptSecret, encryptSecret, maskSecret } from "../src/lib/crypto.ts";
import { hashPassword, verifyPassword } from "../src/lib/password.ts";

describe("crypto", () => {
  it("往返还原原文", () => {
    const plain = "APIsecret_很长的密钥_🔑";
    assert.equal(decryptSecret(encryptSecret(plain)), plain);
  });

  it("同一明文每次密文不同（IV 随机）", () => {
    const a = encryptSecret("same");
    const b = encryptSecret("same");
    assert.notEqual(a, b);
    assert.equal(decryptSecret(a), decryptSecret(b));
  });

  it("密文被篡改时解密失败（GCM 认证标签）", () => {
    const packed = encryptSecret("tamper-me");
    const buf = Buffer.from(packed, "base64");
    buf[buf.length - 1] ^= 0xff; // 破坏 authTag
    assert.throws(() => decryptSecret(buf.toString("base64")));
  });

  it("截断的密文抛错而不是返回垃圾", () => {
    assert.throws(() => decryptSecret("YWJj"));
  });

  it("maskSecret 不泄露中段", () => {
    const masked = maskSecret("abcdefghijklmnop");
    assert.ok(!masked.includes("defghijklmn"));
    assert.ok(masked.startsWith("abcd"));
  });
});

describe("password", () => {
  it("正确密码校验通过", async () => {
    const stored = await hashPassword("correct horse battery staple");
    assert.equal(await verifyPassword("correct horse battery staple", stored), true);
  });

  it("错误密码校验失败", async () => {
    const stored = await hashPassword("right");
    assert.equal(await verifyPassword("wrong", stored), false);
  });

  it("同一密码两次 hash 不同（salt 随机）", async () => {
    assert.notEqual(await hashPassword("same"), await hashPassword("same"));
  });

  it("Unicode 归一化：等价写法互通", async () => {
    const composed = "cafépass"; // é 单码位
    const decomposed = "cafépass"; // e + 组合音标
    const stored = await hashPassword(composed);
    assert.equal(await verifyPassword(decomposed, stored), true);
  });

  it("畸形的 stored 值返回 false 而不是抛错", async () => {
    for (const bad of ["", "junk", "scrypt$abc$x$y", "bcrypt$1$2$3", "scrypt$1$2$3"]) {
      assert.equal(await verifyPassword("x", bad), false, `应拒绝: ${bad}`);
    }
  });

  it("登录路由的占位 hash 不会误判通过", async () => {
    // login/route.ts 里给「邮箱不存在」用的哑值，防时序探测
    const dummy = "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$AAAA";
    assert.equal(await verifyPassword("anything", dummy), false);
  });
});
