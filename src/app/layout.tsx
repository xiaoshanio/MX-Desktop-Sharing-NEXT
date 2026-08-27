import type { Metadata, Viewport } from "next";

import { I18nProvider, LOCALE_HTML_LANG } from "@/i18n";
import { serverLocale } from "@/i18n/server";
import { getT } from "@/i18n/translate";
import { APP_NAME } from "@/lib/brand";
import { themeBootstrapScript } from "@/lib/theme";
import { MotionProvider } from "@/components/MotionProvider";
import { Toaster } from "@/components/Toaster";

import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/shell.css";
import "@/styles/pages.css";
import "@/styles/room.css";
import "@/styles/landing.css";

/**
 * metadata 也跟着语言走，所以必须是 generateMetadata 而不是静态导出 ——
 * 标题和描述会出现在分享卡片和搜索结果里，那两处用错语言比界面里更刺眼。
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await serverLocale());
  return {
    title: APP_NAME,
    description: `${APP_NAME} · ${t("brand.tagline")}`,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Matches --mx-bg-base in each theme so mobile browser chrome blends in.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#181818" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /**
   * 语言在服务端定好：cookie（用户显式选过的）→ Accept-Language（跟随系统）→ 英语。
   *
   * 必须在这里算而不是在客户端读 navigator：<html lang> 和首帧文案都得是对的，
   * 否则每次打开都会先闪一下另一种语言，读屏器也会先按错的语言念。
   */
  const locale = await serverLocale();

  return (
    // data-scroll-behavior: 首页的页内导航用 CSS 开了平滑滚动（landing.css，靠 :has()
    // 限定在首页）。Next 默认会在路由切换时强行关掉平滑滚动，这个属性是告诉它「我知道，
    // 别管」—— 不加则控制台每次都警告，且未来版本行为会变。
    <html
      lang={LOCALE_HTML_LANG[locale]}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Stamps data-theme before first paint so the palette never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <I18nProvider locale={locale}>
          {/* 全站动效层的启动器：初始化 GSAP、每次换页重新扫一遍要进场的元素。
              自己不渲染任何标记，怎么动全在 lib/motion.ts 那张表里。 */}
          <MotionProvider />
          {children}
          {/* 全站共用的右上角提示栈。挂在最外层，弹窗里报的错也盖不住它。 */}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
