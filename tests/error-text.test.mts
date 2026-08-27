import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { humanizeError, isBenignError } from "../src/lib/error-text.ts";

/**
 * 报错翻译与「哪些报错不该打扰用户」。
 *
 * 这一坨的价值全在边界上：漏掉一条 benign 规则，用户就会看到一条其实无害的
 * 红色提示（开发环境每次进房都弹一次）；多认一条，真故障就被吞掉了。
 */

/**
 * 假翻译器：原样回传消息键。
 *
 * 断言因此对着「这条报错映射到哪个键」写，而不是对着某一种语言的措辞写 ——
 * 措辞在语言包里，七份都由类型系统保证键齐全（见 i18n/messages/types.ts），
 * 而这个模块负责的恰恰只有那个映射。
 */
const t = Object.assign(
  (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key} ${JSON.stringify(vars)}` : key,
  { raw: (keyOrText: string) => keyOrText, locale: "en" },
);

describe("isBenignError", () => {
  it("认出严格模式双挂载导致的信号连接中断", () => {
    /**
     * 这是用户报的那条：React 严格模式在开发环境把 effect 跑两遍，
     * LiveKitRoom 第一次的信号连接在建立中途被卸载逻辑 abort。
     * 第二次挂载会正常连上 —— 功能是好的，不该弹提示。
     */
    const err = new Error("could not establish signal connection: Abort handler called");
    assert.equal(isBenignError(err), true);
  });

  it("认出主动断开和用户取消共享", () => {
    assert.equal(isBenignError(new Error("Client initiated disconnect")), true);
    assert.equal(isBenignError(new Error("Permission denied by system")), true);
  });

  it("真故障不能被当成无害", () => {
    for (const message of [
      "could not establish signal connection: 401 unauthorized",
      "room is full",
      "invalid access token",
      "failed to fetch",
    ]) {
      assert.equal(isBenignError(new Error(message)), false, message);
    }
  });

  it("能顺着 cause 链看到真实原因", () => {
    // livekit 有时把原因挂在 cause 上而不是拼进 message
    const err = new Error("ConnectionError") as Error & { cause?: Error };
    err.cause = new Error("Abort handler called");
    assert.equal(isBenignError(err), true);
  });

  it("非 Error 输入不炸", () => {
    assert.equal(isBenignError("Abort handler called"), true);
    assert.equal(isBenignError(null), false);
    assert.equal(isBenignError(undefined), false);
  });
});

describe("humanizeError", () => {
  it("LiveKit 的英文连接错误映射到 err.signalConnection", () => {
    const text = humanizeError(t, new Error("could not establish signal connection: 500"));
    assert.equal(text, "err.signalConnection");
    // 不能把英文原文直接丢给用户
    assert.doesNotMatch(text, /could not establish/);
  });

  it("屏幕共享被拒、CORS、编码不支持、网络失败各走各的键", () => {
    assert.equal(humanizeError(t, new Error("NotAllowedError: denied")), "err.screenShareDenied");
    assert.equal(humanizeError(t, new Error("blocked by CORS policy")), "err.cors");
    assert.equal(humanizeError(t, new Error("WebCodecs decoder unavailable")), "err.codec");
    assert.equal(humanizeError(t, new Error("Failed to fetch")), "err.network");
  });

  it("服务端已经翻好的消息原样保留", () => {
    // route() 那一层已经按调用者的语言翻过了，不该被再翻一遍
    const message = "That email is already registered";
    assert.equal(humanizeError(t, new Error(message)), message);
  });

  it("认不出来的英文原样保留，而不是抹成「未知错误」", () => {
    const message = "Widget rendering failed with code 7";
    assert.equal(humanizeError(t, new Error(message)), message);
  });

  it("空消息给一句兜底而不是空字符串", () => {
    assert.equal(humanizeError(t, new Error("")), "err.unknown");
  });

  it("服务端没给消息的 HTTP 错误带上状态码", () => {
    const err = Object.assign(new Error(""), { name: "HttpError", status: 502 });
    assert.equal(humanizeError(t, err), 'err.httpFailed {"status":502}');
  });

  it("非 Error 输入不炸", () => {
    assert.ok(humanizeError(t, "boom").length > 0);
    assert.ok(humanizeError(t, null).length > 0);
    assert.ok(humanizeError(t, { message: "对象形态的错误" }).length > 0);
  });
});
