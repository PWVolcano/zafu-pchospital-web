import { Container } from "@/components/layout/Container";
import { siteConfig } from "@/config/site";

/**
 * Footer —— 全站统一页脚
 *
 * 对应设计基准的 `.footer`。首页与其他页面共用，不重复实现。
 */

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="footer__row">
          <span>{siteConfig.name} · 志愿技术服务</span>
          <span>{siteConfig.nameEn}</span>
          <span>{year}</span>
        </div>
        <p className="footer__note">
          本站为浙江农林大学电脑医院社团官方站点，页面中涉及的文档目录与正文均来自公开文档仓库{" "}
          <a href={siteConfig.docRepo.url} target="_blank" rel="noopener noreferrer">
            {siteConfig.docRepo.name}
          </a>
          （作者 {siteConfig.docRepo.author}，由 mdBook 构建）。
        </p>
      </Container>
    </footer>
  );
}
