import type { Metadata } from "next";
import Link from "next/link";

import { currentUser } from "@/lib/auth";
import { APP_NAME, APP_TAGLINE, COPYRIGHT } from "@/lib/brand";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon, LinkButton, type IconName } from "@/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${APP_NAME} · ${APP_TAGLINE}`,
  description:
    "基于 LiveKit 的桌面共享。每个房间绑定一套自己的 LiveKit 凭据，用 OBS 或浏览器把屏幕推给房间里的人。鉴权在协议层，两个环境变量就能跑。",
};

const REPO = "https://github.com/xiaoshanio/MX-Desktop-Sharing-NEXT";
const DOC_DEPLOY = `${REPO}/blob/main/DEPLOY.md`;
const DOC_README = `${REPO}/blob/main/README.md`;
/** 「提出问题」和「联系我们」都落到这里 —— 本项目没有单独的邮箱或表单。 */
const ISSUES = `${REPO}/issues/new`;
const DISCUSSIONS = `${REPO}/discussions`;

/** 还在构想阶段的桌面端产品名。刻意和本站的名字区分开，别让人以为已经能下载了。 */
const APP_PRODUCT = "MX-Desktop-Sharing-APP";

const NAV = [
  { href: "#paths", label: "推流路线" },
  { href: "#quota", label: "免费额度" },
  { href: "#features", label: "功能" },
  { href: "#start", label: "快速开始" },
  { href: "#app", label: "APP 预告" },
  { href: "#qa", label: "Q&A" },
];

/** 首屏那张拓扑图里的假数据。房间码用的是真实字母表（无歧义字符）。 */
const TOPOLOGY: Array<{
  name: string;
  tag: string;
  url: string;
  rooms: Array<{ code: string; state: string; live?: boolean }>;
}> = [
  {
    name: "节点 A",
    tag: "你接入的",
    url: "wss://your-project.livekit.cloud",
    rooms: [
      { code: "7K3M9Q", state: "3 人在线", live: true },
      { code: "B2W8XR", state: "空闲" },
    ],
  },
  {
    name: "节点 B",
    tag: "同事接入的",
    url: "wss://her-project.livekit.cloud",
    rooms: [{ code: "QF4L2N", state: "1 人在线", live: true }],
  },
  {
    name: "内置节点",
    tag: "管理员共享 · 限 20 间",
    url: "wss://mx-builtin.livekit.cloud",
    rooms: [{ code: "M9ZP6T", state: "5 人在线", live: true }],
  },
];

const FEATURES: Array<{ icon: IconName; title: string; body: React.ReactNode }> = [
  {
    icon: "shield",
    title: "鉴权在协议层，不是前端过滤",
    body: (
      <>
        不在成员表里 → 签不出 token → 连不上房间 → 订阅不到任何一条 track。签出来的 grant
        里 <code>room</code> 只写得下一个房间名，所以这张 token
        物理上打不开别的房间。非成员一律返回 404，拿房间码也探测不出东西。
      </>
    ),
  },
  {
    icon: "node",
    title: "节点自带，额度各烧各的",
    body: (
      <>
        接入你自己的 LiveKit Cloud project，建房时选用哪一套。保存前本站会拿这套凭据实地打一次
        API 体检，填错的不入库；Ingress 能不能用也一并探出来标在节点上。
      </>
    ),
  },
  {
    icon: "broadcast",
    title: "OBS 走 WHIP 直通",
    body: (
      <>
        <code>enableTranscoding: false</code> —— 不吃每月 60
        分钟的转码额度。一人一条推流地址，可轮换、可撤销；stream key 加密落库，只对本人解密回显。
      </>
    ),
  },
  {
    icon: "ban",
    title: "「OBS 直播」是真开关",
    body: (
      <>
        房主关掉它，正在推的立刻断：删掉 ingress 让旧密钥再也连不上来，同时把 <code>obs:</code>{" "}
        那个参与者踢出房间。不是只改一个标志位、「显示已关闭其实还在推」的假开关。
      </>
    ),
  },
  {
    icon: "film",
    title: "同步播放",
    body: (
      <>
        房主开一个播放器，房间里的人一起看同一个片源。进度走 LiveKit 的 data channel
        广播，先用 ping/pong 估出两台机器的时钟偏移再对齐，视频字节完全不经过本服务。
      </>
    ),
  },
  {
    icon: "link",
    title: "邀请链接",
    body: (
      <>
        token 只存哈希，可设有效期、次数上限、随时撤销。兑换用一条条件 UPDATE
        原子占名额，并发下打不穿 <code>max_uses</code>；未登录打开会先跳登录再自动入房。
      </>
    ),
  },
  {
    icon: "key",
    title: "两个环境变量就能跑",
    body: (
      <>
        <code>DATABASE_URL</code> 加 <code>ADMIN_PASSWORD</code>
        。管理员账户首次启动自动创建，凭据加密密钥没配就自己生成落库，LiveKit
        在网页里配、不占环境变量。没有安装向导。
      </>
    ),
  },
  {
    icon: "logs",
    title: "出问题有地方看",
    body: (
      <>
        房间内可展开审计日志（不记任何密钥）。<code>/api/health</code>{" "}
        不用登录，逐项报告数据库连通性、12 张表建没建、管理员引导过没过 ——
        缺哪几张表直接列出来，不用对着报错猜。
      </>
    ),
  },
];

