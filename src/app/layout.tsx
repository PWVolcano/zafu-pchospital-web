import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SiteEffects } from "@/components/layout/SiteEffects";
import { siteConfig } from "@/config/site";
import { DEFAULT_THEME_MODE, resolveTheme } from "@/config/theme";
import { buildThemeBootstrapScript } from "@/lib/theme";

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
  /* 取默认模式对应主题的底色。用户切换模式后，由主题运行时实时改这个 meta。 */
  themeColor: resolveTheme(DEFAULT_THEME_MODE).browserThemeColor,
  /* 两个色系都声明，避免 UA 强行锁定某一种；实际生效值由 CSS 的 color-scheme
     决定 —— 它写在各自的主题段里（见 globals.css 主题层）。 */
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans-CN" suppressHydrationWarning>
      <body id="top">
        {/* 主题引导脚本：必须在任何内容绘制之前同步执行，把 data-mode / data-theme
            写到 <html> 上（本地保存的偏好 → 否则跟随系统 → 否则默认模式）。
            这样刷新时不会先出现正常模式再跳成深色；属性在 hydration 之前就已存在，
            也不会产生 mismatch。脚本内容由 config/theme.ts 的注册表生成，
            主题名不在这里硬编码。 */}
        <script dangerouslySetInnerHTML={{ __html: buildThemeBootstrapScript() }} />

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
