import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

// 关键：这个文件里**不设** CREDENTIAL_ENCRYPTION_KEY，专门验证
// 「零配置」路径 —— 密钥由 bootstrap 在运行时注入。
delete process.env.CREDENTIAL_ENCRYPTION_KEY;

import { decryptSecret, encryptSecret, parseKey, setEncryptionKey } from "../src/lib/crypto.ts";

describe("parseKey", () => {
  it("接受 32 字节 base64", () => {
    const raw = randomBytes(32).toString("base64");
    assert.equal(parseKey(raw).length, 32);
  });

  it("拒绝长度不对的密钥", () => {
    assert.throws(() => parseKey(randomBytes(16).toString("base64")), /32 字节/);
    assert.throws(() => parseKey(randomBytes(64).toString("base64")), /32 字节/);
  });

  it("拒绝垃圾输入", () => {
    assert.throws(() => parseKey("not-a-key"));
  });
});

describe("零配置密钥供给", () => {
  it("密钥未就绪时加密要报可读的错，而不是拿空密钥硬跑", () => {
    assert.throws(() => encryptSecret("x"), /密钥未就绪/);
  });

  it("setEncryptionKey 注入后即可正常加解密（无需环境变量）", () => {
    setEncryptionKey(randomBytes(32));
    const plain = "APIsecret_from_db_key";
    assert.equal(decryptSecret(encryptSecret(plain)), plain);
  });

  it("换一把密钥后，旧密文解不开（证明密钥真的参与了运算）", () => {
    const packed = encryptSecret("bound-to-old-key");
    setEncryptionKey(randomBytes(32));
    assert.throws(() => decryptSecret(packed));
  });
});
