"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api-client";
import { NodeCredentialFields, type NodeDraft, emptyNodeDraft } from "@/components/NodeCredentialFields";

type SetupResult = {
  builtinNode: { id: string; name: string; capabilities: { ingress: boolean } };
  webhookUrl: string;
};

/**
 * 首次初始化：建管理员 + 写入内置 LiveKit 节点。
 * 内置节点是「普通用户不接自己的节点也能用」的兜底，配额烧站长的账号，
 * 所以默认给它挂上房间数上限。
 */
export default function SetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [node, setNode] = useState<NodeDraft>(emptyNodeDraft("内置节点"));
  const [allowPublic, setAllowPublic] = useState(true);
  const [maxRooms, setMaxRooms] = useState("20");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<SetupResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const result = await api<SetupResult>("/api/setup", {
        method: "POST",
        json: {
          setupToken: setupToken || undefined,
          admin: { email, displayName, password },
          builtinNode: {
            ...node,
            allowPublic,
            maxRooms: maxRooms.trim() === "" ? null : Number(maxRooms),
          },
        },
      });
      setDone(result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="wrap">
        <div className="panel">
          <h1>初始化完成</h1>
          <p className="muted">
            内置节点「{done.builtinNode.name}」已写入
            {done.builtinNode.capabilities.ingress
              ? "，Ingress 可用（能生成 OBS 推流地址）"
              : "，但 Ingress 不可用 —— 这个节点上的房间拿不到 OBS 推流地址"}
            。
          </p>

          <h2 style={{ marginTop: 20 }}>还差一步：去 LiveKit 控制台配 webhook</h2>
          <p className="muted">
            没有它，房间里的上线/下线状态不会落库（前端 SDK 仍能实时看到，只是服务端没有记录）。
          </p>
          <div className="copybox">
            <span className="mono">{done.webhookUrl}</span>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            LiveKit Cloud → 你的项目 → Settings → Webhooks，把上面这个地址填进去。
            每个节点的回调地址都不一样（路径里带 nodeId），因为验签要用对应节点自己的密钥。
          </p>

          <div className="row" style={{ marginTop: 20 }}>
            <button onClick={() => router.push("/dashboard")}>进入控制台</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <form className="panel" onSubmit={submit}>
        <h1>初始化本站</h1>
        <p className="muted">
          只能做一次。这一步建立管理员账号，并写入一个全站共享的内置 LiveKit 节点。
        </p>

        <h2 style={{ marginTop: 24 }}>管理员账号</h2>
        <label>邮箱</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>显示名</label>
        <input
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <label>密码（至少 10 位）</label>
        <input
          type="password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label>SETUP_TOKEN（只有服务端设了才需要填）</label>
        <input type="text" value={setupToken} onChange={(e) => setSetupToken(e.target.value)} />

        <h2 style={{ marginTop: 28 }}>内置 LiveKit 节点</h2>
        <p className="muted">
          保存前会用这套凭据实际打一次 LiveKit API，填错了不会存进去。
        </p>
        <NodeCredentialFields value={node} onChange={setNode} />

        <label style={{ marginTop: 16 }}>
          <input
            type="checkbox"
            checked={allowPublic}
            onChange={(e) => setAllowPublic(e.target.checked)}
            style={{ width: "auto", marginRight: 8 }}
          />
          允许普通用户用内置节点建房
        </label>
        <p className="muted">
          关掉的话，普通用户必须接入自己的 LiveKit Cloud 项目才能建房 —— 配额各烧各的，
          这也是本项目推荐的用法。
        </p>

        <label>内置节点房间数上限（留空 = 不限）</label>
        <input
          type="number"
          min={1}
          value={maxRooms}
          onChange={(e) => setMaxRooms(e.target.value)}
        />
        <p className="muted">
          内置节点的免费额度是全站共享的，一个人就能烧穿。建议留个上限。
        </p>

        {err && <div className="err">{err}</div>}
        <div className="row" style={{ marginTop: 20 }}>
          <button type="submit" disabled={busy}>
            {busy ? "正在校验凭据…" : "完成初始化"}
          </button>
        </div>
      </form>
    </div>
  );
}
