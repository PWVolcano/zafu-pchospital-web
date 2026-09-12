import type { Metadata } from "next";

import { PageHead } from "@/components/layout/PageHead";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  joinExpectations,
  joinFlow,
  joinNotice,
  joinPage,
  joinPendingFields,
  joinSections,
} from "@/config/join";

export const metadata: Metadata = {
  title: "加入我们",
  description:
    "浙江农林大学电脑医院招新说明：我们希望新成员具备什么、加入流程是怎样的，以及当前阶段的内容边界。",
};

/**
 * /join 加入我们
 *
 * 本页目前是内容骨架：在线招新系统属于后续阶段，本阶段不实现。
 * 页面用设计系统既有的编号列表、步骤列表与提示框拼装，没有新增视觉语言。
 */

export default function JoinPage() {
  return (
    <>
      <PageHead
        id="join-page-title"
        index="03"
        label="Join"
        title={joinPage.title}
        lead={joinPage.lead}
      />

      {/* ------------------------------------------------ 我们希望你具备 */}
      <Section id="expect" labelledBy="join-expect-title">
        <SectionHead index={joinSections.expect.index} label={joinSections.expect.label} />
        <div className="sec-titlebar">
          <SectionTitle id="join-expect-title">{joinSections.expect.title}</SectionTitle>
        </div>

        <Reveal as="ol" className="principles" index={2}>
          {joinExpectations.map((item) => (
            <li key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </Section>

      {/* ---------------------------------------------------- 加入流程 */}
      <Section id="flow" labelledBy="join-flow-title">
        <SectionHead index={joinSections.flow.index} label={joinSections.flow.label} />
        <div className="sec-titlebar">
          <SectionTitle id="join-flow-title">{joinSections.flow.title}</SectionTitle>
          <Reveal as="p" className="sec-note" index={2}>
            流程用于说明大致节奏。具体时间安排以社团每学期发布的招新通知为准。
          </Reveal>
        </div>

        <ol className="steps">
          {joinFlow.map((step, index) => (
            <Reveal as="li" index={index} key={step.title}>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* ---------------------------------------------------- 加入须知 */}
      <Section id="notice" labelledBy="join-notice-title">
        <SectionHead index={joinSections.notice.index} label={joinSections.notice.label} />
        <SectionTitle id="join-notice-title">{joinSections.notice.title}</SectionTitle>

        <Reveal index={2}>
          <Card variant="notice">
            <span className="notice__badge">{joinNotice.badge}</span>
            <div className="notice__body">
              <h3>{joinNotice.title}</h3>
              {joinNotice.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal as="ol" className="principles mt-s-8" index={3}>
          {joinPendingFields.map((field) => (
            <li key={field}>
              <div>
                <strong>{field}</strong>
                <p>待社团确认后补入本页。</p>
              </div>
            </li>
          ))}
        </Reveal>
      </Section>
    </>
  );
}
