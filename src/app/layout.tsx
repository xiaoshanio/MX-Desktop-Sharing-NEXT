import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MX Desktop Sharing",
  description: "基于 LiveKit 的桌面共享：一房一节点，一人一推流地址",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
