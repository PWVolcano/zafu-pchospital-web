import type { Metadata } from "next";

import { DocList } from "@/components/docs/DocList";
import { DocReadout } from "@/components/docs/DocReadout";
import { PageHead } from "@/components/layout/PageHead";
import { ChannelList } from "@/components/ui/ChannelList";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { siteConfig, type LinkItem } from "@/config/site";
import { docPageUrl, docTree, flattenDocTree } from "@/lib/docs";

export const metadata: Metadata = {
  title: "技术文档",
  description:
    "ZAFU-PCHospital-Doc 技术文档入口：校园网认证、硬件维修与保养、系统与驱动等条目的目录与就绪状态。",
};

/**
 * /docs 技术文档入口
 *
 * 技术文档由独立仓库维护，并在官网构建时生成到同域 /handbook/，
 * 本页只做入口与目录展示：
 * - 入口：同域文档站、源文件仓库、Issue 入口
 * - 目录：读取 src/data/doc-manifest.json，展示条目与就绪状态
 *
 * 已就绪条目在当前标签页进入同域 mdBook，源文件仓库仍作为独立外链保留。
 */

const docEntranceSections = {
  entrance: { index: "02", label: "Entrance", title: "文档入口" },
  contents: { index: "03", label: "Contents", title: "目录与就绪状态" },
} as const;

const docChannels: readonly LinkItem[] = [
  {
    kind: "仓库",
    title: siteConfig.docRepo.name,
    description: "mdBook 源文件仓库，全部文档的正文与图片都来自这里",
    href: siteConfig.docRepo.url,
  },
  {
    kind: "文档站",
    title: "技术文档站",
    description: "在官网域名内阅读 mdBook 正文、搜索和章节导航",
    href: "/handbook/",
  },
  {
    kind: "贡献",
    title: "提交勘误与补充",
    description: "对文档内容有疑问或补充，可通过仓库的 Issue 反馈",
    href: `${siteConfig.docRepo.url}/issues`,
  },
];

export default function DocsPage() {
  const items = flattenDocTree(docTree);

  return (
    <>
      <PageHead
        id="docs-page-title"
        index="04"
        label="Docs"
        title="技术文档"
        lead="电脑医院把日常维修与排障经验整理成公开文档。这里提供目录、完成状态与贡献入口，已就绪条目可直接在官网内阅读。"
      />

      {/* ---------------------------------------------------- 文档入口 */}
      <Section id="entrance" labelledBy="docs-entrance-title">
        <SectionHead
          index={docEntranceSections.entrance.index}
          label={docEntranceSections.entrance.label}
        />
        <div className="sec-titlebar">
          <SectionTitle id="docs-entrance-title">{docEntranceSections.entrance.title}</SectionTitle>
        </div>

        <ChannelList items={docChannels} />
      </Section>

      {/* ------------------------------------------------ 目录与就绪状态 */}
      <Section id="contents" labelledBy="docs-contents-title">
        <SectionHead
          index={docEntranceSections.contents.index}
          label={docEntranceSections.contents.label}
        />
        <div className="sec-titlebar">
          <SectionTitle id="docs-contents-title">{docEntranceSections.contents.title}</SectionTitle>
          <Reveal as="p" className="sec-note" index={2}>
            目录来自文档仓库的构建清单。标注「撰写中」的条目尚未成文，我们已经在处理这些问题，只是整理进度还没跟上。
          </Reveal>
        </div>

        <div className="docs__grid">
          <div>
            <Reveal as="p" className="lead" index={2}>
              文档仓库按目录组织条目。点击已就绪条目会进入站内阅读页面；如需查看 Markdown
              源文件或提交勘误，可使用上方的仓库与 Issue 入口。
            </Reveal>
          </div>

          <DocReadout title="仓库状态" tag="MANIFEST" showGeneratedAt index={2} />
        </div>

        <Reveal className="docpreview" index={1}>
          <div className="docpreview__bar">
            <span className="docpreview__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>src/ · {siteConfig.docRepo.name}</span>
            <span>{siteConfig.docRepo.author}</span>
          </div>
          <DocList items={items} resolveHref={docPageUrl} />
        </Reveal>
      </Section>
    </>
  );
}
