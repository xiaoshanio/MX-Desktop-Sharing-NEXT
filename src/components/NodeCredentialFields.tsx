"use client";

import { useState } from "react";

export type NodeDraft = {
  name: string;
  wsUrl: string;
  apiKey: string;
  apiSecret: string;
};

export const emptyNodeDraft = (name = ""): NodeDraft => ({
  name,
  wsUrl: "",
  apiKey: "",
  apiSecret: "",
});

/**
 * 一套 LiveKit 凭据的录入控件 + 内置的「怎么白手起一个免费节点」指引。
 * setup / 建房 / 节点管理三处共用，保证引导话术只有一份。
 */
export function NodeCredentialFields({
  value,
  onChange,
}: {
  value: NodeDraft;
  onChange: (next: NodeDraft) => void;
}) {
  const [showGuide, setShowGuide] = useState(false);
  const set = <K extends keyof NodeDraft>(k: K, v: NodeDraft[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">需要一套 LiveKit 的 URL / API Key / API Secret</span>
        <button type="button" className="ghost" onClick={() => setShowGuide((s) => !s)}>
          {showGuide ? "收起指引" : "我还没有，怎么弄？"}
        </button>
      </div>

      {showGuide && (
        <div
          className="panel"
          style={{ marginTop: 12, marginBottom: 0, background: "#0e1216" }}
        >
          <h2>三分钟开一个免费 LiveKit Cloud 节点</h2>
          <ol className="steps">
            <li>
              打开 <a href="https://cloud.livekit.io" target="_blank" rel="noreferrer">
                cloud.livekit.io
              </a>{" "}
              注册，免费的 Build 计划不需要绑卡。
            </li>
            <li>建一个 project，名字随意。创建完会给你一个 <code>wss://xxx.livekit.cloud</code> 地址。</li>
            <li>
              进 Settings → Keys → 新建一个 API Key，会得到 <code>API Key</code> 和{" "}
              <code>API Secret</code>。Secret 只显示一次，先复制出来。
            </li>
            <li>把这三个值填到下面。保存前本站会实地打一次 LiveKit API 验证，填错了不会存进去。</li>
          </ol>
          <p className="muted">
            为什么建议你用自己的节点：免费额度是按 project 算的（约 5,000 WebRTC 参与者分钟 +
            50 GB 下行/月，超了直接失败不扣费）。你自己接一个，烧的就是你自己的额度，
            不跟别人抢。
          </p>
        </div>
      )}

      <label>节点名称（只是给你自己看的）</label>
      <input
        type="text"
        required
        placeholder="我的 LiveKit"
        value={value.name}
        onChange={(e) => set("name", e.target.value)}
      />

      <label>LiveKit 地址</label>
      <input
        type="text"
        required
        placeholder="wss://your-project.livekit.cloud"
        value={value.wsUrl}
        onChange={(e) => set("wsUrl", e.target.value)}
      />
      <p className="muted">复制成 https:// 开头也行，会自动改成 wss://。</p>

      <label>API Key</label>
      <input
        type="text"
        required
        placeholder="APIxxxxxxxx"
        value={value.apiKey}
        onChange={(e) => set("apiKey", e.target.value)}
      />

      <label>API Secret</label>
      <input
        type="password"
        required
        autoComplete="new-password"
        value={value.apiSecret}
        onChange={(e) => set("apiSecret", e.target.value)}
      />
      <p className="muted">Secret 会加密后落库，任何接口都不会再把它回传出来。</p>
    </div>
  );
}
