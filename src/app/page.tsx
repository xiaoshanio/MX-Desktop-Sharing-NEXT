import type { Metadata } from "next";
import Link from "next/link";

import { currentUser } from "@/lib/auth";
import { RichText, type MessageKey } from "@/i18n";
import { serverT } from "@/i18n/server";
import { APP_NAME, COPYRIGHT } from "@/lib/brand";
import { BrandMark } from "@/components/BrandMark";
import { ClosingStage } from "@/components/ClosingStage";
import { LandingBarFit } from "@/components/LandingBarFit";
import { LandingMotion } from "@/components/LandingMotion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon, LinkButton, type IconName } from "@/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: `${APP_NAME} · ${t("brand.tagline")}`,
    description: t("landing.meta.description"),
  };
}

const REPO = "https://github.com/xiaoshanio/MX-Desktop-Sharing-NEXT";
const DOC_DEPLOY = `${REPO}/blob/main/DEPLOY.md`;
const DOC_README = `${REPO}/blob/main/README.md`;
/** 「提出问题」和「联系我们」都落到这里 —— 本项目没有单独的邮箱或表单。 */
const ISSUES = `${REPO}/issues/new`;
const DISCUSSIONS = `${REPO}/discussions`;

/** 还在构想阶段的桌面端产品名。刻意和本站的名字区分开，别让人以为已经能下载了。 */
const APP_PRODUCT = "MX-Desktop-Sharing-APP";

const NAV: Array<{ href: string; key: MessageKey }> = [
  { href: "#paths", key: "landing.nav.paths" },
  { href: "#quota", key: "landing.nav.quota" },
  { href: "#features", key: "landing.nav.features" },
  { href: "#start", key: "landing.nav.start" },
  { href: "#app", key: "landing.nav.app" },
  { href: "#qa", key: "landing.nav.qa" },
];

/** 首屏那张拓扑图里的假数据。房间码用的是真实字母表（无歧义字符）。 */
const TOPOLOGY: Array<{
  nameKey: MessageKey;
  tagKey: MessageKey;
  url: string;
  rooms: Array<{ code: string; online?: number }>;
}> = [
  {
    nameKey: "landing.topo.nodeA",
    tagKey: "landing.topo.nodeATag",
    url: "wss://your-project.livekit.cloud",
    rooms: [{ code: "7K3M9Q", online: 3 }, { code: "B2W8XR" }],
  },
  {
    nameKey: "landing.topo.nodeB",
    tagKey: "landing.topo.nodeBTag",
    url: "wss://her-project.livekit.cloud",
    rooms: [{ code: "QF4L2N", online: 1 }],
  },
  {
    nameKey: "landing.topo.builtin",
    tagKey: "landing.topo.builtinTag",
    url: "wss://mx-builtin.livekit.cloud",
    rooms: [{ code: "M9ZP6T", online: 5 }],
  },
];

const FEATURES: Array<{ icon: IconName; title: MessageKey; body: MessageKey }> = [
  { icon: "shield", title: "landing.feat.auth.title", body: "landing.feat.auth.body" },
  { icon: "node", title: "landing.feat.nodes.title", body: "landing.feat.nodes.body" },
  { icon: "broadcast", title: "landing.feat.whip.title", body: "landing.feat.whip.body" },
  { icon: "ban", title: "landing.feat.gate.title", body: "landing.feat.gate.body" },
  { icon: "film", title: "landing.feat.sync.title", body: "landing.feat.sync.body" },
  { icon: "link", title: "landing.feat.invite.title", body: "landing.feat.invite.body" },
  { icon: "key", title: "landing.feat.env.title", body: "landing.feat.env.body" },
  { icon: "logs", title: "landing.feat.health.title", body: "landing.feat.health.body" },
];

