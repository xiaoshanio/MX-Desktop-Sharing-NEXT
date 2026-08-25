"use client";

import { useState } from "react";

import { Button, Icon, TextField } from "@/ui";

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
 * One set of LiveKit credentials, plus the built-in "how do I get these" guide.
 * Shared by room creation and node management so the walkthrough copy exists once.
 */
export function NodeCredentialFields({
  value,
  onChange,
}: {
  value: NodeDraft;
  onChange: (next: NodeDraft) => void;
}) {
  const [showGuide, setShowGuide] = useState(false);
  const set = <K extends keyof NodeDraft>(key: K, next: NodeDraft[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="mx-form">
      <div className="mx-inline">
        <span className="mx-text-caption">需要一套 LiveKit 的地址 / API Key / API Secret</span>
        <span style={{ flex: 1 }} />
        <Button variant="subtle" size="sm" onClick={() => setShowGuide((state) => !state)}>
          <Icon name="info" size={15} />
          {showGuide ? "收起指引" : "我还没有，怎么弄？"}
        </Button>
      </div>

      {showGuide && (
        <div className="mx-guide">
          <h3 className="mx-guide__title">三分钟开一个免费 LiveKit Cloud 节点</h3>
          <ol className="mx-steps">
            <li>
              打开{" "}
              <a href="https://cloud.livekit.io" target="_blank" rel="noreferrer">
                cloud.livekit.io
              </a>{" "}
              注册，免费的 Build 计划不需要绑卡。
            </li>
            <li>
              建一个 project，名字随意。创建完会给你一个 <code>wss://xxx.livekit.cloud</code> 地址。
            </li>
            <li>
              进 Settings → Keys → 新建一个 API Key，会得到 <code>API Key</code> 和{" "}
              <code>API Secret</code>。Secret 只显示一次，先复制出来。
            </li>
            <li>把这三个值填到下面。保存前本站会实地打一次 LiveKit API 验证，填错了不会存进去。</li>
          </ol>
          <p className="mx-guide__note">
            为什么建议你用自己的节点：免费额度是按 project 算的（约 5,000 WebRTC
            参与者分钟 + 50 GB 下行/月，超了直接失败不扣费）。你自己接一个，烧的就是你自己的额度，不跟别人抢。
          </p>
        </div>
      )}

      <TextField
        label="节点名称"
        required
        placeholder="我的 LiveKit"
        hint="只是给你自己看的，随便起。"
        value={value.name}
        onChange={(event) => set("name", event.target.value)}
      />

      <TextField
        label="LiveKit 地址"
        required
        mono
        placeholder="wss://your-project.livekit.cloud"
        hint="复制成 https:// 开头也行，会自动改成 wss://。"
        value={value.wsUrl}
        onChange={(event) => set("wsUrl", event.target.value)}
      />

      <div className="mx-field-grid">
        <TextField
          label="API Key"
          required
          mono
          placeholder="APIxxxxxxxx"
          value={value.apiKey}
          onChange={(event) => set("apiKey", event.target.value)}
        />
        <TextField
          label="API Secret"
          required
          type="password"
          autoComplete="new-password"
          hint="加密后落库，任何接口都不会再把它回传出来。"
          value={value.apiSecret}
          onChange={(event) => set("apiSecret", event.target.value)}
        />
      </div>
    </div>
  );
}
