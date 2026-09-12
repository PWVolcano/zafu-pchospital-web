import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { processNotice, processSteps } from "@/config/home";

/**
 * ProcessSection —— 首页「流程」区块
 *
 * 对应设计基准的 `.process`：带序号与连接线的纵向步骤列表，
 * 末尾是信号黄描边的客户须知提示框。
 */

export function ProcessSection() {
  return (
    <Section id="process" labelledBy="process-title">
      <SectionHead index="04" label="Process" />

      <div className="sec-titlebar">
        <SectionTitle id="process-title">一次送修会经历什么</SectionTitle>
        <Reveal as="p" className="sec-note" index={2}>
          流程来自《电医维修守则》。它既是给你看的，也是我们每次动手前自己对的表。
        </Reveal>
      </div>

      <ol className="steps">
        {processSteps.map((step, index) => (
          <Reveal as="li" index={index} key={step.title}>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </Reveal>
        ))}
      </ol>

      <Card variant="notice" className="reveal">
        <span className="notice__badge">{processNotice.badge}</span>
        <div className="notice__body">
          <h3>{processNotice.title}</h3>
          {processNotice.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Card>
    </Section>
  );
}
