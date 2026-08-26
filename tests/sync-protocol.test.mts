import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ClockSync,
  HARD_SEEK_THRESHOLD,
  IN_SYNC_THRESHOLD,
  decodeSync,
  encodeSync,
  planCorrection,
  projectedPosition,
  type SyncStateMessage,
} from "../src/lib/sync-protocol.ts";

/**
 * 同步播放器的时钟与纠偏算法。
 *
 * 这一坨是整个同步功能里唯一「算错了但界面上看不出来」的部分 —— 符号搞反的话
 * 落后的人会被调得更慢，偏差自己越滚越大，而表现只是「有时候不太同步」。
 * 所以在这里把方向和边界钉死。
 */

const state = (over: Partial<SyncStateMessage> = {}): SyncStateMessage => ({
  t: "state",
  playerId: "p1",
  url: "https://example.com/a.mkv",
  paused: false,
  position: 100,
  at: 1_000_000,
  rate: 1,
  seq: 1,
  ...over,
});

describe("编解码", () => {
  it("往返不变形", () => {
    const message = state();
    assert.deepEqual(decodeSync(encodeSync(message)), message);
  });

  it("垃圾数据返回 null 而不是抛错", () => {
    assert.equal(decodeSync(new TextEncoder().encode("not json")), null);
    assert.equal(decodeSync(new TextEncoder().encode('{"a":1}')), null);
  });
});

describe("ClockSync", () => {
  it("没有样本时退化成本机时间", () => {
    const clock = new ClockSync();
    assert.equal(clock.ready, false);
    assert.ok(Math.abs(clock.hostNow() - Date.now()) < 50);
  });

  it("对称延迟下能算出时钟偏移", () => {
    // 房主时钟比本机快 5000ms，单程延迟 20ms
    const clock = new ClockSync();
    clock.accept({ c0: 1000, s: 1000 + 5000 + 20, c1: 1040 });
    assert.equal(clock.ready, true);
    assert.equal(clock.stats.offsetMs, 5000);
    assert.equal(clock.stats.halfRttMs, 20);
  });

  it("取 rtt 最小的样本，不被卡顿样本拖歪", () => {
    const clock = new ClockSync();
    // 先来一个 rtt=400ms 的差样本：它算出的 offset 是错的
    clock.accept({ c0: 0, s: 5000 + 200, c1: 400 });
    // 再来一个 rtt=20ms 的好样本
    clock.accept({ c0: 1000, s: 1000 + 5000 + 10, c1: 1020 });
    assert.equal(clock.stats.offsetMs, 5000, "应该采用低延迟那次的估计");
    assert.equal(clock.stats.halfRttMs, 10);
  });

  it("丢弃负数和荒谬的 rtt（中途改过系统时间）", () => {
    const clock = new ClockSync();
    clock.accept({ c0: 1000, s: 6000, c1: 900 }); // 负 rtt
    clock.accept({ c0: 0, s: 6000, c1: 60_000 }); // 60 秒 rtt
    assert.equal(clock.ready, false, "两个样本都该被丢掉");
  });
});

describe("projectedPosition", () => {
  it("播放中按房主时钟往前推", () => {
    // 快照是「1_000_000 这一刻在第 100 秒」，现在房主时钟走到 1_003_000
    assert.equal(projectedPosition(state(), 1_003_000), 103);
  });

  it("倍速会放大推进量", () => {
    assert.equal(projectedPosition(state({ rate: 2 }), 1_003_000), 106);
  });

  it("暂停时位置就是快照位置，不随时间走", () => {
    assert.equal(projectedPosition(state({ paused: true }), 1_099_000), 100);
  });

  it("不会推出负数", () => {
    assert.equal(projectedPosition(state({ position: 1 }), 1_000_000 - 5000), 0);
  });
});

describe("planCorrection", () => {
  const base = { hostRate: 1, paused: false };

  it("偏差在阈值内就不动", () => {
    const plan = planCorrection({ ...base, target: 100, actual: 100.05 });
    assert.equal(plan.kind, "none");
  });

  it("大偏差硬 seek 到目标", () => {
    const plan = planCorrection({ ...base, target: 100, actual: 130 });
    assert.equal(plan.kind, "seek");
    assert.equal(plan.kind === "seek" && plan.to, 100);
  });

  it("落后时放快（这条搞反了偏差会自己发散）", () => {
    // actual < target 表示自己落后了，应该加速追
    const plan = planCorrection({ ...base, target: 100, actual: 99.6 });
    assert.equal(plan.kind, "rate");
    assert.ok(plan.kind === "rate" && plan.rate > 1, `期望 >1，实际 ${plan.kind === "rate" && plan.rate}`);
  });

  it("超前时放慢", () => {
    const plan = planCorrection({ ...base, target: 100, actual: 100.4 });
    assert.equal(plan.kind, "rate");
    assert.ok(plan.kind === "rate" && plan.rate < 1);
  });

  it("微调幅度夹在 ±8% 内", () => {
    // 取一个刚好在硬 seek 阈值以下的偏差，此时微调量应该已经被夹住
    const behind = planCorrection({ ...base, target: 100, actual: 100 - HARD_SEEK_THRESHOLD + 0.01 });
    assert.equal(behind.kind, "rate");
    assert.ok(behind.kind === "rate" && behind.rate <= 1.08 + 1e-9, `实际 ${behind.kind === "rate" && behind.rate}`);
    assert.ok(behind.kind === "rate" && behind.rate >= 1.0);
  });

  it("微调以房主倍速为基准，而不是以 1 为基准", () => {
    // 房主在 2 倍速看，观众落后时应该在 2 倍速附近调，不是往 1 附近调
    const plan = planCorrection({ target: 100, actual: 99.6, hostRate: 2, paused: false });
    assert.equal(plan.kind, "rate");
    assert.ok(plan.kind === "rate" && plan.rate > 2, `期望 >2，实际 ${plan.kind === "rate" && plan.rate}`);
  });

  it("暂停时只用 seek 对齐，绝不用倍速（暂停着调倍速追不上任何东西）", () => {
    const plan = planCorrection({ target: 100, actual: 105, hostRate: 1, paused: true });
    assert.equal(plan.kind, "seek");

    const tiny = planCorrection({
      target: 100,
      actual: 100 + IN_SYNC_THRESHOLD / 2,
      hostRate: 1,
      paused: true,
    });
    assert.equal(tiny.kind, "none");
  });
});