/** 50 GB 下行是主要瓶颈。数字的推导过程见 README 的「免费额度能用多久」。 */
const QUOTA_ROWS: Array<{ rate: string; note: MessageKey; minutes: string; hours: string }> = [
  { rate: "4 Mbps", note: "landing.quota.note4", minutes: "1,667", hours: "≈ 28 h" },
  { rate: "2.5 Mbps", note: "landing.quota.note25", minutes: "2,667", hours: "≈ 44 h" },
  { rate: "1.5 Mbps", note: "landing.quota.note15", minutes: "4,444", hours: "≈ 74 h" },
  { rate: "0.8 Mbps", note: "landing.quota.note08", minutes: "5,000", hours: "≈ 83 h" },
];

/**
 * 桌面端预告里那四条。
 *
 * 全部用「打算」「考虑」的语气 —— 这个产品一行代码都还没写，
 * 写成既成事实会变成假承诺。
 */
const APP_IDEAS: Array<{ icon: IconName; title: MessageKey; body: MessageKey }> = [
  { icon: "shield", title: "landing.app.idea1.title", body: "landing.app.idea1.body" },
  { icon: "node", title: "landing.app.idea2.title", body: "landing.app.idea2.body" },
  { icon: "share", title: "landing.app.idea3.title", body: "landing.app.idea3.body" },
  { icon: "signal", title: "landing.app.idea4.title", body: "landing.app.idea4.body" },
];

/**
 * 首页 Q&A。
 *
 * 每一条都能在 README / 代码里落到实处 —— 这一节最容易变成软广，
 * 所以只收「真的会被问到、且答案是确定的」问题，不写「我们致力于……」那种话。
 */
const QA: Array<{ q: MessageKey; a: MessageKey }> = [
  { q: "landing.qa.q1", a: "landing.qa.a1" },
  { q: "landing.qa.q2", a: "landing.qa.a2" },
  { q: "landing.qa.q3", a: "landing.qa.a3" },
  { q: "landing.qa.q4", a: "landing.qa.a4" },
  { q: "landing.qa.q5", a: "landing.qa.a5" },
  { q: "landing.qa.q6", a: "landing.qa.a6" },
  { q: "landing.qa.q7", a: "landing.qa.a7" },
  { q: "landing.qa.q8", a: "landing.qa.a8" },
];

