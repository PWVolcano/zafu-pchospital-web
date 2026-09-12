import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SiteEffects } from "@/components/layout/SiteEffects";
import { siteConfig } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · 社团综合服务平台`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["浙江农林大学", "电脑医院", "电脑维修", "清灰", "校园网", "学生社团", "志愿技术服务"],
  openGraph: {
    title: `${siteConfig.name} · 社团综合服务平台`,
    description: "志愿性计算机技术服务，以及一套公开可查的维修与排障文档。",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  themeColor: "#151412",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans-CN" suppressHydrationWarning>
      <body id="top">
        {/* 脚本可用时才启用 .reveal 的初始隐藏态，避免无脚本环境内容不可见。
            这段脚本会在 hydration 之前给 <html> 加上 js 类，因此根元素需要
            suppressHydrationWarning（Next.js 对文档级脚本的标准做法）。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js');",
          }}
        />

        <a className="skip-link" href="#main">
          跳到正文
        </a>

        <SiteEffects />
        <Header />

        <main id="main">{children}</main>

        <Footer />
      </body>
    </html>
  );
}
