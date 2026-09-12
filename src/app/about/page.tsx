import type { Metadata } from "next";

import { PageHead } from "@/components/layout/PageHead";
import { ChannelList } from "@/components/ui/ChannelList";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ServiceList } from "@/components/ui/ServiceList";
import { aboutPage, aboutSections } from "@/config/about";
import { principles, services } from "@/config/home";
import { contactChannels, quickLinks } from "@/config/site";

export const metadata: Metadata = {
  title: "关于我们",
  description: "浙江农林大学电脑医院社团介绍、服务范围与联系方式。志愿性计算机技术服务，不收费。",
};

/**
 * /about 关于我们
 *
 * 内容结构：社团介绍 → 服务范围 → 联系方式。
 * 页面视觉全部由设计系统的既有组件拼装（PageHead / ServiceList / ChannelList / Card），
 * 没有新增任何视觉语言。
 */

export default function AboutPage() {
  return (
    <>
      <PageHead
        id="about-page-title"
        index="02"
        label="About"
        title={aboutPage.title}
        lead={aboutPage.lead}
      />

      {/* ---------------------------------------------------- 社团介绍 */}
      <Section id="intro" labelledBy="about-intro-title">
        <SectionHead index={aboutSections.intro.index} label={aboutSections.intro.label} />
        <div className="sec-titlebar">
          <SectionTitle id="about-intro-title">{aboutSections.intro.title}</SectionTitle>
        </div>

        <div className="about__grid">
          <div>
            {aboutPage.intro.map((paragraph, index) => (
              <Reveal
                as="p"
                className={index === 0 ? "lead" : "muted"}
                index={index + 2}
                key={paragraph}
              >
                {paragraph}
              </Reveal>
            ))}
          </div>

          <Reveal as="ol" className="principles" index={2}>
            {principles.map((item) => (
              <li key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </div>

        <Reveal as="ol" className="principles mt-s-8" index={3}>
          {aboutPage.pendingFields.map((field) => (
            <li key={field}>
              <div>
                <strong>{field}</strong>
                <p>待社团确认后补入本页。</p>
              </div>
            </li>
          ))}
        </Reveal>
      </Section>

      {/* ---------------------------------------------------- 服务范围 */}
      <Section id="scope" labelledBy="about-scope-title">
        <SectionHead index={aboutSections.scope.index} label={aboutSections.scope.label} />
        <div className="sec-titlebar">
          <SectionTitle id="about-scope-title">{aboutSections.scope.title}</SectionTitle>
          <Reveal as="p" className="sec-note" index={2}>
            状态标签对应文档仓库里的实际完成度。标注「文档撰写中」的条目我们已经能做，只是整理成文的进度还没跟上。
          </Reveal>
        </div>

        <ServiceList items={services} />
      </Section>

      {/* ---------------------------------------------------- 联系方式 */}
      <Section id="contact" labelledBy="about-contact-title">
        <SectionHead index={aboutSections.contact.index} label={aboutSections.contact.label} />
        <SectionTitle id="about-contact-title">{aboutSections.contact.title}</SectionTitle>

        <div className="about__grid">
          <Reveal index={2}>
            <h3 className="eyebrow" style={{ margin: "0 0 var(--s-4)" }}>
              求助渠道
            </h3>
            <ChannelList items={contactChannels} />
          </Reveal>

          <Reveal index={3}>
            <h3 className="eyebrow" style={{ margin: "0 0 var(--s-4)" }}>
              常用入口
            </h3>
            <ChannelList items={quickLinks} />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