/** 50 GB 下行是主要瓶颈。数字的推导过程见 README 的「免费额度能用多久」。 */
const QUOTA_ROWS = [
  { rate: "4 Mbps", note: "1080p 高码率", minutes: "1,667", hours: "≈ 28 h" },
  { rate: "2.5 Mbps", note: "1080p 常规", minutes: "2,667", hours: "≈ 44 h" },
  { rate: "1.5 Mbps", note: "720p", minutes: "4,444", hours: "≈ 74 h" },
  { rate: "0.8 Mbps", note: "低码率", minutes: "5,000", hours: "≈ 83 h" },
];

/**
 * 桌面端预告里那四条。
 *
 * 全部用「打算」「考虑」的语气 —— 这个产品一行代码都还没写，
 * 写成既成事实会变成假承诺。
 */
const APP_IDEAS: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "shield",
    title: "端到端加密",
    body: "消息和分享的内容在两端加解密，服务端只负责转发密文 —— 拿到服务器也读不出聊了什么。",
  },
  {
    icon: "node",
    title: "自部署",
    body: "服务端自己跑，账号、消息、密钥都不必交给第三方。和本站一样，不搞非要联网激活的那套。",
  },
  {
    icon: "share",
    title: "聊天 + 屏幕在同一处",
    body: "文字、文件和屏幕共享在一个客户端里，不用一边开会议软件一边开聊天软件。",
  },
  {
    icon: "signal",
    title: "桌面端原生",
    body: "Windows / macOS / Linux 客户端，不是浏览器标签页 —— 采集整个桌面、常驻后台、开机自启这些浏览器给不了。",
  },
];

/**
 * 首页 Q&A。
 *
 * 每一条都能在 README / 代码里落到实处 —— 这一节最容易变成软广，
 * 所以只收「真的会被问到、且答案是确定的」问题，不写「我们致力于……」那种话。
 */
