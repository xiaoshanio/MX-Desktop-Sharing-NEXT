import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { humanizeError, isBenignError } from "../src/lib/error-text.ts";

/**
 * 报错翻译与「哪些报错不该打扰用户」。
 *
 * 这一坨的价值全在边界上：漏掉一条 benign 规则，用户就会看到一条其实无害的
 * 红色提示（开发环境每次进房都弹一次）；多认一条，真故障就被吞掉了。
 */

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
  it("把 LiveKit 的英文连接错误翻成中文", () => {
    const text = humanizeError(new Error("could not establish signal connection: 500"));
    assert.match(text, /连不上/);
    // 不能把英文原文直接丢给用户
    assert.doesNotMatch(text, /could not establish/);
  });

  it("翻译屏幕共享被拒、CORS、编码不支持这几类", () => {
    assert.match(humanizeError(new Error("NotAllowedError: denied")), /屏幕共享/);
    assert.match(humanizeError(new Error("blocked by CORS policy")), /跨域/);
    assert.match(humanizeError(new Error("WebCodecs decoder unavailable")), /编码/);
    assert.match(humanizeError(new Error("Failed to fetch")), /网络/);
  });

  it("我们自己 API 抛的中文消息原样保留", () => {
    // lib/http.ts 的错误约定本来就是中文，不该被再翻一遍
    const message = "该邮箱已注册";
    assert.equal(humanizeError(new Error(message)), message);
  });

  it("认不出来的英文原样保留，而不是抹成「未知错误」", () => {
    const message = "Widget rendering failed with code 7";
    assert.equal(humanizeError(new Error(message)), message);
  });

  it("空消息给一句兜底而不是空字符串", () => {
    assert.ok(humanizeError(new Error("")).length > 0);
  });

  it("非 Error 输入不炸", () => {
    assert.ok(humanizeError("boom").length > 0);
    assert.ok(humanizeError(null).length > 0);
    assert.ok(humanizeError({ message: "对象形态的错误" }).length > 0);
  });
});
