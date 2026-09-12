import { Icon } from "@/components/ui/Icon";
import { type DocListItem } from "@/lib/docs";

/**
 * DocList —— 文档目录列表
 *
 * 对应设计基准中 docs 区块的 `.docpreview__list`。
 * 首页的文档预览与 /docs 入口页共用同一实现。
 *
 * 已就绪条目跳转到文档仓库的源文件；待撰写条目为不可点击的状态展示。
 */

export type DocListProps = {
  items: readonly DocListItem[];
  /** 由 path 生成外链地址（由调用方决定指向仓库还是正式文档站） */
  resolveHref?: (path: string) => string;
};

export function DocList({ items, resolveHref }: DocListProps) {
  return (
    <ul className="docpreview__list">
      {items.map((item, index) => {
        const key = `${item.type}-${item.title}-${index}`;

        if (item.type === "group") {
          return (
            <li className="docpreview__group" key={key}>
              {item.title}
            </li>
          );
        }

        const clickable = !item.pending && Boolean(item.path) && Boolean(resolveHref);

        return (
          <li key={key}>
            {clickable ? (
              <a
                className="docpreview__item"
                href={resolveHref?.(item.path as string)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="fileText" />
                <span>{item.title}</span>
              </a>
            ) : (
              <span className="docpreview__item is-pending" title="该文档尚未撰写">
                <Icon name="fileText" />
                <span>{item.title}</span>
                <em>待撰写</em>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
