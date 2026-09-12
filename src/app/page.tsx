import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection } from "@/components/home/ContactSection";
import { DocsSection } from "@/components/home/DocsSection";
import { Hero } from "@/components/home/Hero";
import { ProcessSection } from "@/components/home/ProcessSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { Ticker } from "@/components/home/Ticker";

/**
 * 首页
 *
 * 保留设计基准的完整区块顺序：首屏 → 跑马灯 → 关于 → 服务 → 流程 → 文档 → 联系。
 * 区块视觉与设计基准一致，文案数据来自 src/config/home.ts 与 src/config/site.ts。
 */

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ticker />
      <AboutSection />
      <ServicesSection />
      <ProcessSection />
      <DocsSection />
      <ContactSection />
    </>
  );
}
