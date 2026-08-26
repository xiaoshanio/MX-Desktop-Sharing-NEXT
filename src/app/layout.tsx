import type { Metadata, Viewport } from "next";

import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { themeBootstrapScript } from "@/lib/theme";
import { Toaster } from "@/components/Toaster";

import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/shell.css";
import "@/styles/pages.css";
import "@/styles/room.css";
import "@/styles/landing.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: `基于 LiveKit 的桌面共享：${APP_TAGLINE}`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Matches --mx-bg-base in each theme so mobile browser chrome blends in.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#181818" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior: 首页的页内导航用 CSS 开了平滑滚动（landing.css，靠 :has()
    // 限定在首页）。Next 默认会在路由切换时强行关掉平滑滚动，这个属性是告诉它「我知道，
    // 别管」—— 不加则控制台每次都警告，且未来版本行为会变。
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Stamps data-theme before first paint so the palette never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        {children}
        {/* 全站共用的右上角提示栈。挂在最外层，弹窗里报的错也盖不住它。 */}
        <Toaster />
      </body>
    </html>
  );
}
