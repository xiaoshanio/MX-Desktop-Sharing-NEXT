import type { Metadata, Viewport } from "next";

import { themeBootstrapScript } from "@/lib/theme";

import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/shell.css";
import "@/styles/pages.css";

export const metadata: Metadata = {
  title: "MX 桌面共享",
  description: "基于 LiveKit 的桌面共享：一房一节点，一人一推流地址",
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Stamps data-theme before first paint so the palette never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