const QA: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "要自己准备服务器吗？",
    a: (
      <>
        不用准备媒体服务器。本站部署到 Vercel + Neon（都有免费档），画面走 LiveKit
        Cloud，你只需要一套 LiveKit 凭据 —— 免费的 Build 计划不用绑卡。真想全自建也行：地址支持{" "}
        <code className="mx-code">ws://</code>，但要用 OBS 推流就得自己额外部署 Ingress 和 Redis。
      </>
    ),
  },
  {
    q: "免费额度到底能用多久？",
    a: (
      <>
        多数情况下先撞的是 50 GB 下行带宽，不是 5,000 参与者分钟。一个人分享、三个人看
        1080p，一个月大约 15 小时。所以本项目让每个人接自己的 LiveKit
        项目：额度从「站长的一份」变成「每人一份」。
      </>
    ),
  },
  {
    q: "屏幕画面会经过你们的服务器吗？",
    a: (
      <>
        不会。浏览器共享时本站只被访问一次 —— 领一张 token，之后画面直连 LiveKit
        节点。同步播放器更彻底：视频字节由你的浏览器直接向片源发 Range
        请求，既不过本服务也不过 LiveKit。
      </>
    ),
  },
  {
    q: "一定要装 OBS 吗？",
    a: (
      <>
        不用。浏览器里点一下就能共享（<code className="mx-code">getDisplayMedia</code>
        ，1920×1080@15fps，桌面共享优先给分辨率不给帧率）。OBS 那条路是给要多路场景、
        要转场和叠加的人准备的，走 WHIP 直通、不吃转码额度。
      </>
    ),
  },
  {
    q: "别人拿到房间码就能进来吗？",
    a: (
      <>
        不能。成员表是唯一的鉴权依据：不在表里就签不出 token，也就订阅不到任何一条 track。
        签出来的 token 里房间名只写得下一个，物理上打不开别的房间；非成员访问一律返回
        404，连「这个房间存不存在」都探不出来。
      </>
    ),
  },
  {
    q: "把「OBS 直播」关掉，正在推的流会断吗？",
    a: (
      <>
        会，立刻断。关闭那一刻服务端会删掉 ingress（旧的推流密钥再也连不上）并把{" "}
        <code className="mx-code">obs:</code> 那个参与者踢出房间。不是只改一个标志位、
        界面显示已关闭但其实还在推的假开关。浏览器共享走的是另一条路，不受它影响。
      </>
    ),
  },
  {
    q: "数据库被拖走了，第三方密钥会跟着泄露吗？",
    a: (
      <>
        不会。GitHub / Google / Turnstile / Resend 的密钥都是 AES-256-GCM
        加密后才落库的，而主密钥可以用 <code className="mx-code">CREDENTIAL_ENCRYPTION_KEY</code>{" "}
        放在数据库之外。任何接口都不回传密钥明文，管理后台里显示的是掩码。
      </>
    ),
  },
  {
    q: "可以只让我自己用，不让陌生人注册吗？",
    a: (
      <>
        可以。管理后台 →「站点设置」里关掉「开放注册」：邮箱密码注册、第三方登录首次进来、
        邮箱验证码首次进来这三条建号的路会一起被拦下，提示「本站点禁止注册」；
        已有账号的人照旧能登录。拦截在服务端做，不是把按钮藏起来。
      </>
    ),
  },
];