export default async function HomePage() {
  const t = await serverT();

  // 首页必须在库没配好、连不上的时候也能打开 —— 它正是那种情况下唯一还能读的东西。
  // 所以这里只把「有没有登录」当作装饰信息，取不到就按未登录渲染。
  const user = await currentUser().catch(() => null);
  const entryHref = user ? "/dashboard" : "/login";
  const entryLabel = user ? t("landing.entry.console") : t("landing.entry.login");

  return (
    <div className="mx-land">
      {/* 首屏那条时间线 + 顶栏投影 + 在线点呼吸，全在这个组件里（不渲染任何标记）。
          「滚到就淌进来」那部分是全站通用的，由 layout 里的 MotionProvider 负责。 */}
      <LandingMotion />

      <header className="mx-land__bar mx-acrylic">
        {/* 顶栏的「装不下就砍次要项」由 LandingBarFit 量着办，见那个组件的注释 */}
        <LandingBarFit>
          <Link href="/" className="mx-land__brand">
            <BrandMark size={28} />
            <span className="mx-land__brand-name">{APP_NAME}</span>
          </Link>

          <nav className="mx-land__nav" aria-label={t("landing.nav.label")}>
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="mx-land__nav-link">
                {t(item.key)}
              </a>
            ))}
          </nav>

          <div className="mx-land__bar-actions">
            {/* 语言在主题左边（手机端整个隐藏，见 landing.css） */}
            <LanguageSwitcher />

            {/* GitHub 图标必须活到最后，所以它不在 .mx-land__secondary 里 */}
            <span className="mx-land__secondary">
              <ThemeToggle />
            </span>

            <a
              className="mx-icon-button"
              href={REPO}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t("landing.bar.github")}
              title={t("landing.bar.github")}
            >
              <Icon name="github" size={18} />
            </a>

            <span className="mx-land__secondary">
              <LinkButton href={entryHref} variant="primary" size="sm">
                {entryLabel}
              </LinkButton>
            </span>
          </div>
        </LandingBarFit>
      </header>

      <main>
        {/* ---------- 首屏 ---------- */}
        <section className="mx-land__hero">
          <div className="mx-land__measure mx-land__hero-inner">
            <div className="mx-land__hero-copy">
              <span className="mx-land__tag">
                <BrandMark size={16} />
                <RichText text={t("landing.hero.tag")} />
              </span>

              <h1 className="mx-land__h1">
                {t("landing.hero.h1a")}
                <em>{t("landing.hero.h1b")}</em>
              </h1>

              <p className="mx-land__hero-lead">{t("landing.hero.lead")}</p>

              <div className="mx-land__cta">
                <LinkButton href={entryHref} variant="primary" size="lg">
                  {entryLabel}
                  <Icon name="chevronRight" size={16} />
                </LinkButton>
                <LinkButton href={DOC_DEPLOY} size="lg" target="_blank" rel="noreferrer noopener">
                  {t("landing.hero.deploy")}
                  <Icon name="external" size={15} />
                </LinkButton>
              </div>

              <ul className="mx-land__facts">
                <li>
                  <Icon name="check" size={14} />
                  {t("landing.hero.fact1")}
                </li>
                <li>
                  <Icon name="check" size={14} />
                  {t("landing.hero.fact2")}
                </li>
                <li>
                  <Icon name="check" size={14} />
                  {t("landing.hero.fact3")}
                </li>
              </ul>
            </div>

            {/* 首屏配图就是这套架构本身：节点在外层，房间挂在它下面。 */}
            <div className="mx-land__topo">
              <div className="mx-land__topo-bar">
                <span className="mx-land__topo-title">{t("landing.topo.title")}</span>
                <span className="mx-land__topo-hint">{t("landing.topo.hint")}</span>
              </div>

              {TOPOLOGY.map((node) => (
                <article className="mx-land__node" key={node.nameKey}>
                  <div className="mx-land__node-top">
                    <span className="mx-land__node-icon">
                      <Icon name="node" size={15} />
                    </span>
                    <span className="mx-land__node-name">{t(node.nameKey)}</span>
                    <span className="mx-land__node-tag">{t(node.tagKey)}</span>
                  </div>
                  <span className="mx-land__node-url">{node.url}</span>
                  <div className="mx-land__rooms">
                    {node.rooms.map((room) => (
                      <span
                        className="mx-land__room"
                        key={room.code}
                        data-live={room.online ? "true" : undefined}
                      >
                        <span className="mx-land__room-dot" />
                        <code>{room.code}</code>
                        {room.online
                          ? t("landing.topo.online", { count: room.online })
                          : t("landing.topo.idle")}
                      </span>
                    ))}
                  </div>
                </article>
              ))}

              <p className="mx-land__topo-foot">{t("landing.topo.foot")}</p>
            </div>
          </div>
        </section>

        {/* ---------- 两条推流路线 ---------- */}
        <section className="mx-land__section" id="paths">
          <div className="mx-land__measure">
            <div className="mx-land__head" data-mx-reveal="rise">
              <span className="mx-land__eyebrow">{t("landing.paths.eyebrow")}</span>
              <h2 className="mx-land__h2">{t("landing.paths.h2")}</h2>
              <p className="mx-land__lead">{t("landing.paths.lead")}</p>
            </div>

            <div className="mx-land__paths" data-mx-stagger>
              <article className="mx-land__path">
                <div className="mx-land__path-top">
                  <Icon name="share" size={18} />
                  <h3 className="mx-land__path-title">{t("landing.paths.browser.title")}</h3>
                </div>
                <div className="mx-land__hops">
                  <span className="mx-land__hop">{t("landing.paths.hopBrowser")}</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop">getDisplayMedia</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop" data-strong="true">
                    {t("landing.paths.hopNode")}
                  </span>
                </div>
                <p className="mx-land__path-body">{t("landing.paths.browser.body")}</p>
              </article>

              <article className="mx-land__path">
                <div className="mx-land__path-top">
                  <Icon name="broadcast" size={18} />
                  <h3 className="mx-land__path-title">{t("landing.paths.obs.title")}</h3>
                </div>
                <div className="mx-land__hops">
                  <span className="mx-land__hop">OBS</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop">{t("landing.paths.hopWhip")}</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop">Ingress</span>
                  <span className="mx-land__hop-sep">
                    <Icon name="chevronRight" size={13} />
                  </span>
                  <span className="mx-land__hop" data-strong="true">
                    {t("landing.paths.hopNode")}
                  </span>
                </div>
                <p className="mx-land__path-body">{t("landing.paths.obs.body")}</p>
              </article>
            </div>
          </div>
        </section>

        {/* ---------- 免费额度实算 ---------- */}
        <section className="mx-land__section" id="quota" data-tint="true">
          <div className="mx-land__measure">
            <div className="mx-land__head" data-mx-reveal="rise">
              <span className="mx-land__eyebrow">{t("landing.quota.eyebrow")}</span>
              <h2 className="mx-land__h2">{t("landing.quota.h2")}</h2>
            </div>

            <div className="mx-land__quota">
              <div>
                <p className="mx-land__lead">{t("landing.quota.lead")}</p>

                <div className="mx-land__tiles" data-mx-stagger>
                  <div className="mx-land__tile">
                    <span className="mx-land__tile-value">5,000</span>
                    <span className="mx-land__tile-label">{t("landing.quota.tile1Label")}</span>
                  </div>
                  <div className="mx-land__tile">
                    <span className="mx-land__tile-value">50 GB</span>
                    <span className="mx-land__tile-label">{t("landing.quota.tile2Label")}</span>
                  </div>
                  <div className="mx-land__tile">
                    <span className="mx-land__tile-value">
                      {t("landing.quota.tile3Value")}
                    </span>
                    <span className="mx-land__tile-label">{t("landing.quota.tile3Label")}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mx-table-wrap" data-mx-reveal="rise">
                  <table className="mx-table">
                    <thead>
                      <tr>
                        <th>{t("landing.quota.colRate")}</th>
                        <th data-align="right">{t("landing.quota.colMinutes")}</th>
                        <th data-align="right">{t("landing.quota.colHours")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {QUOTA_ROWS.map((row) => (
                        <tr key={row.rate}>
                          <td>
                            <div className="mx-cell">
                              <span className="mx-cell__label">{row.rate}</span>
                              <span className="mx-cell__hint">{t(row.note)}</span>
                            </div>
                          </td>
                          <td data-align="right">{row.minutes}</td>
                          <td data-align="right">{row.hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mx-land__table-note">{t("landing.quota.tableNote")}</p>

                <p className="mx-land__punch">
                  <span>
                    <RichText text={t("landing.quota.punch")} />
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 功能 ---------- */}
        <section className="mx-land__section" id="features">
          <div className="mx-land__measure">
            <div className="mx-land__head" data-mx-reveal="rise">
              <span className="mx-land__eyebrow">{t("landing.features.eyebrow")}</span>
              <h2 className="mx-land__h2">{t("landing.features.h2")}</h2>
              <p className="mx-land__lead">{t("landing.features.lead")}</p>
            </div>

            <div className="mx-land__features" data-mx-stagger>
              {FEATURES.map((feature) => (
                <article className="mx-land__feature" key={feature.title}>
                  <span className="mx-land__feature-icon">
                    <Icon name={feature.icon} size={18} />
                  </span>
                  <h3 className="mx-land__feature-title">{t(feature.title)}</h3>
                  <p className="mx-land__feature-body">
                    <RichText text={t(feature.body)} />
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 快速开始 ---------- */}
        <section className="mx-land__section" id="start">
          <div className="mx-land__measure">
            <div className="mx-land__head" data-mx-reveal="rise">
              <span className="mx-land__eyebrow">{t("landing.start.eyebrow")}</span>
              <h2 className="mx-land__h2">{t("landing.start.h2")}</h2>
              <p className="mx-land__lead">{t("landing.start.lead")}</p>
            </div>

            <div className="mx-land__steps" data-mx-stagger>
              <article className="mx-land__step">
                <span className="mx-land__step-num">1</span>
                <div className="mx-land__step-body">
                  <h3 className="mx-land__step-title">{t("landing.start.step1Title")}</h3>
                  <p>
                    <RichText text={t("landing.start.step1Body")} codeClassName="mx-code" />
                  </p>
                  <pre className="mx-land__pre">
                    <b>DATABASE_URL</b>=postgresql://…@ep-xxx-pooler…/neondb?sslmode=require{"\n"}
                    <b>ADMIN_PASSWORD</b>={t("landing.start.passwordPlaceholder")}
                  </pre>
                </div>
              </article>

              <article className="mx-land__step">
                <span className="mx-land__step-num">2</span>
                <div className="mx-land__step-body">
                  <h3 className="mx-land__step-title">{t("landing.start.step2Title")}</h3>
                  <pre className="mx-land__pre">
                    npm install{"\n"}
                    npm run db:migrate <i>{t("landing.start.step2Comment")}</i>
                    {"\n"}
                    npm run dev
                  </pre>
                  <p>
                    <RichText text={t("landing.start.step2Body")} codeClassName="mx-code" />
                  </p>
                </div>
              </article>

              <article className="mx-land__step">
                <span className="mx-land__step-num">3</span>
                <div className="mx-land__step-body">
                  <h3 className="mx-land__step-title">{t("landing.start.step3Title")}</h3>
                  <p>
                    <RichText text={t("landing.start.step3Body1")} codeClassName="mx-code" />
                  </p>
                  <p>
                    <RichText text={t("landing.start.step3Body2")} codeClassName="mx-code" />
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ---------- 桌面端预告 ---------- */}
        <section className="mx-land__section" id="app" data-tint="true">
          <div className="mx-land__measure">
            <div className="mx-land__head" data-mx-reveal="rise">
              <span className="mx-land__eyebrow">{t("landing.app.eyebrow")}</span>
              <h2 className="mx-land__h2">
                {t("landing.app.h2a")}
                <em>{APP_PRODUCT}</em>
              </h2>
              <p className="mx-land__lead">{t("landing.app.lead")}</p>
            </div>

            <div className="mx-land__teaser">
              <div className="mx-land__teaser-note" data-mx-reveal="rise">
                <span className="mx-land__teaser-badge">
                  <Icon name="sparkle" size={13} />
                  {t("landing.app.badge")}
                </span>
                <p>
                  <RichText text={t("landing.app.note")} />
                </p>
              </div>

              <div className="mx-land__teaser-grid" data-mx-stagger>
                {APP_IDEAS.map((idea) => (
                  <article className="mx-land__teaser-card" key={idea.title}>
                    <span className="mx-land__teaser-icon">
                      <Icon name={idea.icon} size={17} />
                    </span>
                    <h3 className="mx-land__teaser-title">{t(idea.title)}</h3>
                    <p className="mx-land__teaser-body">{t(idea.body)}</p>
                  </article>
                ))}
              </div>

              <div className="mx-land__teaser-foot" data-mx-reveal="rise">
                <p>
                  <RichText text={t("landing.app.footNote")} />
                </p>
                <div className="mx-land__cta">
                  <LinkButton
                    href={ISSUES}
                    variant="primary"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Icon name="logs" size={15} />
                    {t("landing.app.issues")}
                  </LinkButton>
                  <LinkButton href={DISCUSSIONS} target="_blank" rel="noreferrer noopener">
                    <Icon name="mail" size={15} />
                    {t("landing.app.contact")}
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
            <div className="mx-land__head" data-mx-reveal="rise">
              <span className="mx-land__eyebrow">{t("landing.qa.eyebrow")}</span>
              <h2 className="mx-land__h2">{t("landing.qa.h2")}</h2>
              <p className="mx-land__lead">{t("landing.qa.lead")}</p>
            </div>

            {/*
              原生 <details> 而不是自己写一套折叠：这是服务端组件，没有 JS 也要能展开，
              键盘和读屏器的行为浏览器已经做对了。
            */}
            <div className="mx-land__qa" data-mx-stagger>
              {QA.map((item) => (
                <details className="mx-land__qa-item" key={item.q}>
                  <summary className="mx-land__qa-q">
                    <span className="mx-land__qa-chevron">
                      <Icon name="chevronRight" size={15} />
                    </span>
                    {t(item.q)}
                  </summary>
                  <div className="mx-land__qa-a">
                    <RichText text={t(item.a)} codeClassName="mx-code" />
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 收尾 ---------- */}
        <section className="mx-land__section" id="closing">
          <div className="mx-land__measure">
            <ClosingStage>
              <span className="mx-land__stage-badge">
                <BrandMark size={16} />
                {t("landing.closing.badge")}
              </span>

              <h2 className="mx-land__stage-title">{t("landing.closing.h2")}</h2>

              <p className="mx-land__stage-lead">{t("landing.closing.body")}</p>

              {/* 真的就是这三步 —— 房间码发出去，对方打开链接就在同一个房间里了 */}
              <ol className="mx-land__stage-steps">
                <li className="mx-land__stage-step">
                  <b>1</b>
                  {t("landing.closing.step1")}
                </li>
                <li className="mx-land__stage-step">
                  <b>2</b>
                  {t("landing.closing.step2")}
                </li>
                <li className="mx-land__stage-step">
                  <b>3</b>
                  {t("landing.closing.step3")}
                </li>
              </ol>

              <div className="mx-land__cta">
                <LinkButton href={entryHref} variant="primary" size="lg">
                  {entryLabel}
                  <Icon name="chevronRight" size={16} />
                </LinkButton>
                <LinkButton href={REPO} size="lg" target="_blank" rel="noreferrer noopener">
                  <Icon name="github" size={16} />
                  {t("landing.closing.source")}
                </LinkButton>
              </div>
            </ClosingStage>
          </div>
        </section>
      </main>

      <footer className="mx-land__footer">
        <div className="mx-land__measure mx-land__footer-inner">
          <span className="mx-land__footer-brand">
            <BrandMark size={20} />
            {APP_NAME}
          </span>

          <nav className="mx-land__footer-links" aria-label={t("landing.footer.links")}>
            <a href={DOC_README} target="_blank" rel="noreferrer noopener">
              {t("landing.footer.docs")}
              <Icon name="external" size={13} />
            </a>
            <a href={DOC_DEPLOY} target="_blank" rel="noreferrer noopener">
              {t("landing.footer.deploy")}
              <Icon name="external" size={13} />
            </a>
            <a href={REPO} target="_blank" rel="noreferrer noopener">
              GitHub
              <Icon name="external" size={13} />
            </a>
            <a href="https://docs.livekit.io" target="_blank" rel="noreferrer noopener">
              {t("landing.footer.livekit")}
              <Icon name="external" size={13} />
            </a>
          </nav>

          <div className="mx-land__footer-note">
            <p className="mx-land__stack">
              {t("landing.footer.stack")}{" "}
              <a href="https://player.freeanime.org" target="_blank" rel="noreferrer noopener">
                MX Player Pro
                <Icon name="external" size={13} />
              </a>
            </p>
            <p className="mx-land__copyright">{COPYRIGHT}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