export default async function HomePage() {
  // 首页必须在库没配好、连不上的时候也能打开 —— 它正是那种情况下唯一还能读的东西。
  // 所以这里只把「有没有登录」当作装饰信息，取不到就按未登录渲染。
  const user = await currentUser().catch(() => null);
  const entryHref = user ? "/dashboard" : "/login";
  const entryLabel = user ? "进入控制台" : "登录 / 注册";

  return (
    <div className="mx-land">
      <header className="mx-land__bar mx-acrylic">
        <div className="mx-land__measure mx-land__bar-inner">
          <Link href="/" className="mx-land__brand">
            <BrandMark size={28} />
            <span className="mx-land__brand-name">{APP_NAME}</span>
          </Link>

          <nav className="mx-land__nav" aria-label="页内导航">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="mx-land__nav-link">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mx-land__bar-actions">
            <ThemeToggle />
            <a
              className="mx-icon-button"
              href={REPO}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="在 GitHub 上查看源码"
              title="在 GitHub 上查看源码"
            >
              <Icon name="github" size={18} />
            </a>
            <LinkButton href={entryHref} variant="primary" size="sm">
              {entryLabel}
            </LinkButton>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- 首屏 ---------- */}
        <section className="mx-land__hero">
          <div className="mx-land__measure mx-land__hero-inner">
            <div className="mx-land__hero-copy">
              <span className="mx-land__tag">
                <BrandMark size={16} />
                基于 <strong>LiveKit</strong> · 多节点 · 零配置启动
              </span>

              <h1 className="mx-land__h1">
                一房一节点，
                <em>一人一推流地址。</em>
              </h1>

              <p className="mx-land__hero-lead">
                把屏幕推给房间里的人 —— 用 OBS，或者只用浏览器。每个房间绑定一套自己的 LiveKit
                凭据，媒体流量和免费额度就烧在那个节点上，谁也不抢谁的。
              </p>

              <div className="mx-land__cta">
                <LinkButton href={entryHref} variant="primary" size="lg">
                  {entryLabel}
                  <Icon name="chevronRight" size={16} />
                </LinkButton>
                <LinkButton
                  href={DOC_DEPLOY}
                  size="lg"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  部署到 Vercel
                  <Icon name="external" size={15} />
                </LinkButton>
              </div>

              <ul className="mx-land__facts">
                <li>
                  <Icon name="check" size={14} />
                  两个环境变量就能跑
                </li>
                <li>
                  <Icon name="check" size={14} />
                  WHIP 直通，不吃转码额度
                </li>
                <li>
                  <Icon name="check" size={14} />
                  鉴权在协议层
                </li>
              </ul>
            </div>

            {/* 首屏配图就是这套架构本身：节点在外层，房间挂在它下面。 */}
            <div className="mx-land__topo">
              <div className="mx-land__topo-bar">
                <span className="mx-land__topo-title">LiveKit 节点</span>
                <span className="mx-land__topo-hint">额度各烧各的</span>
              </div>

              {TOPOLOGY.map((node) => (
                <article className="mx-land__node" key={node.name}>
                  <div className="mx-land__node-top">
                    <span className="mx-land__node-icon">
                      <Icon name="node" size={15} />
                    </span>
                    <span className="mx-land__node-name">{node.name}</span>
                    <span className="mx-land__node-tag">{node.tag}</span>
                  </div>
                  <span className="mx-land__node-url">{node.url}</span>
                  <div className="mx-land__rooms">
                    {node.rooms.map((room) => (
                      <span
                        className="mx-land__room"
                        key={room.code}
                        data-live={room.live ? "true" : undefined}
                      >
                        <span className="mx-land__room-dot" />
                        <code>{room.code}</code>
                        {room.state}
                      </span>
                    ))}
                  </div>
                </article>
              ))}

              <p className="mx-land__topo-foot">
                一个房间只落在一个节点上 —— 流量和免费额度都记在它头上。
              </p>
            </div>
          </div>
        </section>

        {/* ---------- 两条推流路线 ---------- */}
        <section className="mx-land__section" id="paths">
          <div className="mx-land__measure">
            <div className="mx-land__head">
              <span className="mx-land__eyebrow">01 · 推流路线</span>
              <h2 className="mx-land__h2">推流有两条路，它们是分开的</h2>
              <p className="mx-land__lead">
                浏览器那条只经过本站一次 —— 拿 token；之后画面直连 LiveKit。OBS 那条要先在服务端建
                一条 ingress。所以关掉「OBS 直播」，浏览器共享照旧能用。
              </p>
            </div>

            <div className="mx-land__paths">
              <article className="mx-land__path">
                <div className="mx-land__path-top">
                  <Icon name="share" size={18} />
                  <h3 className="mx-land__path-title">从浏览器共享</h3>
                </div>
                <div className="mx-land__hops">
                  <span className="mx-land__hop">浏览器</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop">getDisplayMedia</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop" data-strong="true">
                    LiveKit 节点
                  </span>
                </div>
                <p className="mx-land__path-body">
                  点一下就开始，不用装任何东西。1920×1080@15fps —— 桌面共享优先给分辨率，
                  不给帧率。画面既不过 Vercel，也不过 Ingress。
                </p>
              </article>

              <article className="mx-land__path">
                <div className="mx-land__path-top">
                  <Icon name="broadcast" size={18} />
                  <h3 className="mx-land__path-title">用 OBS 推（WHIP）</h3>
                </div>
                <div className="mx-land__hops">
                  <span className="mx-land__hop">OBS</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop">WHIP 直通</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop">Ingress</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop" data-strong="true">
                    LiveKit 节点
                  </span>
                </div>
                <p className="mx-land__path-body">
                  房间里点「生成推流地址」，拿 Server 和 Bearer Token 填进 OBS
                  的直播设置（服务选 WHIP）。直通不转码，所以几乎不吃机器，也不动那 60 分钟额度。
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ---------- 免费额度实算 ---------- */}
        <section className="mx-land__section" id="quota" data-tint="true">
          <div className="mx-land__measure">
            <div className="mx-land__head">
              <span className="mx-land__eyebrow">02 · 为什么要自带节点</span>
              <h2 className="mx-land__h2">免费额度是试点额度，不是产品额度</h2>
            </div>

            <div className="mx-land__quota">
              <div>
                <p className="mx-land__lead">
                  LiveKit Cloud 的免费 Build 计划按 project 计额度，超出后请求直接失败、不计费，
                  而且同一账号下多个免费项目共享同一份额度。
                </p>

                <div className="mx-land__tiles">
                  <div className="mx-land__tile">
                    <span className="mx-land__tile-value">5,000</span>
                    <span className="mx-land__tile-label">
                      WebRTC 参与者分钟。推流端不计分钟，烧的只有观众
                    </span>
                  </div>
                  <div className="mx-land__tile">
                    <span className="mx-land__tile-value">50 GB</span>
                    <span className="mx-land__tile-label">下行带宽。多数场景下是先撞的那面墙</span>
                  </div>
                  <div className="mx-land__tile">
                    <span className="mx-land__tile-value">60 分钟</span>
                    <span className="mx-land__tile-label">
                      转码额度。RTMP 输入必定转码，一个月只够推 1 小时
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mx-table-wrap">
                  <table className="mx-table">
                    <thead>
                      <tr>
                        <th>推流码率</th>
                        <th data-align="right">50 GB 能撑的观众分钟</th>
                        <th data-align="right">折合观众小时</th>
                      </tr>
                    </thead>
                    <tbody>
                      {QUOTA_ROWS.map((row) => (
                        <tr key={row.rate}>
                          <td>
                            <div className="mx-cell">
                              <span className="mx-cell__label">{row.rate}</span>
                              <span className="mx-cell__hint">{row.note}</span>
                            </div>
                          </td>
                          <td data-align="right">{row.minutes}</td>
                          <td data-align="right">{row.hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mx-land__table-note">
                  约 1.33 Mbps 是分水岭：高于它，50 GB 带宽先撞墙；低于它，5,000
                  分钟先撞墙。观众小时还要除以人数 —— 1 人分享 3 人看 1080p，一个月约 15 小时。
                </p>

                <p className="mx-land__punch">
                  <span>
                    所以本项目把节点做成一等公民：<strong>每个人接自己的 project</strong>
                    ，额度就从「站长的一份」变成「每人一份」。内置节点只用来兜底体验，
                    记得给它设上房间数上限。
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 功能 ---------- */}
        <section className="mx-land__section" id="features">
          <div className="mx-land__measure">
            <div className="mx-land__head">
              <span className="mx-land__eyebrow">03 · 功能</span>
              <h2 className="mx-land__h2">该守住的地方都收在服务端</h2>
              <p className="mx-land__lead">
                能在客户端绕开的检查等于没检查。下面这些都是在签 token、建 ingress
                那一层做掉的。
              </p>
            </div>

            <div className="mx-land__features">
              {FEATURES.map((feature) => (
                <article className="mx-land__feature" key={feature.title}>
                  <span className="mx-land__feature-icon">
                    <Icon name={feature.icon} size={18} />
                  </span>
                  <h3 className="mx-land__feature-title">{feature.title}</h3>
                  <p className="mx-land__feature-body">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 快速开始 ---------- */}
        <section className="mx-land__section" id="start">
          <div className="mx-land__measure">
            <div className="mx-land__head">
              <span className="mx-land__eyebrow">04 · 快速开始</span>
              <h2 className="mx-land__h2">三步就能自己跑一套</h2>
              <p className="mx-land__lead">
                本站不自带媒体服务器，所以真正要准备的只有一个数据库和一套 LiveKit 凭据。
              </p>
            </div>

            <div className="mx-land__steps">
              <article className="mx-land__step">
                <span className="mx-land__step-num">1</span>
                <div className="mx-land__step-body">
                  <h3 className="mx-land__step-title">填两个环境变量</h3>
                  <p>
                    复制 <code className="mx-code">.env.example</code> 为{" "}
                    <code className="mx-code">.env.local</code> —— Next 不读前者，
                    改错了文件不会有任何反应。
                  </p>
                  <pre className="mx-land__pre">
                    <b>DATABASE_URL</b>=postgresql://…@ep-xxx-pooler…/neondb?sslmode=require{"\n"}
                    <b>ADMIN_PASSWORD</b>=换成你自己的密码
                  </pre>
                </div>
              </article>

              <article className="mx-land__step">
                <span className="mx-land__step-num">2</span>
                <div className="mx-land__step-body">
                  <h3 className="mx-land__step-title">建表，启动</h3>
                  <pre className="mx-land__pre">
                    npm install{"\n"}
                    npm run db:migrate <i># 建出 12 张表</i>
                    {"\n"}
                    npm run dev
                  </pre>
                  <p>
                    然后用 <code className="mx-code">admin@localhost</code>{" "}
                    加上面那个密码登录：管理员账户在首次启动时自动创建，没有安装向导。部署到 Vercel
                    的话迁移已经挂在构建流程里，不用手动跑这条。
                  </p>
                </div>
              </article>

              <article className="mx-land__step">
                <span className="mx-land__step-num">3</span>
                <div className="mx-land__step-body">
                  <h3 className="mx-land__step-title">接入一个 LiveKit 节点</h3>
                  <p>
                    侧栏「LiveKit 节点」→「接入节点」，填 <code className="mx-code">wss://</code>{" "}
                    地址和 API Key / Secret。LiveKit Cloud 的免费 Build 计划不用绑卡，大约三分钟
                    就能拿到这三个值；保存前本站会拿它们实地体检一次，填错的不入库。
                  </p>
                  <p>
                    自建 LiveKit 也可以（地址支持 <code className="mx-code">ws://</code>），
                    但要用 OBS 推流就得额外部署 Ingress 和 Redis。
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ---------- 桌面端预告 ---------- */}
        <section className="mx-land__section" id="app" data-tint="true">
          <div className="mx-land__measure">
            <div className="mx-land__head">
              <span className="mx-land__eyebrow">05 · 预告</span>
              <h2 className="mx-land__h2">
                我们在考虑做一个桌面端：<em>{APP_PRODUCT}</em>
              </h2>
              <p className="mx-land__lead">
                自部署的、端到端加密的聊天，并且能分享屏幕 —— 本站有的只是屏幕这一半，
                聊天那一半在浏览器里做不干净。
              </p>
            </div>

            <div className="mx-land__teaser">
              <div className="mx-land__teaser-note">
                <span className="mx-land__teaser-badge">
                  <Icon name="sparkle" size={13} />
                  构想阶段
                </span>
                <p>
                  还<strong>没有开始开发</strong>，也没有时间表，这一节就是一份预告。
                  放在这里是想先听听有没有人真的需要它 —— 有人要，才值得做。
                </p>
              </div>

              <div className="mx-land__teaser-grid">
                {APP_IDEAS.map((idea) => (
                  <article className="mx-land__teaser-card" key={idea.title}>
                    <span className="mx-land__teaser-icon">
                      <Icon name={idea.icon} size={17} />
                    </span>
                    <h3 className="mx-land__teaser-title">{idea.title}</h3>
                    <p className="mx-land__teaser-body">{idea.body}</p>
                  </article>
                ))}
              </div>

              <div className="mx-land__teaser-foot">
                <p>
                  感兴趣、或者觉得哪里想错了，都欢迎说一声。最有用的一句反馈是
                  <strong>「你会用它替掉现在的什么」</strong> —— 比「支持一下」有价值得多。
                </p>
                <div className="mx-land__cta">
                  <LinkButton
                    href={ISSUES}
                    variant="primary"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Icon name="logs" size={15} />
                    提出问题
                  </LinkButton>
                  <LinkButton href={DISCUSSIONS} target="_blank" rel="noreferrer noopener">
                    <Icon name="mail" size={15} />
                    联系我们
                    <Icon name="external" size={14} />
                  </LinkButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Q&A ---------- */}
        <section className="mx-land__section" id="qa">
          <div className="mx-land__measure">
            <div className="mx-land__head">
              <span className="mx-land__eyebrow">06 · Q&amp;A</span>
              <h2 className="mx-land__h2">常见问题</h2>
              <p className="mx-land__lead">
                下面每一条的答案都能在代码或 README 里对上。没被回答到的问题，
                往上一节那两个入口提。
              </p>
            </div>

            {/*
              原生 <details> 而不是自己写一套折叠：这是服务端组件，没有 JS 也要能展开，
              键盘和读屏器的行为浏览器已经做对了。
            */}
            <div className="mx-land__qa">
              {QA.map((item) => (
                <details className="mx-land__qa-item" key={item.q}>
                  <summary className="mx-land__qa-q">
                    <span className="mx-land__qa-chevron">
                      <Icon name="chevronRight" size={15} />
                    </span>
                    {item.q}
                  </summary>
                  <div className="mx-land__qa-a">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 收尾 ---------- */}
        <section className="mx-land__section">
          <div className="mx-land__measure">
            <div className="mx-land__closing">
              <BrandMark size={48} />
              <h2>建个房间，把屏幕推过去</h2>
              <p>
                注册就有自己的工作区，可以接入你自己的 LiveKit
                节点。收到邀请链接的话，直接打开链接登录就会自动入房。
              </p>
              <div className="mx-land__cta">
                <LinkButton href={entryHref} variant="primary" size="lg">
                  {entryLabel}
                  <Icon name="chevronRight" size={16} />
                </LinkButton>
                <LinkButton href={REPO} size="lg" target="_blank" rel="noreferrer noopener">
                  <Icon name="github" size={16} />
                  看源码
                </LinkButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-land__footer">
        <div className="mx-land__measure mx-land__footer-inner">
          <span className="mx-land__footer-brand">
            <BrandMark size={20} />
            {APP_NAME}
          </span>

          <nav className="mx-land__footer-links" aria-label="相关链接">
            <a href={DOC_README} target="_blank" rel="noreferrer noopener">
              文档
              <Icon name="external" size={13} />
            </a>
            <a href={DOC_DEPLOY} target="_blank" rel="noreferrer noopener">
              部署说明
              <Icon name="external" size={13} />
            </a>
            <a href={REPO} target="_blank" rel="noreferrer noopener">
              GitHub
              <Icon name="external" size={13} />
            </a>
            <a href="https://docs.livekit.io" target="_blank" rel="noreferrer noopener">
              LiveKit 文档
              <Icon name="external" size={13} />
            </a>
          </nav>

          <div className="mx-land__footer-note">
            <p className="mx-land__stack">
              Next.js 15 · React 19 · Drizzle + Neon Postgres · LiveKit ——
              界面自成一套设计系统，没有 UI 框架，也没有 Tailwind。
            </p>
            <p className="mx-land__copyright">{COPYRIGHT}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
